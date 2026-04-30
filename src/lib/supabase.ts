import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dwtllfgwanqhrvflilry.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3dGxsZmd3YW5xaHJ2ZmxpbHJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTQxMTgsImV4cCI6MjA5MzEzMDExOH0.PkUWKYWD-pN05TzLECVAlxYpVvMYZAJatzb1D-_Qcgg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  date_of_birth: string | null
  preferred_auth_method: 'sms' | 'biometric'
  account_balance: number
  created_at: string
  updated_at: string
}
