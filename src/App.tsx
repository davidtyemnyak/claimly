import React, { useState, useEffect } from 'react';
import { supabase, UnclaimedProperty } from './lib/supabase';
import { parseCSV, convertCSVRecordToDBRecord, validateCSVRecord } from './utils/csvParser';
import { FileUpload } from './components/FileUpload';
import { PropertySearch } from './components/PropertySearch';
import { PropertyTable } from './components/PropertyTable';
import { GeocodingPanel } from './components/GeocodingPanel';
import { MapView } from './components/MapView';
import { AdminLogin } from './components/AdminLogin';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Database, Upload, Search, AlertCircle, CheckCircle, MapPin, Map, Shield } from 'lucide-react';

interface SearchFilters {
  ownerName: string;
  ownerCity: string;
  ownerState: string;
  propertyType: string;
  holderName: string;
  minAmount: string;
  maxAmount: string;
}

function AppContent() {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [properties, setProperties] = useState<UnclaimedProperty[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [activeTab, setActiveTab] = useState<'import' | 'search' | 'geocoding' | 'map' | 'admin'>('search');

  useEffect(() => {
    loadProperties();
  }, []);

  // Redirect non-admin users away from admin-only tabs
  useEffect(() => {
    if (!authLoading && !isAdmin && (activeTab === 'import' || activeTab === 'geocoding')) {
      setActiveTab('admin');
    }
  }, [isAdmin, authLoading, activeTab]);

  const loadProperties = async (filters?: SearchFilters) => {
    try {
      setIsSearching(true);
      setError(null);

      let query = supabase
        .from('unclaimed_properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters) {
        if (filters.ownerName) {
          query = query.ilike('owner_name', `%${filters.ownerName}%`);
        }
        if (filters.ownerCity) {
          query = query.ilike('owner_city', `%${filters.ownerCity}%`);
        }
        if (filters.ownerState) {
          query = query.ilike('owner_state', `%${filters.ownerState}%`);
        }
        if (filters.propertyType) {
          query = query.ilike('property_type', `%${filters.propertyType}%`);
        }
        if (filters.holderName) {
          query = query.ilike('holder_name', `%${filters.holderName}%`);
        }
        if (filters.minAmount) {
          query = query.gte('current_cash_balance', parseFloat(filters.minAmount));
        }
        if (filters.maxAmount) {
          query = query.lte('current_cash_balance', parseFloat(filters.maxAmount));
        }
      }

      const { data, error } = await query.limit(1000);

      if (error) {
        throw error;
      }

      setProperties(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load properties');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const text = await file.text();
      const csvRecords = parseCSV(text);

      if (csvRecords.length === 0) {
        throw new Error('No valid records found in CSV file');
      }

      // Validate records
      const validRecords = [];
      const errors = [];

      for (const record of csvRecords) {
        const recordErrors = validateCSVRecord(record);
        if (recordErrors.length === 0) {
          validRecords.push(convertCSVRecordToDBRecord(record));
        } else {
          errors.push(`Row with Property ID ${record.PROPERTY_ID}: ${recordErrors.join(', ')}`);
        }
      }

      if (validRecords.length === 0) {
        throw new Error('No valid records found. Please check your CSV format.');
      }

      // Insert records in batches using regular insert (not upsert)
      // since property_id is not unique per record
      const batchSize = 100;
      let insertedCount = 0;

      for (let i = 0; i < validRecords.length; i += batchSize) {
        const batch = validRecords.slice(i, i + batchSize);
        
        const { error: insertError } = await supabase
          .from('unclaimed_properties')
          .insert(batch);

        if (insertError) {
          throw insertError;
        }

        insertedCount += batch.length;
      }

      setSuccessMessage(
        `Successfully processed ${insertedCount} records. ${errors.length > 0 ? `${errors.length} records had errors.` : ''}`
      );
      
      setTotalRecords(insertedCount);
      await loadProperties();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import CSV file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (filters: SearchFilters) => {
    loadProperties(filters);
  };

  const tabs = [
    { id: 'search' as const, label: 'Search Properties', icon: Search, public: true },
    { id: 'map' as const, label: 'Map View', icon: Map, public: true },
    { id: 'import' as const, label: 'Import Data', icon: Upload, public: false },
    { id: 'geocoding' as const, label: 'Geocoding', icon: MapPin, public: false },
    { id: 'admin' as const, label: 'Admin', icon: Shield, public: true },
  ];

  const visibleTabs = tabs.filter(tab => tab.public || isAdmin);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                California Unclaimed Property Database
              </h1>
            </div>
            {isAdmin && (
              <div className="flex items-center space-x-2 text-sm text-green-600">
                <Shield className="h-4 w-4" />
                <span>Admin Mode</span>
              </div>
            )}
          </div>
          <p className="text-gray-600 max-w-2xl">
            Search through California unclaimed property records and view properties on an interactive map.
            {isAdmin && ' Administrator access enables data import and geocoding features.'}
          </p>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isDisabled = !tab.public && !isAdmin;
                return (
                  <button
                    key={tab.id}
                    onClick={() => !isDisabled && setActiveTab(tab.id)}
                    disabled={isDisabled}
                    className={`
                      flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : isDisabled
                        ? 'border-transparent text-gray-300 cursor-not-allowed'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {!tab.public && !isAdmin && (
                      <Shield className="h-3 w-3 text-gray-300" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className={activeTab === 'map' ? 'h-[calc(100vh-300px)]' : ''}>
          {activeTab === 'search' && (
            <>
              <div className="mb-8">
                <PropertySearch
                  onSearch={handleSearch}
                  isLoading={isSearching}
                />
              </div>
              <div className="mb-8">
                <PropertyTable
                  properties={properties}
                  isLoading={isSearching}
                />
              </div>
            </>
          )}

          {activeTab === 'map' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full">
              <MapView />
            </div>
          )}

          {activeTab === 'import' && isAdmin && (
            <div className="mb-8">
              <FileUpload
                onFileUpload={handleFileUpload}
                isLoading={isLoading}
                error={error}
              />
            </div>
          )}

          {activeTab === 'geocoding' && isAdmin && (
            <div className="mb-8">
              <GeocodingPanel />
            </div>
          )}

          {activeTab === 'admin' && (
            <div className="mb-8">
              <AdminLogin />
            </div>
          )}
        </div>

        {/* Footer Stats - Only show for non-map tabs */}
        {activeTab !== 'map' && totalRecords > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{totalRecords}</div>
                <div className="text-sm text-gray-500">Total Records Imported</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{properties.length}</div>
                <div className="text-sm text-gray-500">Current Search Results</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {properties.reduce((sum, prop) => sum + prop.current_cash_balance, 0).toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </div>
                <div className="text-sm text-gray-500">Total Value Displayed</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;