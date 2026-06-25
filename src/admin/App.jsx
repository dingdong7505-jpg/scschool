import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1234';

const fmt = iso => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', { hour12: false });
};

const providerLabel = p => ({ google: 'Google', email: '이메일', guest: '게스트' }[p] || p || '-');

const App = () => {
  const [authed, setAuthed] = useState(false);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!supabase) { setErr('Supabase가 설정되지 않았습니다.'); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('login_logs')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    setLogs(data || []);
  };

  useEffect(() => { if (authed) load(); }, [authed]);

  if (!authed) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a1a', fontFamily: 'sans-serif' }}>
        <form
          onSubmit={e => { e.preventDefault(); if (pin === ADMIN_PIN) { setAuthed(true); setErr(''); } else { setErr('PIN이 올바르지 않습니다.'); } }}
          style={{ background: '#fff', borderRadius: 16, padding: 32, width: 320, boxShadow: '0 10px 40px rgba(0,0,0,.3)' }}
        >
          <h1 style={{ fontSize: 18, marginBottom: 16 }}>관리자 PIN</h1>
          <input
            type="password" value={pin} onChange={e => setPin(e.target.value)} autoFocus
            placeholder="PIN 입력"
            style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8, fontSize: 14, marginBottom: 12 }}
          />
          {err && <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 12 }}>{err}</p>}
          <button type="submit" style={{ width: '100%', padding: 10, background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>입장</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f7f8', fontFamily: 'sans-serif', padding: '32px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>로그인 기록 ({logs.length})</h1>
          <button onClick={load} style={{ padding: '8px 14px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>새로고침</button>
        </div>

        {err && <p style={{ color: '#dc2626', marginBottom: 12 }}>{err}</p>}
        {loading && <p style={{ color: '#888' }}>불러오는 중...</p>}

        {!loading && (
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #eee' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#fafafa', textAlign: 'left' }}>
                  <th style={{ padding: '10px 16px' }}>날짜/시간</th>
                  <th style={{ padding: '10px 16px' }}>이름</th>
                  <th style={{ padding: '10px 16px' }}>이메일</th>
                  <th style={{ padding: '10px 16px' }}>방식</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>{fmt(l.created_at)}</td>
                    <td style={{ padding: '10px 16px' }}>{l.name || '-'}</td>
                    <td style={{ padding: '10px 16px' }}>{l.email || '-'}</td>
                    <td style={{ padding: '10px 16px' }}>{providerLabel(l.provider)}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#999' }}>로그인 기록이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
