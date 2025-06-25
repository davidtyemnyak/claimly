import React, { useState, useEffect } from 'react';
import { BatchGeocodingService, GeocodingProgress } from '../services/geocodingBatch';
import { MapPin, Play, Square, BarChart3, AlertCircle, CheckCircle } from 'lucide-react';

export const GeocodingPanel: React.FC = () => {
  const [progress, setProgress] = useState<GeocodingProgress>({
    total: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    isRunning: false
  });
  
  const [stats, setStats] = useState({
    total: 0,
    geocoded: 0,
    pending: 0,
    failed: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    BatchGeocodingService.setProgressCallback(setProgress);
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const currentStats = await BatchGeocodingService.getGeocodingStats();
      setStats(currentStats);
    } catch (err) {
      console.error('Failed to load geocoding stats:', err);
    }
  };

  const startGeocoding = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await BatchGeocodingService.startBatchGeocoding(50); // Process 50 at a time
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start geocoding');
    } finally {
      setIsLoading(false);
    }
  };

  const stopGeocoding = () => {
    BatchGeocodingService.stopBatchGeocoding();
  };

  const getProgressPercentage = () => {
    if (progress.total === 0) return 0;
    return Math.round((progress.processed / progress.total) * 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <MapPin className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Address Geocoding</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Current Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Properties</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.geocoded}</div>
          <div className="text-sm text-gray-500">Geocoded</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          <div className="text-sm text-gray-500">Failed</div>
        </div>
      </div>

      {/* Progress Bar */}
      {progress.isRunning && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Processing... {progress.processed} of {progress.total}
            </span>
            <span className="text-sm text-gray-500">
              {getProgressPercentage()}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>✓ {progress.successful} successful</span>
            <span>✗ {progress.failed} failed</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center space-x-4">
        {!progress.isRunning ? (
          <button
            onClick={startGeocoding}
            disabled={isLoading || stats.pending === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-4 w-4" />
            <span>
              {isLoading ? 'Starting...' : 'Start Geocoding'}
            </span>
          </button>
        ) : (
          <button
            onClick={stopGeocoding}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <Square className="h-4 w-4" />
            <span>Stop Geocoding</span>
          </button>
        )}

        <button
          onClick={loadStats}
          disabled={progress.isRunning}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
        >
          <BarChart3 className="h-4 w-4" />
          <span>Refresh Stats</span>
        </button>
      </div>

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start">
          <CheckCircle className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Geocoding</p>
            <p>
              This process converts property addresses into latitude/longitude coordinates 
              using OpenStreetMap's Nominatim service. The coordinates will be used to 
              display properties on a map. Processing is rate-limited to respect the 
              service's usage policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};