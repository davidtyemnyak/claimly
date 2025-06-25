/*
  # Remove unique constraint on property_id

  1. Changes
    - Drop the unique constraint on property_id to allow duplicate property IDs
    - Keep the regular index for query performance

  2. Security
    - No changes to RLS policies
*/

-- Drop the unique constraint on property_id
ALTER TABLE unclaimed_properties DROP CONSTRAINT IF EXISTS unclaimed_properties_property_id_key;

-- Keep the regular index for query performance
-- (This should already exist from the schema, but ensuring it's there)
CREATE INDEX IF NOT EXISTS idx_unclaimed_properties_property_id 
ON public.unclaimed_properties USING btree (property_id);