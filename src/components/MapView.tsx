import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { supabase, UnclaimedProperty } from '../lib/supabase';
import { Search, MapPin, DollarSign, Building, User, Loader, ZoomIn } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  searchQuery?: string;
}

interface PropertyWithCoordinates extends UnclaimedProperty {
  owner_latitude: number;
  owner_longitude: number;
}

// Component to fit map bounds to markers
const FitBounds: React.FC<{ properties: PropertyWithCoordinates[] }> = ({ properties }) => {
  const map = useMap();

  useEffect(() => {
    if (properties.length > 0) {
      const bounds = new LatLngBounds(
        properties.map(p => [p.owner_latitude, p.owner_longitude])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [map, properties]);

  return null;
};

// Component to zoom to selected property
const ZoomToProperty: React.FC<{ property: PropertyWithCoordinates | null }> = ({ property }) => {
  const map = useMap();

  useEffect(() => {
    if (property) {
      map.setView([property.owner_latitude, property.owner_longitude], 15, {
        animate: true,
        duration: 1
      });
    }
  }, [map, property]);

  return null;
};

export const MapView: React.FC<MapViewProps> = ({ searchQuery = '' }) => {
  const [properties, setProperties] = useState<PropertyWithCoordinates[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyWithCoordinates[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithCoordinates | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [error, setError] = useState<string | null>(null);

  // Load geocoded properties
  useEffect(() => {
    loadGeocodedProperties();
  }, []);

  // Filter properties based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProperties(properties);
    } else {
      const filtered = properties.filter(property =>
        property.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.holder_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.property_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.owner_city.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProperties(filtered);
    }
  }, [searchTerm, properties]);

  const loadGeocodedProperties = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('unclaimed_properties')
        .select('*')
        .not('owner_latitude', 'is', null)
        .not('owner_longitude', 'is', null)
        .order('current_cash_balance', { ascending: false })
        .limit(1000);

      if (error) {
        throw error;
      }

      setProperties(data as PropertyWithCoordinates[] || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load properties');
    } finally {
      setIsLoading(false);
    }
  };

  // Create custom icons based on property type and selection state
  const getPropertyIcon = (propertyType: string, isSelected: boolean = false) => {
    const typeCode = propertyType.split(':')[0];
    const colors = {
      'AC01': '#3B82F6', // blue
      'AC02': '#10B981', // green
      'CK01': '#8B5CF6', // purple
      'CK15': '#F59E0B', // orange
      'CK99': '#EF4444', // red
      'MS01': '#EAB308', // yellow
      'MS05': '#6366F1', // indigo
      'MS09': '#EC4899', // pink
      'MS11': '#14B8A6', // teal
      'MS16': '#06B6D4', // cyan
      'SC01': '#059669', // emerald
      'SC16': '#7C3AED', // violet
      'SC20': '#65A30D', // lime
      'TR04': '#D97706', // amber
      'IN02': '#F43F5E', // rose
      'IN03': '#64748B', // slate
      'IN05': '#71717A', // zinc
      'MI02': '#78716C', // stone
    };

    const color = colors[typeCode as keyof typeof colors] || '#6B7280';
    const size = isSelected ? [35, 57] : [25, 41];
    const anchor = isSelected ? [17, 57] : [12, 41];
    
    return new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg width="${size[0]}" height="${size[1]}" viewBox="0 0 ${size[0]} ${size[1]}" xmlns="http://www.w3.org/2000/svg">
          <path d="M${size[0]/2} 0C${size[0]*0.224} 0 0 ${size[0]*0.224} 0 ${size[0]/2}C0 ${size[0]*0.776} ${size[0]/2} ${size[1]} ${size[0]/2} ${size[1]}S${size[0]} ${size[0]*0.776} ${size[0]} ${size[0]/2}C${size[0]} ${size[0]*0.224} ${size[0]*0.776} 0 ${size[0]/2} 0Z" fill="${color}" stroke="${isSelected ? '#ffffff' : 'none'}" stroke-width="${isSelected ? '3' : '0'}"/>
          <circle cx="${size[0]/2}" cy="${size[0]/2}" r="${size[0]*0.24}" fill="white"/>
          <text x="${size[0]/2}" y="${size[0]*0.64}" text-anchor="middle" font-family="Arial" font-size="${size[0]*0.32}" fill="${color}">$</text>
        </svg>
      `)}`,
      iconSize: size,
      iconAnchor: anchor,
      popupAnchor: [1, -34],
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getPropertyTypeColor = (type: string) => {
    const typeCode = type.split(':')[0];
    const colors = {
      'AC01': 'bg-blue-100 text-blue-800',
      'AC02': 'bg-green-100 text-green-800',
      'CK01': 'bg-purple-100 text-purple-800',
      'CK15': 'bg-orange-100 text-orange-800',
      'CK99': 'bg-red-100 text-red-800',
      'MS01': 'bg-yellow-100 text-yellow-800',
      'MS05': 'bg-indigo-100 text-indigo-800',
      'MS09': 'bg-pink-100 text-pink-800',
      'MS11': 'bg-teal-100 text-teal-800',
      'MS16': 'bg-cyan-100 text-cyan-800',
      'SC01': 'bg-emerald-100 text-emerald-800',
      'SC16': 'bg-violet-100 text-violet-800',
      'SC20': 'bg-lime-100 text-lime-800',
      'TR04': 'bg-amber-100 text-amber-800',
      'IN02': 'bg-rose-100 text-rose-800',
      'IN03': 'bg-slate-100 text-slate-800',
      'IN05': 'bg-zinc-100 text-zinc-800',
      'MI02': 'bg-stone-100 text-stone-800',
    };
    
    return colors[typeCode as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handlePropertySelect = (property: PropertyWithCoordinates) => {
    setSelectedProperty(property);
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-red-50">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-800 font-medium">Failed to load map data</p>
          <p className="text-red-600 text-sm">{error}</p>
          <button
            onClick={loadGeocodedProperties}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {isLoading ? (
              <div className="flex items-center">
                <Loader className="h-4 w-4 animate-spin mr-2" />
                Loading properties...
              </div>
            ) : (
              `${filteredProperties.length} of ${properties.length} properties`
            )}
          </div>
        </div>

        {/* Properties List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p>No geocoded properties found</p>
              <p className="text-sm">Try geocoding addresses first</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredProperties.map((property) => (
                <div
                  key={property.id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedProperty?.id === property.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                  onClick={() => handlePropertySelect(property)}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 text-sm">
                          {property.owner_name}
                        </span>
                        {selectedProperty?.id === property.id && (
                          <ZoomIn className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                      <div className="flex items-center text-green-600 font-medium text-sm">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(property.current_cash_balance)}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-500">
                        {[property.owner_city, property.owner_state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                    
                    <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPropertyTypeColor(property.property_type)}`}>
                      {property.property_type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="text-center">
              <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600 font-medium">No properties to display</p>
              <p className="text-gray-500 text-sm">Geocode some addresses to see them on the map</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={[36.7783, -119.4179]} // California center
            zoom={6}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <FitBounds properties={filteredProperties} />
            <ZoomToProperty property={selectedProperty} />
            
            {/* Render all markers only once */}
            {filteredProperties.map((property) => (
              <Marker
                key={property.id}
                position={[property.owner_latitude, property.owner_longitude]}
                icon={getPropertyIcon(property.property_type, selectedProperty?.id === property.id)}
                eventHandlers={{
                  click: () => handlePropertySelect(property),
                }}
              >
                <Popup>
                  <div className="w-64 p-2">
                    <div className="space-y-3">
                      <div>
                        <div className="font-semibold text-gray-900">{property.owner_name}</div>
                        <div className="text-sm text-gray-600">{property.property_id}</div>
                      </div>
                      
                      <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPropertyTypeColor(property.property_type)}`}>
                        {property.property_type}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-gray-700">
                            {[property.owner_street_1, property.owner_city, property.owner_state, property.owner_zip]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm">
                          <Building className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-gray-700">{property.holder_name}</span>
                        </div>
                        
                        <div className="flex items-center text-sm font-medium text-green-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {formatCurrency(property.current_cash_balance)}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Pending Claims: {property.number_of_pending_claims}</div>
                        <div>Paid Claims: {property.number_of_paid_claims}</div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
};