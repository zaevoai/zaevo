import { createClient } from '@supabase/supabase-js'

/* the publishable key is meant to run in the browser — every request still
   passes through the row-level security policies on each table, so this key
   alone can never read, edit, or delete what someone else submitted */
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)
