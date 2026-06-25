
// ── 관리자 페이지 ────────────────────────────────────────
const AdminPage = ({ homeContent, setHomeContent, sections, setSections, classes, setClasses, teachers, students }) => {
  const [authed, setAuthed] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [tab, setTab] = useState('home');
  const [editingSec, setEditingSec] = useState(null);
  const [showAddSec, setShowAddSec] = useState(false);
  const [editingCls, setEditingCls] = useState(null);
  const [showAddCls, setShowAddCls] = useState(null);

  if (!authed) return (
    <div className="fade-in flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><Icon name="lock" size={32} cls="text-sky-500"/></div>
        <h1 className="text-xl font-bold text-gray-800">관리자 페이지</h1>
        <p className="text-sm text-gray-500 mt-1">PIN 번호 입력 (기본: 1234)</p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <input type="password" value={pinInput} onChange={e=>setPinInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&(pinInput===homeContent.adminPin?setAuthed(true):alert('PIN이 틀렸습니다.'))}
          placeholder="PIN 번호" className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-center text-2xl tracking-widest outline-none focus:border-sky-400 transition-all"/>
        <Btn onClick={()=>pinInput===homeContent.adminPin?setAuthed(true):alert('PIN이 틀렸습니다.')} cls="w-full justify-center py-3">
          <Icon name="key" size={18}/>입장
        </Btn>
      </div>
    </div>
  );

  const TABS = [
    {id:'home',label:'홈 편집',icon:'edit'},
    {id:'sections',label:'섹션/반 관리',icon:'users'},
    {id:'google',label:'Google 로그인',icon:'key'},
    {id:'security',label:'보안',icon:'lock'},
  ];
  const secGrad = { rose:'from-rose-400 to-pink-500', amber:'from-amber-400 to-orange-500', sky:'from-sky-400 to-blue-500', violet:'from-violet-400 to-purple-500' };
  const COLOR_OPTIONS = [{value:'rose',label:'장미색'},{value:'amber',label:'황금색'},{value:'sky',label:'하늘색'},{value:'violet',label:'보라색'},{value:'green',label:'초록색'},{value:'blue',label:'파란색'}];
  const EMOJI_OPTIONS = ['🌸','🌟','📚','✨','⛪','🙏','❤️','🎵','⚽','📖','🌈','🕊️'];

  const SecForm = ({ initial, onSave, onClose }) => {
    const [form, setForm] = useState(initial||{name:'',color:'sky',emoji:'✨'});
    const set=(k,v)=>setForm(f=>({...f,[k]:v}));
    return (
      <div className="space-y-3">
        <Inp label="섹션 이름" value={form.name} onChange={v=>set('name',v)} required/>
        <Sel label="색상" value={form.color} onChange={v=>set('color',v)} options={COLOR_OPTIONS}/>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">이모지</label>
          <div className="flex flex-wrap gap-2 mb-1">{EMOJI_OPTIONS.map(e=><button key={e} onClick={()=>set('emoji',e)} className={`w-10 h-10 text-xl rounded-xl border-2 transition-all ${form.emoji===e?'border-sky-500 bg-sky-50':'border-gray-200'}`}>{e}</button>)}</div>
          <input value={form.emoji} onChange={ev=>set('emoji',ev.target.value)} placeholder="직접 입력" className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-sky-400"/>
        </div>
        <div className={`bg-gradient-to-r ${secGrad[form.color]||secGrad.sky} rounded-xl p-3 flex items-center gap-2`}>
          <span className="text-2xl">{form.emoji}</span><span className="font-bold text-white">{form.name||'미리보기'}</span>
        </div>
        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose} variant="secondary" cls="flex-1">취소</Btn>
          <Btn onClick={()=>{if(!form.name)return alert('이름 입력');onSave(form);onClose();}} cls="flex-1">저장</Btn>
        </div>
      </div>
    );
  };
  const ClsForm = ({ initial, sectionId, onSave, onClose }) => {
    const [name, setName] = useState(initial?.name||'');
    const [sid, setSid] = useState(initial?.sectionId||sectionId||sections[0]?.id||'');
    return (
      <div className="space-y-3">
        <Inp label="반 이름" value={name} onChange={setName} required/>
        <Sel label="소속 섹션" value={sid} onChange={setSid} options={sections.map(s=>({value:s.id,label:`${s.emoji} ${s.name}`}))}/>
        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose} variant="secondary" cls="flex-1">취소</Btn>
          <Btn onClick={()=>{if(!name)return alert('이름 입력');onSave({name,sectionId:sid});onClose();}} cls="flex-1">저장</Btn>
        </div>
      </div>
    );
  };
  const canDelSec = id=>!classes.some(c=>c.sectionId===id);
  const canDelCls = id=>!students.some(s=>s.classId===id)&&!teachers.some(t=>t.classId===id);

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center"><Icon name="settings" size={20} cls="text-sky-500"/></div>
          <div><h1 className="text-xl font-bold text-gray-800">관리자</h1><p className="text-xs text-green-500 font-medium">✓ 인증됨</p></div>
        </div>
        <Btn variant="ghost" size="sm" onClick={()=>setAuthed(false)}>로그아웃</Btn>
      </div>
      <div className="flex gap-1.5 bg-gray-100 rounded-2xl p-1 overflow-x-auto scrollbar-hide">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} className={`flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${tab===t.id?'bg-white text-sky-600 shadow-sm':'text-gray-500'}`}>
            <Icon name={t.icon} size={13}/>{t.label}
          </button>
        ))}
      </div>

      {tab==='home'&&(
        <Card cls="space-y-4">
          <h2 className="font-bold text-gray-800">홈페이지 설정</h2>
          <Inp label="교회/학교 이름" value={homeContent.churchName} onChange={v=>setHomeContent(p=>({...p,churchName:v}))}/>
          <Inp label="소개 문구" value={homeContent.subtitle} onChange={v=>setHomeContent(p=>({...p,subtitle:v}))}/>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">공지사항</label>
            <textarea value={homeContent.announcement} onChange={e=>setHomeContent(p=>({...p,announcement:e.target.value}))}
              placeholder="공지사항 (없으면 비워두세요)" className="border border-gray-200 rounded-xl px-3 py-2 text-sm h-20 resize-none outline-none focus:border-sky-400"/>
          </div>
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-4 text-white">
            <p className="text-xl font-bold">{homeContent.churchName||'교회학교'}</p>
            {homeContent.subtitle&&<p className="text-sky-200 text-sm">{homeContent.subtitle}</p>}
            {homeContent.announcement&&<div className="bg-white/20 rounded-xl p-2 mt-2 text-sm">📢 {homeContent.announcement}</div>}
          </div>
        </Card>
      )}

      {tab==='sections'&&(
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">부서 / 반 관리</h2>
            <Btn size="sm" onClick={()=>setShowAddSec(true)}><Icon name="plus" size={14}/>부서 추가</Btn>
          </div>
          {sections.map(sec=>(
            <Card key={sec.id} cls="space-y-3">
              <div className={`bg-gradient-to-r ${secGrad[sec.color]||secGrad.sky} rounded-xl px-4 py-2.5 flex items-center justify-between`}>
                <div className="flex items-center gap-2"><span className="text-xl">{sec.emoji}</span><span className="font-bold text-white">{sec.name}</span><span className="text-white/70 text-sm">({classes.filter(c=>c.sectionId===sec.id).length}개 반)</span></div>
                <div className="flex gap-1">
                  <button onClick={()=>setEditingSec(sec)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white"><Icon name="edit" size={14}/></button>
                  <button onClick={()=>{if(!canDelSec(sec.id))return alert('반이 있어 삭제 불가. 먼저 반을 이동하세요.');if(confirm(`"${sec.name}" 삭제?`))setSections(p=>p.filter(s=>s.id!==sec.id));}} className="p-1.5 bg-white/20 hover:bg-red-400/50 rounded-lg text-white"><Icon name="trash" size={14}/></button>
                </div>
              </div>
              <div className="space-y-2">
                {classes.filter(c=>c.sectionId===sec.id).map(cls=>{
                  const sc=students.filter(s=>s.classId===cls.id&&s.active).length, tc=teachers.filter(t=>t.classId===cls.id).length;
                  return (
                    <div key={cls.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                      <div className="flex-1"><span className="font-medium text-sm">{cls.name}</span><span className="text-xs text-gray-400 ml-2">학생 {sc}명 · 교사 {tc}명</span></div>
                      <button onClick={()=>setEditingCls(cls)} className="p-1.5 hover:bg-sky-100 rounded-lg text-sky-500"><Icon name="edit" size={13}/></button>
                      <button onClick={()=>{if(!canDelCls(cls.id))return alert('학생이나 교사가 있어 삭제 불가');if(confirm(`"${cls.name}" 삭제?`))setClasses(p=>p.filter(c=>c.id!==cls.id));}} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"><Icon name="trash" size={13}/></button>
                    </div>
                  );
                })}
              </div>
              <Btn size="sm" variant="secondary" cls="w-full justify-center" onClick={()=>setShowAddCls(sec.id)}><Icon name="plus" size={14}/>{sec.name}에 반 추가</Btn>
            </Card>
          ))}
          {showAddSec&&<Modal title="부서 추가" onClose={()=>setShowAddSec(false)}><SecForm onSave={f=>setSections(p=>[...p,{...f,id:'s'+Date.now()}])} onClose={()=>setShowAddSec(false)}/></Modal>}
          {editingSec&&<Modal title="부서 수정" onClose={()=>setEditingSec(null)}><SecForm initial={editingSec} onSave={f=>setSections(p=>p.map(s=>s.id===editingSec.id?{...s,...f}:s))} onClose={()=>setEditingSec(null)}/></Modal>}
          {showAddCls&&<Modal title="반 추가" onClose={()=>setShowAddCls(null)}><ClsForm sectionId={showAddCls} onSave={f=>setClasses(p=>[...p,{...f,id:'c'+Date.now()}])} onClose={()=>setShowAddCls(null)}/></Modal>}
          {editingCls&&<Modal title="반 수정" onClose={()=>setEditingCls(null)}><ClsForm initial={editingCls} onSave={f=>setClasses(p=>p.map(c=>c.id===editingCls.id?{...c,...f}:c))} onClose={()=>setEditingCls(null)}/></Modal>}
        </div>
      )}

      {tab==='google'&&(
        <div className="space-y-4">
          <Card cls="space-y-4">
            <h2 className="font-bold text-gray-800">Google 로그인 설정</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800 space-y-1">
              <p className="font-semibold">📋 설정 방법</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li><a href="https://console.cloud.google.com/" target="_blank" className="underline">Google Cloud Console</a> 접속</li>
                <li>새 프로젝트 생성 (또는 기존 프로젝트 선택)</li>
                <li>API 및 서비스 → 사용자 인증 정보 → OAuth 2.0 클라이언트 ID 생성</li>
                <li>유형: 웹 애플리케이션</li>
                <li>승인된 자바스크립트 원본에 <code className="bg-blue-100 px-1 rounded">http://localhost:8000</code> 추가</li>
                <li>생성된 클라이언트 ID를 아래에 입력</li>
              </ol>
              <p className="text-xs mt-2 text-blue-600">※ 로컬 파일(file://)에서는 Google 로그인이 작동하지 않습니다.<br/>터미널에서 <code className="bg-blue-100 px-1 rounded">python -m http.server 8000</code> 실행 후 <code className="bg-blue-100 px-1 rounded">http://localhost:8000</code> 으로 접속하세요.</p>
            </div>
            <Inp label="Google Client ID" value={homeContent.googleClientId||''} onChange={v=>setHomeContent(p=>({...p,googleClientId:v}))} placeholder="123456789-abc...apps.googleusercontent.com"/>
            {homeContent.googleClientId ? (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
                <span className="text-green-600 text-lg">✓</span>
                <div>
                  <p className="text-sm font-medium text-green-800">Client ID 설정됨</p>
                  <p className="text-xs text-green-600">다음 접속부터 Google 로그인 화면이 표시됩니다.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
                <span className="text-gray-400 text-lg">○</span>
                <p className="text-sm text-gray-500">Client ID 미설정 — 로그인 없이 사용 중</p>
              </div>
            )}
            {homeContent.googleClientId&&(
              <Btn variant="danger" size="sm" onClick={()=>{if(confirm('Google 로그인을 비활성화하시겠습니까?'))setHomeContent(p=>({...p,googleClientId:''}));}}>
                Google 로그인 비활성화
              </Btn>
            )}
          </Card>

          <Card cls="space-y-3">
            <h2 className="font-bold text-gray-800">허용 이메일 목록</h2>
            <p className="text-sm text-gray-500">비워두면 모든 Google 계정으로 로그인 가능합니다. 특정 계정만 허용하려면 이메일을 추가하세요.</p>
            <AllowedEmailsEditor homeContent={homeContent} setHomeContent={setHomeContent}/>
          </Card>
        </div>
      )}

      {tab==='security'&&(
        <Card cls="space-y-4">
          <h2 className="font-bold text-gray-800">PIN 번호 변경</h2>
          <PinChanger homeContent={homeContent} setHomeContent={setHomeContent}/>
        </Card>
      )}
    </div>
  );
};

// PIN 변경 (별도 컴포넌트로 분리 — hooks 규칙 준수)
const PinChanger = ({ homeContent, setHomeContent }) => {
  const [np, setNp] = useState('');
  const [cp, setCp] = useState('');
  return (
    <div className="space-y-3">
      <Inp label="새 PIN" type="password" value={np} onChange={setNp} placeholder="4자리 이상"/>
      <Inp label="확인" type="password" value={cp} onChange={setCp} placeholder="재입력"/>
      <Btn onClick={()=>{if(np.length<4)return alert('4자리 이상 입력');if(np!==cp)return alert('PIN이 일치하지 않습니다');setHomeContent(p=>({...p,adminPin:np}));setNp('');setCp('');alert('변경 완료!');}} cls="w-full justify-center">변경</Btn>
    </div>
  );
};

// 허용 이메일 편집
const AllowedEmailsEditor = ({ homeContent, setHomeContent }) => {
  const [newEmail, setNewEmail] = useState('');
  const emails = homeContent.allowedEmails||[];
  const add = () => {
    if(!newEmail.includes('@')) return alert('올바른 이메일 형식이 아닙니다');
    if(emails.includes(newEmail)) return alert('이미 추가된 이메일입니다');
    setHomeContent(p=>({...p,allowedEmails:[...emails,newEmail]}));
    setNewEmail('');
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input value={newEmail} onChange={e=>setNewEmail(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}
          placeholder="teacher@gmail.com" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-sky-400"/>
        <Btn size="sm" onClick={add}><Icon name="plus" size={14}/>추가</Btn>
      </div>
      {emails.length===0&&<p className="text-sm text-gray-400 text-center py-2">허용 이메일 없음 (모든 계정 허용)</p>}
      <div className="space-y-1">
        {emails.map(e=>(
          <div key={e} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
            <span className="text-sm flex-1">{e}</span>
            <button onClick={()=>setHomeContent(p=>({...p,allowedEmails:emails.filter(x=>x!==e)}))} className="text-red-400 hover:text-red-600"><Icon name="x" size={14}/></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Google 로그인 페이지 ──────────────────────────────────
const LoginPage = ({ homeContent, onLogin }) => {
  const btnRef = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const decodeJWT = token => {
    try {
      const b64 = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
      return JSON.parse(atob(b64));
    } catch { return null; }
  };

  useEffect(() => {
    if (!homeContent.googleClientId) { setLoading(false); return; }
    const init = () => {
      if (!window.google) { setTimeout(init, 300); return; }
      setLoading(false);
      try {
        window.google.accounts.id.initialize({
          client_id: homeContent.googleClientId,
          callback: res => {
            const payload = decodeJWT(res.credential);
            if (!payload) return setError('로그인 처리 중 오류가 발생했습니다.');
            const allowed = homeContent.allowedEmails||[];
            if (allowed.length>0 && !allowed.includes(payload.email)) {
              setError(`${payload.email} 은(는) 접근 권한이 없습니다. 관리자에게 문의하세요.`);
              return;
            }
            onLogin({ name:payload.name, email:payload.email, picture:payload.picture, sub:payload.sub });
          },
          auto_select: true,
        });
        if (btnRef.current) {
          window.google.accounts.id.renderButton(btnRef.current, {
            theme:'outline', size:'large', text:'signin_with', locale:'ko', width:300,
          });
        }
        window.google.accounts.id.prompt();
      } catch(e) { setError('Google 초기화 오류: '+e.message); setLoading(false); }
    };
    init();
  }, [homeContent.googleClientId]);

  const hasClientId = !!homeContent.googleClientId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm space-y-6">
        {/* 로고 */}
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-3xl">✝</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{homeContent.churchName||'교회학교'}</h1>
          <p className="text-sm text-gray-500 mt-1">{homeContent.subtitle||'교적부 관리 시스템'}</p>
        </div>

        {hasClientId ? (
          <div className="space-y-4">
            <p className="text-center text-sm text-gray-600">Google 계정으로 로그인하세요</p>
            {loading && <div className="flex justify-center"><div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"/></div>}
            <div ref={btnRef} className="flex justify-center min-h-[44px]"/>
            {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 text-center">{error}</div>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-center space-y-2">
              <p className="font-semibold">⚙️ Google 로그인 미설정</p>
              <p className="text-xs">관리자 페이지에서 Google Client ID를 설정하면 Google 로그인이 활성화됩니다.</p>
            </div>
            <Btn onClick={()=>onLogin({name:'게스트',email:'',picture:'',sub:'guest'})} cls="w-full justify-center py-3" variant="secondary">
              로그인 없이 계속하기
            </Btn>
          </div>
        )}

        <p className="text-xs text-center text-gray-400">교회학교 교적부 관리 시스템</p>
      </div>
    </div>
  );
};

// ── 앱 루트 ──────────────────────────────────────────────
const App = () => {
  const [page, setPage] = useState('dashboard');
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [authUser, setAuthUser] = useLS('ch_auth_user', null);

  const [homeContent, setHomeContent] = useLS('ch_home', DEFAULT_HOME);
  const [sections,    setSections]    = useLS('ch_sections',  DEFAULT_SECTIONS);
  const [classes,     setClasses]     = useLS('ch_classes',   DEFAULT_CLASSES);
  const [students,    setStudents]    = useLS('ch_students',  INITIAL_STUDENTS);
  const [teachers,    setTeachers]    = useLS('ch_teachers',  INITIAL_TEACHERS);
  const [attendance,  setAttendance]  = useLS('ch_attendance', ()=>generateSampleAttendance(DEFAULT_CLASSES));
  const [meetings,    setMeetings]    = useLS('ch_meetings',  INITIAL_MEETINGS);
  const [photos,      setPhotos]      = useLS('ch_photos',    INITIAL_PHOTOS);
  const [prayers,     setPrayers]     = useLS('ch_prayers',   INITIAL_PRAYERS);

  const nav = p => { setPage(p); window.scrollTo({top:0,behavior:'smooth'}); };
  const selectSection = id => { setActiveSectionId(id); setPage('section'); window.scrollTo({top:0,behavior:'smooth'}); };

  const handleLogout = () => {
    if (window.google) { try { window.google.accounts.id.disableAutoSelect(); } catch {} }
    setAuthUser(null);
  };

  // Google 로그인이 설정된 경우에만 로그인 화면 표시
  const needsLogin = homeContent.googleClientId && !authUser;

  if (needsLogin) {
    return (
      <>
        <script src="https://accounts.google.com/gsi/client" async defer/>
        <LoginPage homeContent={homeContent} onLogin={user=>setAuthUser(user)}/>
      </>
    );
  }

  const props = { sections, classes, students, teachers, attendance, meetings, photos, prayers, setStudents, setTeachers, setAttendance, setMeetings, setPhotos, setPrayers };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard homeContent={homeContent} sections={sections} classes={classes} students={students} attendance={attendance} meetings={meetings} setPage={nav} onSelectSection={selectSection}/>;
      case 'section':   return <SectionPage section={sections.find(s=>s.id===activeSectionId)||sections[0]} {...props} setPage={nav}/>;
      case 'students':  return <StudentsPage {...props}/>;
      case 'attendance':return <AttendancePage {...props}/>;
      case 'stats':     return <StatsPage {...props}/>;
      case 'birthday':  return <BirthdayPage students={students} classes={classes}/>;
      case 'teachers':  return <TeachersPage {...props}/>;
      case 'meetings':  return <MeetingsPage meetings={meetings} setMeetings={setMeetings}/>;
      case 'photos':    return <PhotosPage photos={photos} setPhotos={setPhotos} sections={sections}/>;
      case 'prayers':   return <PrayersPage prayers={prayers} setPrayers={setPrayers}/>;
      case 'admin':     return <AdminPage homeContent={homeContent} setHomeContent={setHomeContent} sections={sections} setSections={setSections} classes={classes} setClasses={setClasses} teachers={teachers} students={students}/>;
      case 'more':      return <MoreMenu setPage={nav}/>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Google GSI 스크립트 */}
      {homeContent.googleClientId && <script src="https://accounts.google.com/gsi/client" async defer/>}

      {/* 상단 섹션 네비게이션 */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-3 flex items-center">
          <div className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-hide">
            <button onClick={()=>nav('dashboard')}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-all ${page==='dashboard'?'border-sky-500 text-sky-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon name="home" size={16}/><span className="hidden sm:inline">홈</span>
            </button>
            {sections.map(sec=>{
              const active = page==='section'&&activeSectionId===sec.id;
              const colMap = {rose:'text-rose-600 border-rose-500',amber:'text-amber-600 border-amber-500',sky:'text-sky-600 border-sky-500',violet:'text-violet-600 border-violet-500'};
              return (
                <button key={sec.id} onClick={()=>selectSection(sec.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${active?(colMap[sec.color]||'text-sky-600 border-sky-500'):'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  <span>{sec.emoji}</span><span>{sec.name}</span>
                </button>
              );
            })}
          </div>
          {/* 유저 프로필 */}
          {authUser && (
            <div className="flex-shrink-0 flex items-center gap-2 pl-2 border-l border-gray-100 ml-1">
              {authUser.picture
                ? <img src={authUser.picture} alt="" className="w-8 h-8 rounded-full border-2 border-sky-200" referrerPolicy="no-referrer"/>
                : <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-xs font-bold">{authUser.name?.[0]||'?'}</div>
              }
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-gray-700 leading-none">{authUser.name}</p>
                {authUser.email && <p className="text-xs text-gray-400">{authUser.email}</p>}
              </div>
              <button onClick={handleLogout} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="로그아웃">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex">
        <Sidebar page={page} setPage={nav}/>
        <main className="flex-1 max-w-2xl mx-auto px-3 pt-4 pb-24 md:pb-6 min-h-screen">
          {renderPage()}
        </main>
      </div>
      <BottomNav page={page} setPage={nav}/>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
