
// ── 간단 해시 (로컬 앱용) ─────────────────────────────────
const hashPw = str => {
  const s = 'ch_salt_2025_' + str;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return h.toString(36);
};

// ── 인증 모달 ─────────────────────────────────────────────
const AuthModal = ({ site, accounts, setAccounts, onSuccess, onClose }) => {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', password2: '' });
  const [err, setErr] = useState('');
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErr(''); };

  const gRef = React.useRef();
  useEffect(() => {
    if (!site.googleClientId || !window.google || !gRef.current) return;
    try {
      window.google.accounts.id.initialize({
        client_id: site.googleClientId,
        callback: res => {
          const p = decodeJWT(res.credential);
          if (!p) { setErr('Google 인증 오류'); return; }
          const allowed = site.allowedEmails || [];
          if (allowed.length > 0 && !allowed.includes(p.email)) { setErr('허용되지 않은 이메일: ' + p.email); return; }
          onSuccess({ name: p.name, email: p.email, picture: p.picture, provider: 'google' });
        },
      });
      window.google.accounts.id.renderButton(gRef.current, { theme: 'outline', size: 'large', width: 300, text: 'signin_with', shape: 'pill', locale: 'ko' });
    } catch (e) { console.warn('GIS error', e); }
  }, [site.googleClientId]);

  const handleLogin = () => {
    if (!form.email || !form.password) { setErr('이메일과 비밀번호를 입력하세요.'); return; }
    const acc = accounts.find(a => a.email.toLowerCase() === form.email.toLowerCase());
    if (!acc) { setErr('등록되지 않은 이메일입니다.'); return; }
    if (acc.passwordHash !== hashPw(form.password)) { setErr('비밀번호가 틀렸습니다.'); return; }
    onSuccess({ name: acc.name, email: acc.email, provider: 'email' });
  };

  const handleSignup = () => {
    if (!form.name.trim()) { setErr('이름을 입력하세요.'); return; }
    if (!form.email.includes('@')) { setErr('올바른 이메일을 입력하세요.'); return; }
    if (form.password.length < 6) { setErr('비밀번호는 6자 이상이어야 합니다.'); return; }
    if (form.password !== form.password2) { setErr('비밀번호가 일치하지 않습니다.'); return; }
    if (accounts.find(a => a.email.toLowerCase() === form.email.toLowerCase())) { setErr('이미 등록된 이메일입니다.'); return; }
    const newAcc = { id: nextId(accounts), name: form.name.trim(), email: form.email.trim(), passwordHash: hashPw(form.password) };
    setAccounts(p => [...p, newAcc]);
    onSuccess({ name: newAcc.name, email: newAcc.email, provider: 'email' });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-[#1a1a1a] px-6 py-5 text-center">
          <div className="text-[#b8934a] text-3xl mb-2">✝</div>
          <h2 className="text-white font-bold text-lg">교사 로그인</h2>
          <p className="text-white/40 text-xs mt-1">{site.churchName}</p>
        </div>

        {site.googleClientId && (
          <div className="px-6 pt-5 pb-3">
            <div ref={gRef} className="flex justify-center" />
            <div className="relative mt-4 mb-1">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">또는 이메일로</span></div>
            </div>
          </div>
        )}

        <div className={`flex gap-1 px-6 ${site.googleClientId ? 'pt-0' : 'pt-5'}`}>
          {['login', 'signup'].map(t => (
            <button key={t} onClick={() => { setTab(t); setErr(''); setForm({ name: '', email: '', password: '', password2: '' }); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${tab === t ? 'bg-[#1a1a1a] text-white' : 'text-gray-400 hover:text-gray-700'}`}>
              {t === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        <div className="px-6 pb-6 pt-4 space-y-3">
          {tab === 'signup' && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">이름</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="홍길동" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#b8934a] transition-colors" />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">이메일</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="example@gmail.com" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#b8934a] transition-colors" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">{tab === 'signup' ? '비밀번호 (6자 이상)' : '비밀번호'}</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && tab === 'login') handleLogin(); }}
              placeholder="••••••" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#b8934a] transition-colors" />
          </div>
          {tab === 'signup' && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">비밀번호 확인</label>
              <input type="password" value={form.password2} onChange={e => set('password2', e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSignup(); }}
                placeholder="••••••" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#b8934a] transition-colors" />
            </div>
          )}

          {err && (
            <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{err}</p>
          )}

          <button onClick={tab === 'login' ? handleLogin : handleSignup}
            className="w-full py-3 bg-[#3d6b4f] text-white rounded-2xl text-sm font-semibold hover:bg-[#2d5240] transition-all mt-1">
            {tab === 'login' ? '로그인' : '가입하기'}
          </button>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">또는</span></div>
          </div>

          <button onClick={() => onSuccess({ name: '게스트', provider: 'guest' })}
            className="w-full py-2.5 border border-gray-200 rounded-2xl text-sm text-gray-500 hover:border-[#b8934a] hover:text-[#b8934a] transition-all">
            👤 게스트로 입장
          </button>

          <button onClick={onClose} className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-600">취소</button>
        </div>
      </div>
    </div>
  );
};

// ── App Root ─────────────────────────────────────────────
const App = () => {
  const [site, setSite] = useLS('site_v3', DEFAULT_SITE);
  const [sections, setSections] = useLS('sections_v3', DEFAULT_SECTIONS);
  const [classes, setClasses] = useLS('classes_v3', DEFAULT_CLASSES);
  const [students, setStudents] = useLS('students_v3', INITIAL_STUDENTS);
  const [teachers, setTeachers] = useLS('teachers_v3', INITIAL_TEACHERS);
  const [attendance, setAttendance] = useLS('attendance_v3', genAttendance(INITIAL_STUDENTS));
  const [meetings, setMeetings] = useLS('meetings_v3', INITIAL_MEETINGS);
  const [photos, setPhotos] = useLS('photos_v3', INITIAL_PHOTOS);
  const [prayers, setPrayers] = useLS('prayers_v3', INITIAL_PRAYERS);
  const [accounts, setAccounts] = useLS('accounts_v3', []);

  const [authUser, setAuthUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showManage, setShowManage] = useState(false);

  const handleTeacherBtn = () => { if (authUser) { setShowManage(true); return; } setShowLogin(true); };
  const handleLogout = () => {
    setAuthUser(null); setShowManage(false);
    if (window.google && site.googleClientId) { try { window.google.accounts.id.disableAutoSelect(); } catch(e){} }
  };

  return (
    <React.Fragment>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jua&family=Noto+Serif+KR:wght@400;600;700&family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Noto Sans KR',sans-serif;color:#1a1a1a;background:#fff;}
        h1,h2,h3{font-family:'Noto Serif KR',serif;}
        .font-jua{font-family:'Jua',sans-serif;}
        @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeIn 0.5s ease}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#f1f1f1}::-webkit-scrollbar-thumb{background:#b8934a;border-radius:2px}
        .line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        select,input,textarea{font-family:'Noto Sans KR',sans-serif}
      `}</style>

      <Homepage
        site={site} sections={sections} classes={classes} students={students}
        prayers={prayers} setPrayers={setPrayers} photos={photos}
        onOpenManage={handleTeacherBtn} authUser={authUser}
      />

      {showLogin && (
        <AuthModal
          site={site}
          accounts={accounts}
          setAccounts={setAccounts}
          onSuccess={user => { setAuthUser(user); setShowLogin(false); setShowManage(true); }}
          onClose={() => setShowLogin(false)}
        />
      )}

      {showManage && authUser && (
        <ManagePanel
          onClose={() => setShowManage(false)}
          authUser={authUser}
          onLogout={handleLogout}
          site={site} setSite={setSite}
          sections={sections} setSections={setSections}
          classes={classes} setClasses={setClasses}
          students={students} setStudents={setStudents}
          teachers={teachers} setTeachers={setTeachers}
          attendance={attendance} setAttendance={setAttendance}
          meetings={meetings} setMeetings={setMeetings}
          photos={photos} setPhotos={setPhotos}
          prayers={prayers} setPrayers={setPrayers}
        />
      )}
    </React.Fragment>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
