import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zyahuyqjlkzvvixoxwgq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5YWh1eXFqbGt6dnZpeG94d2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzM3ODEsImV4cCI6MjA4NTE0OTc4MX0.SGCSzYUev7YYrOOPS2kmfW6935UMo2E2LpI3SQwHEJo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: null, // TODO: Add AsyncStorage here for persistence later if needed, default in memory is fine for MVP testing but not prod
    autoRefreshToken: true,
    persistSession: false, // Disabling persistence for now to avoid Async Storage dep issues initially
    detectSessionInUrl: false,
  },
});
