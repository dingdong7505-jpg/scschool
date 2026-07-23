import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 이 앱은 자체 계정(app_state)으로 로그인한다. Supabase Auth 세션은 비밀번호 재설정
// OTP 인증 순간에만 잠깐 필요할 뿐이며, 남아 있으면 'authenticated' 역할이 되어
// anon 전용으로 열린 app_state 읽기가 막힌다. 그래서 세션을 저장하지 않는다.
export const supabase = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;

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
  const { data, error } = await supabase.from('app_state').select('value').eq('key', key).maybeSingle();
  if (error) { console.warn('fetchSharedState failed', key, error); throw error; }
  return data ? data.value : null;
}

export async function pushSharedState(key, value) {
  if (!supabase) return;
  try {
    await supabase.from('app_state').upsert({ key, value, updated_at: new Date().toISOString() });
  } catch (e) {
    console.warn('pushSharedState failed', key, e);
  }
}

export async function sendOtp(email) {
  if (!supabase) return { error: 'Supabase가 설정되지 않았습니다.' };
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) return { error: error.message };
  return { error: null };
}

export async function verifyOtp(email, token) {
  if (!supabase) return { error: 'Supabase가 설정되지 않았습니다.' };
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) return { error: error.message };
  // 이메일 소유 확인만이 목적이므로, 인증 세션은 바로 로그아웃해 anon 상태로 되돌린다.
  // (이 세션이 남으면 이후 app_state 읽기/쓰기가 막혀 로그인이 "등록되지 않은 이메일"로 실패함)
  try { await supabase.auth.signOut(); } catch (e) { console.warn('otp signout failed', e); }
  return { error: null };
}
