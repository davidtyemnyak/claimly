import React from 'react';
import { UnclaimedProperty } from '../lib/supabase';
import { DollarSign, MapPin, Building, User } from 'lucide-react';

interface PropertyTableProps {
  properties: UnclaimedProperty[];
  isLoading?: boolean;
}

export const PropertyTable: React.FC<PropertyTableProps> = ({ 
  properties, 
  isLoading = false 
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getPropertyTypeColor = (type: string) => {
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
    
    const typeCode = type.split(':')[0];
    return colors[typeCode as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-500">
          <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No properties found</p>
          <p className="text-sm">Try adjusting your search criteria</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Property Records ({properties.length})
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Property Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Owner Information
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Holder Information
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Claims
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {properties.map((property) => (
              <tr key={property.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-900">
                      {property.property_id}
                    </div>
                    <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPropertyTypeColor(property.property_type)}`}>
                      {property.property_type}
                    </div>
                    {property.name_of_securities_reported && (
                      <div className="text-xs text-gray-500">
                        {property.name_of_securities_reported}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      <User className="h-4 w-4 mr-2 text-gray-400" />
                      {property.owner_name}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {[property.owner_city, property.owner_state, property.owner_zip]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                    {property.owner_street_1 && (
                      <div className="text-xs text-gray-500">
                        {property.owner_street_1}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      <Building className="h-4 w-4 mr-2 text-gray-400" />
                      {property.holder_name}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {[property.holder_city, property.holder_state, property.holder_zip]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm font-medium text-gray-900">
                    <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                    {formatCurrency(property.current_cash_balance)}
                  </div>
                  {property.shares_reported > 0 && (
                    <div className="text-xs text-gray-500">
                      {property.shares_reported} shares
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="text-sm text-gray-900">
                      Pending: {property.number_of_pending_claims}
                    </div>
                    <div className="text-sm text-gray-500">
                      Paid: {property.number_of_paid_claims}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};