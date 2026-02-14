import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL:', supabaseUrl)
  console.error('Supabase Key:', supabaseAnonKey ? 'Present' : 'Missing')
  throw new Error('Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file')
}

// Validate URL format (allow both .supabase.co and custom domains)
if (!supabaseUrl.startsWith('https://')) {
  console.error('Invalid Supabase URL format:', supabaseUrl)
  throw new Error('Invalid Supabase URL format. URL should start with https://')
}

// Create Supabase client
// Note: Custom auth domain (auth.daily-breathing.com) should be configured in 
// Supabase Dashboard > Authentication > URL Configuration
// The client will automatically use the custom domain when configured in project settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

export default supabase
