import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;

export async function logLogin({ name, email, provider }) {
  if (!supabase) return;
  try {
    await supabase.from('login_logs').insert({ name, email, provider });
  } catch (e) {
    console.warn('login log failed', e);
  }
}
