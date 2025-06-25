import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface SearchFilters {
  ownerName: string;
  ownerCity: string;
  ownerState: string;
  propertyType: string;
  holderName: string;
  minAmount: string;
  maxAmount: string;
}

interface PropertySearchProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

export const PropertySearch: React.FC<PropertySearchProps> = ({ 
  onSearch, 
  isLoading = false 
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    ownerName: '',
    ownerCity: '',
    ownerState: '',
    propertyType: '',
    holderName: '',
    minAmount: '',
    maxAmount: '',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleInputChange = (key: keyof SearchFilters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      ownerName: '',
      ownerCity: '',
      ownerState: '',
      propertyType: '',
      holderName: '',
      minAmount: '',
      maxAmount: '',
    };
    setFilters(emptyFilters);
    onSearch(emptyFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value.trim() !== '');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Search Properties</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
          >
            <Filter className="h-4 w-4" />
            <span>{showAdvanced ? 'Hide' : 'Show'} Advanced</span>
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Owner Name"
            value={filters.ownerName}
            onChange={(e) => handleInputChange('ownerName', e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Owner City"
            value={filters.ownerCity}
            onChange={(e) => handleInputChange('ownerCity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        <div>
          <input
            type="text"
            placeholder="Owner State"
            value={filters.ownerState}
            onChange={(e) => handleInputChange('ownerState', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        {showAdvanced && (
          <>
            <div>
              <input
                type="text"
                placeholder="Property Type"
                value={filters.propertyType}
                onChange={(e) => handleInputChange('propertyType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Holder Name"
                value={filters.holderName}
                onChange={(e) => handleInputChange('holderName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min Amount"
                value={filters.minAmount}
                onChange={(e) => handleInputChange('minAmount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <input
                type="number"
                placeholder="Max Amount"
                value={filters.maxAmount}
                onChange={(e) => handleInputChange('maxAmount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};