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

export async function fetchSharedState(key) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('app_state').select('value').eq('key', key).maybeSingle();
    if (error) { console.warn('fetchSharedState failed', key, error); return null; }
    return data ? data.value : null;
  } catch (e) {
    console.warn('fetchSharedState failed', key, e);
    return null;
  }
}

export async function pushSharedState(key, value) {
  if (!supabase) return;
  try {
    await supabase.from('app_state').upsert({ key, value, updated_at: new Date().toISOString() });
  } catch (e) {
    console.warn('pushSharedState failed', key, e);
  }
}
