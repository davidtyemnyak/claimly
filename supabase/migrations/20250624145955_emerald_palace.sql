/*
  # Update RLS policies to allow anonymous access

  1. Security Changes
    - Update existing policies to allow both authenticated and anonymous users
    - This enables the application to work without requiring user authentication
    - Note: In production, proper authentication should be implemented

  2. Policy Updates
    - SELECT: Allow anonymous users to read unclaimed properties
    - INSERT: Allow anonymous users to insert unclaimed properties  
    - UPDATE: Allow anonymous users to update unclaimed properties
    - DELETE: Allow anonymous users to delete unclaimed properties

  **Important**: This configuration allows unrestricted access to the table.
  For production use, implement proper user authentication and restrict policies accordingly.
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read unclaimed properties" ON unclaimed_properties;
DROP POLICY IF EXISTS "Users can insert unclaimed properties" ON unclaimed_properties;
DROP POLICY IF EXISTS "Users can update unclaimed properties" ON unclaimed_properties;
DROP POLICY IF EXISTS "Users can delete unclaimed properties" ON unclaimed_properties;

-- Create new policies that allow both authenticated and anonymous access
CREATE POLICY "Allow read access to unclaimed properties"
  ON unclaimed_properties
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert access to unclaimed properties"
  ON unclaimed_properties
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to unclaimed properties"
  ON unclaimed_properties
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access to unclaimed properties"
  ON unclaimed_properties
  FOR DELETE
  TO anon, authenticated
  USING (true);