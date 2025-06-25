import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export type UnclaimedProperty = {
  id: string;
  property_id: string;
  property_type: string;
  cash_reported: number;
  shares_reported: number;
  name_of_securities_reported: string;
  no_of_owners: string;
  owner_name: string;
  owner_street_1: string;
  owner_street_2: string;
  owner_street_3: string;
  owner_city: string;
  owner_state: string;
  owner_zip: string;
  owner_country_code: string;
  current_cash_balance: number;
  number_of_pending_claims: number;
  number_of_paid_claims: number;
  holder_name: string;
  holder_street_1: string;
  holder_street_2: string;
  holder_street_3: string;
  holder_city: string;
  holder_state: string;
  holder_zip: string;
  cusip: string;
  owner_latitude?: number;
  owner_longitude?: number;
  holder_latitude?: number;
  holder_longitude?: number;
  geocoded_at?: string;
  geocoding_status?: string;
  created_at: string;
  updated_at: string;
};