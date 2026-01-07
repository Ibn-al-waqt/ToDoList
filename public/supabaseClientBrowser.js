// public/supabaseClientBrowser.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

export const supabase = createClient(
  "https://sazdtrcayjljgmihilkj.supabase.co",        // replace with your URL
  "sb_publishable_8PjevXnceWHX2i_xoB-M7g_UYzHxq5c"            // replace with your anon/publishable key
)
