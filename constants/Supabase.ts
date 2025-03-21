import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Remplacez ces valeurs par vos propres clés Supabase
const supabaseUrl = 'https://dowptobquyejysvsvgmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvd3B0b2JxdXllanlzdnN2Z21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3Njc5NjUsImV4cCI6MjA1NzM0Mzk2NX0.pAv0fnXqustkOE_RvRVliTdD86rtRKxWfNqjqsVGKYA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 