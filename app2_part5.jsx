
// ── 관리자 페이지 ────────────────────────────────────────
const AdminPage = ({ homeContent, setHomeContent, sections, setSections, classes, setClasses, teachers, students }) => {
  const [authed, setAuthed] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [tab, setTab] = useState('home');
  const [editingSec, setEditingSec] = useState(null);
  const [showAddSec, setShowAddSec] = useState(false);
  const [editingCls, setEditingCls] = useState(null);
  const [showAddCls, setShowAddCls] = useState(null); // sectionId

  // PIN 인증
  if (!authed) return (
    <div className="fade-in flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-3"><Icon name="lock" size={32} cls="text-sky-500"/></div>
        <h1 className="text-xl font-bold text-gray-800">관리자 페이지</h1>
        <p className="text-sm text-gray-500 mt-1">PIN 번호를 입력하세요 (기본: 1234)</p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <input type="password" value={pinInput} onChange={e=>setPinInput(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&(pinInput===homeContent.adminPin?setAuthed(true):alert('PIN이 틀렸습니다.'))}
          placeholder="PIN 번호"
          className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-center text-2xl tracking-widest outline-none focus:border-sky-400 transition-all"/>
        <Btn onClick={()=>pinInput===homeContent.adminPin?setAuthed(true):alert('PIN이 틀렸습니다.')} cls="w-full justify-center py-3">
          <Icon name="key" size={18}/>입장
        </Btn>
      </div>
    </div>
  );

  const TABS = [
    { id:'home', label:'홈 편집', icon:'edit' },
    { id:'sections', label:'섹션/반 관리', icon:'users' },
    { id:'security', label:'보안', icon:'lock' },
  ];

  const secGrad = { rose:'from-rose-400 to-pink-500', amber:'from-amber-400 to-orange-500', sky:'from-sky-400 to-blue-500', violet:'from-violet-400 to-purple-500' };
  const COLOR_OPTIONS = [
    { value:'rose',   label:'장미색(영유치부)' },
    { value:'amber',  label:'황금색(아동부)' },
    { value:'sky',    label:'하늘색(학생부)' },
    { value:'violet', label:'보라색(청년부)' },
    { value:'green',  label:'초록색' },
    { value:'blue',   label:'파란색' },
  ];
  const EMOJI_OPTIONS = ['🌸','🌟','📚','✨','⛪','🙏','❤️','🎵','⚽','📖','🌈','🕊️'];

  const SecForm = ({ initial, onSave, onClose }) => {
    const empty = { name:'', color:'sky', emoji:'✨' };
    const [form, setForm] = useState(initial||empty);
    const set = (k,v)=>setForm(f=>({...f,[k]:v}));
    return (
      <div className="space-y-3">
        <Inp label="섹션 이름" value={form.name} onChange={v=>set('name',v)} required placeholder="예: 아동부"/>
        <Sel label="색상" value={form.color} onChange={v=>set('color',v)} options={COLOR_OPTIONS}/>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">이모지</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map(e=>(
              <button key={e} onClick={()=>set('emoji',e)}
                className={`w-10 h-10 text-xl rounded-xl border-2 transition-all ${form.emoji===e?'border-sky-500 bg-sky-50':'border-gray-200 hover:border-sky-300'}`}>{e}</button>
            ))}
          </div>
          <input value={form.emoji} onChange={ev=>set('emoji',ev.target.value)} placeholder="직접 입력" className="border border-gray-200 rounded-xl px-3 py-2 text-sm mt-1 outline-none focus:border-sky-400"/>
        </div>
        <div className={`bg-gradient-to-r ${secGrad[form.color]||secGrad.sky} rounded-xl p-3 flex items-center gap-2`}>
          <span className="text-2xl">{form.emoji}</span>
          <span className="font-bold text-white">{form.name||'미리보기'}</span>
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
        <Inp label="반 이름" value={name} onChange={setName} required placeholder="예: 초등3부"/>
        <Sel label="소속 섹션" value={sid} onChange={setSid} options={sections.map(s=>({value:s.id,label:`${s.emoji} ${s.name}`}))}/>
        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose} variant="secondary" cls="flex-1">취소</Btn>
          <Btn onClick={()=>{if(!name)return alert('이름 입력');onSave({name,sectionId:sid});onClose();}} cls="flex-1">저장</Btn>
        </div>
      </div>
    );
  };

  const canDeleteSection = id => {
    const hasClasses = classes.some(c=>c.sectionId===id);
    const hasStudents = students.some(s=>{ const cls=classes.find(c=>c.id===s.classId); return cls?.sectionId===id; });
    return !hasClasses && !hasStudents;
  };

  const canDeleteClass = id => {
    const hasStudents = students.some(s=>s.classId===id);
    const hasTeachers = teachers.some(t=>t.classId===id);
    return !hasStudents && !hasTeachers;
  };

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center"><Icon name="settings" size={20} cls="text-sky-500"/></div>
          <div><h1 className="text-xl font-bold text-gray-800">관리자</h1><p className="text-xs text-green-500 font-medium">✓ 인증됨</p></div>
        </div>
        <Btn variant="ghost" size="sm" onClick={()=>setAuthed(false)}>로그아웃</Btn>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 bg-gray-100 rounded-2xl p-1">
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all ${tab===t.id?'bg-white text-sky-600 shadow-sm':'text-gray-500'}`}>
            <Icon name={t.icon} size={14}/>{t.label}
          </button>
        ))}
      </div>

      {/* 홈 편집 */}
      {tab==='home' && (
        <Card cls="space-y-4">
          <h2 className="font-bold text-gray-800">홈페이지 설정</h2>
          <Inp label="교회/학교 이름" value={homeContent.churchName} onChange={v=>setHomeContent(p=>({...p,churchName:v}))} placeholder="○○교회 교회학교"/>
          <Inp label="소개 문구" value={homeContent.subtitle} onChange={v=>setHomeContent(p=>({...p,subtitle:v}))} placeholder="하나님의 사랑으로..."/>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">공지사항 (홈에 표시)</label>
            <textarea value={homeContent.announcement} onChange={e=>setHomeContent(p=>({...p,announcement:e.target.value}))}
              placeholder="공지사항이 있으면 입력하세요. 없으면 비워두세요."
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm h-20 resize-none outline-none focus:border-sky-400"/>
          </div>
          <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-4 text-white">
            <p className="text-xl font-bold">{homeContent.churchName||'교회학교'}</p>
            {homeContent.subtitle&&<p className="text-sky-200 text-sm mt-0.5">{homeContent.subtitle}</p>}
            {homeContent.announcement&&<div className="bg-white/20 rounded-xl p-2 mt-2 text-sm">📢 {homeContent.announcement}</div>}
          </div>
        </Card>
      )}

      {/* 섹션/반 관리 */}
      {tab==='sections' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-800">부서 (섹션) 관리</h2>
            <Btn size="sm" onClick={()=>setShowAddSec(true)}><Icon name="plus" size={14}/>부서 추가</Btn>
          </div>
          {sections.map(sec=>(
            <Card key={sec.id} cls="space-y-3">
              <div className={`bg-gradient-to-r ${secGrad[sec.color]||secGrad.sky} rounded-xl px-4 py-2.5 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{sec.emoji}</span>
                  <span className="font-bold text-white">{sec.name}</span>
                  <span className="text-white/70 text-sm">({classes.filter(c=>c.sectionId===sec.id).length}개 반)</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={()=>setEditingSec(sec)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white"><Icon name="edit" size={14}/></button>
                  <button onClick={()=>{
                    if(!canDeleteSection(sec.id)) return alert('이 섹션에 반이나 학생이 있어 삭제할 수 없습니다.\n먼저 반을 다른 섹션으로 이동하거나 삭제하세요.');
                    if(confirm(`"${sec.name}" 섹션을 삭제하시겠습니까?`)) setSections(p=>p.filter(s=>s.id!==sec.id));
                  }} className="p-1.5 bg-white/20 hover:bg-red-400/50 rounded-lg text-white"><Icon name="trash" size={14}/></button>
                </div>
              </div>
              <div className="space-y-2">
                {classes.filter(c=>c.sectionId===sec.id).map(cls=>{
                  const sc=students.filter(s=>s.classId===cls.id&&s.active).length;
                  const tc=teachers.filter(t=>t.classId===cls.id).length;
                  return (
                    <div key={cls.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <span className="font-medium text-sm text-gray-800">{cls.name}</span>
                        <span className="text-xs text-gray-400 ml-2">학생 {sc}명 · 교사 {tc}명</span>
                      </div>
                      <button onClick={()=>setEditingCls(cls)} className="p-1.5 hover:bg-sky-100 rounded-lg text-sky-500"><Icon name="edit" size={13}/></button>
                      <button onClick={()=>{
                        if(!canDeleteClass(cls.id)) return alert('이 반에 학생이나 교사가 있어 삭제할 수 없습니다.');
                        if(confirm(`"${cls.name}" 반을 삭제하시겠습니까?`)) setClasses(p=>p.filter(c=>c.id!==cls.id));
                      }} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"><Icon name="trash" size={13}/></button>
                    </div>
                  );
                })}
              </div>
              <Btn size="sm" variant="secondary" cls="w-full justify-center" onClick={()=>setShowAddCls(sec.id)}>
                <Icon name="plus" size={14}/>{sec.name}에 반 추가
              </Btn>
            </Card>
          ))}
          {showAddSec&&<Modal title="부서 추가" onClose={()=>setShowAddSec(false)}><SecForm onSave={f=>setSections(p=>[...p,{...f,id:'s'+(Date.now())}])} onClose={()=>setShowAddSec(false)}/></Modal>}
          {editingSec&&<Modal title="부서 수정" onClose={()=>setEditingSec(null)}><SecForm initial={editingSec} onSave={f=>setSections(p=>p.map(s=>s.id===editingSec.id?{...s,...f}:s))} onClose={()=>setEditingSec(null)}/></Modal>}
          {showAddCls&&<Modal title="반 추가" onClose={()=>setShowAddCls(null)}><ClsForm sectionId={showAddCls} onSave={f=>setClasses(p=>[...p,{...f,id:'c'+(Date.now())}])} onClose={()=>setShowAddCls(null)}/></Modal>}
          {editingCls&&<Modal title="반 수정" onClose={()=>setEditingCls(null)}><ClsForm initial={editingCls} onSave={f=>setClasses(p=>p.map(c=>c.id===editingCls.id?{...c,...f}:c))} onClose={()=>setEditingCls(null)}/></Modal>}
        </div>
      )}

      {/* 보안 */}
      {tab==='security' && (
        <Card cls="space-y-4">
          <h2 className="font-bold text-gray-800">PIN 번호 변경</h2>
          <p className="text-sm text-gray-500">관리자 페이지 접근 PIN 번호를 변경합니다.</p>
          {(() => {
            const [np, setNp] = useState('');
            const [cp, setCp] = useState('');
            return (
              <div className="space-y-3">
                <Inp label="새 PIN 번호" type="password" value={np} onChange={setNp} placeholder="4자리 이상"/>
                <Inp label="확인" type="password" value={cp} onChange={setCp} placeholder="새 PIN 재입력"/>
                <Btn onClick={()=>{
                  if(np.length<4) return alert('PIN은 4자리 이상이어야 합니다.');
                  if(np!==cp) return alert('PIN이 일치하지 않습니다.');
                  setHomeContent(p=>({...p,adminPin:np})); setNp(''); setCp(''); alert('PIN이 변경되었습니다.');
                }} cls="w-full justify-center">PIN 변경</Btn>
              </div>
            );
          })()}
        </Card>
      )}
    </div>
  );
};

// ── 앱 루트 ──────────────────────────────────────────────
const App = () => {
  const [page, setPage] = useState('dashboard');
  const [activeSectionId, setActiveSectionId] = useState(null);

  const [homeContent, setHomeContent] = useLS('ch_home', DEFAULT_HOME);
  const [sections,    setSections]    = useLS('ch_sections', DEFAULT_SECTIONS);
  const [classes,     setClasses]     = useLS('ch_classes',  DEFAULT_CLASSES);
  const [students,    setStudents]    = useLS('ch_students',  INITIAL_STUDENTS);
  const [teachers,    setTeachers]    = useLS('ch_teachers',  INITIAL_TEACHERS);
  const [attendance,  setAttendance]  = useLS('ch_attendance', ()=>generateSampleAttendance(DEFAULT_CLASSES));
  const [meetings,    setMeetings]    = useLS('ch_meetings',   INITIAL_MEETINGS);
  const [photos,      setPhotos]      = useLS('ch_photos',     INITIAL_PHOTOS);
  const [prayers,     setPrayers]     = useLS('ch_prayers',    INITIAL_PRAYERS);

  const nav = p => { setPage(p); window.scrollTo({top:0,behavior:'smooth'}); };
  const selectSection = id => { setActiveSectionId(id); setPage('section'); window.scrollTo({top:0,behavior:'smooth'}); };

  const renderPage = () => {
    const props = { sections, classes, students, teachers, attendance, meetings, photos, prayers, setStudents, setTeachers, setAttendance, setMeetings, setPhotos, setPrayers };
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

  const currentPage = page==='section' ? 'section' : page;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 상단 섹션 네비게이션 */}
      <SectionNav
        sections={sections}
        activeSectionId={activeSectionId}
        onSelect={selectSection}
        onDashboard={()=>nav('dashboard')}
        currentPage={currentPage}
      />
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
