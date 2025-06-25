/*
  # Create unclaimed property database schema

  1. New Tables
    - `unclaimed_properties`
      - `id` (uuid, primary key)
      - `property_id` (text, unique identifier from CSV)
      - `property_type` (text, type of unclaimed property)
      - `cash_reported` (decimal, cash amount reported)
      - `shares_reported` (decimal, shares reported)
      - `name_of_securities_reported` (text, securities name)
      - `no_of_owners` (text, number of owners)
      - `owner_name` (text, owner name)
      - `owner_street_1` (text, owner address line 1)
      - `owner_street_2` (text, owner address line 2)
      - `owner_street_3` (text, owner address line 3)
      - `owner_city` (text, owner city)
      - `owner_state` (text, owner state)
      - `owner_zip` (text, owner zip code)
      - `owner_country_code` (text, owner country code)
      - `current_cash_balance` (decimal, current cash balance)
      - `number_of_pending_claims` (integer, pending claims count)
      - `number_of_paid_claims` (integer, paid claims count)
      - `holder_name` (text, holder name)
      - `holder_street_1` (text, holder address line 1)
      - `holder_street_2` (text, holder address line 2)
      - `holder_street_3` (text, holder address line 3)
      - `holder_city` (text, holder city)
      - `holder_state` (text, holder state)
      - `holder_zip` (text, holder zip code)
      - `cusip` (text, CUSIP identifier)
      - `created_at` (timestamp, creation date)
      - `updated_at` (timestamp, last update date)

  2. Security
    - Enable RLS on `unclaimed_properties` table
    - Add policies for authenticated users to read and manage data

  3. Indexes
    - Add indexes for common search fields (owner_name, property_id, holder_name)
    - Add composite indexes for filtering operations
*/

-- Create the unclaimed properties table
CREATE TABLE IF NOT EXISTS unclaimed_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id text UNIQUE NOT NULL,
  property_type text NOT NULL DEFAULT '',
  cash_reported decimal(12,4) DEFAULT 0.0000,
  shares_reported decimal(12,4) DEFAULT 0.0000,
  name_of_securities_reported text DEFAULT '',
  no_of_owners text DEFAULT '',
  owner_name text NOT NULL DEFAULT '',
  owner_street_1 text DEFAULT '',
  owner_street_2 text DEFAULT '',
  owner_street_3 text DEFAULT '',
  owner_city text DEFAULT '',
  owner_state text DEFAULT '',
  owner_zip text DEFAULT '',
  owner_country_code text DEFAULT '',
  current_cash_balance decimal(12,4) DEFAULT 0.0000,
  number_of_pending_claims integer DEFAULT 0,
  number_of_paid_claims integer DEFAULT 0,
  holder_name text DEFAULT '',
  holder_street_1 text DEFAULT '',
  holder_street_2 text DEFAULT '',
  holder_street_3 text DEFAULT '',
  holder_city text DEFAULT '',
  holder_state text DEFAULT '',
  holder_zip text DEFAULT '',
  cusip text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE unclaimed_properties ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read unclaimed properties"
  ON unclaimed_properties
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert unclaimed properties"
  ON unclaimed_properties
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update unclaimed properties"
  ON unclaimed_properties
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete unclaimed properties"
  ON unclaimed_properties
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_property_id ON unclaimed_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_owner_name ON unclaimed_properties(owner_name);
CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_holder_name ON unclaimed_properties(holder_name);
CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_property_type ON unclaimed_properties(property_type);
CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_owner_city ON unclaimed_properties(owner_city);
CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_owner_state ON unclaimed_properties(owner_state);
CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_cash_balance ON unclaimed_properties(current_cash_balance);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_unclaimed_properties_updated_at
  BEFORE UPDATE ON unclaimed_properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();