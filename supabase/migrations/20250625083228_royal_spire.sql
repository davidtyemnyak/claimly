/*
  # Add latitude and longitude coordinates to unclaimed properties

  1. Schema Changes
    - Add `owner_latitude` column to store owner address latitude
    - Add `owner_longitude` column to store owner address longitude
    - Add `holder_latitude` column to store holder address latitude
    - Add `holder_longitude` column to store holder address longitude
    - Add `geocoded_at` timestamp to track when geocoding was performed
    - Add `geocoding_status` to track geocoding success/failure

  2. Indexes
    - Add spatial indexes for efficient location-based queries
*/

-- Add coordinate columns for owner addresses
ALTER TABLE unclaimed_properties 
ADD COLUMN IF NOT EXISTS owner_latitude decimal(10,8),
ADD COLUMN IF NOT EXISTS owner_longitude decimal(11,8),
ADD COLUMN IF NOT EXISTS holder_latitude decimal(10,8),
ADD COLUMN IF NOT EXISTS holder_longitude decimal(11,8),
ADD COLUMN IF NOT EXISTS geocoded_at timestamptz,
ADD COLUMN IF NOT EXISTS geocoding_status text DEFAULT 'pending';

-- Create indexes for spatial queries
CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_owner_coordinates 
ON unclaimed_properties(owner_latitude, owner_longitude) 
WHERE owner_latitude IS NOT NULL AND owner_longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_holder_coordinates 
ON unclaimed_properties(holder_latitude, holder_longitude) 
WHERE holder_latitude IS NOT NULL AND holder_longitude IS NOT NULL;

-- Create index for geocoding status
CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_geocoding_status 
ON unclaimed_properties(geocoding_status);