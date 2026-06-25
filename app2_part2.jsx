
// ── 상단 섹션 탭 네비게이션 ──────────────────────────────
const SectionNav = ({ sections, activeSectionId, onSelect, onDashboard, currentPage }) => {
  const sectionColors = { rose:'text-rose-600 border-rose-500 bg-rose-50', amber:'text-amber-600 border-amber-500 bg-amber-50', sky:'text-sky-600 border-sky-500 bg-sky-50', violet:'text-violet-600 border-violet-500 bg-violet-50' };
  return (
    <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-5xl mx-auto px-3 flex items-center gap-1 overflow-x-auto scrollbar-hide">
        <button onClick={onDashboard}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-all ${currentPage==='dashboard'?'border-sky-500 text-sky-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Icon name="home" size={16}/><span className="hidden sm:inline">홈</span>
        </button>
        {sections.map(sec => {
          const active = currentPage==='section' && activeSectionId===sec.id;
          const col = sectionColors[sec.color] || sectionColors.sky;
          return (
            <button key={sec.id} onClick={()=>onSelect(sec.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${active ? col+' border-current' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <span>{sec.emoji}</span><span>{sec.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── 사이드바 ─────────────────────────────────────────────
const NAV_ITEMS = [
  { id:'dashboard', label:'대시보드', icon:'home' },
  { id:'students',  label:'교적부',   icon:'users' },
  { id:'attendance',label:'출석체크', icon:'check' },
  { id:'stats',     label:'통계',     icon:'chart' },
  { id:'birthday',  label:'생일',     icon:'cake' },
  { id:'teachers',  label:'선생님',   icon:'teacher' },
  { id:'meetings',  label:'회의자료', icon:'doc' },
  { id:'photos',    label:'사진앨범', icon:'photo' },
  { id:'prayers',   label:'기도제목', icon:'pray' },
  { id:'admin',     label:'관리자',   icon:'settings' },
];
const Sidebar = ({ page, setPage }) => (
  <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 h-screen sticky top-[49px] z-30 overflow-y-auto scrollbar-hide">
    <nav className="p-3">
      {NAV_ITEMS.map(item=>(
        <button key={item.id} onClick={()=>setPage(item.id)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all ${page===item.id?'bg-sky-500 text-white shadow-sm':'text-gray-600 hover:bg-sky-50 hover:text-sky-700'}`}>
          <Icon name={item.icon} size={17}/>{item.label}
        </button>
      ))}
    </nav>
  </aside>
);
const BottomNav = ({ page, setPage }) => {
  const main = NAV_ITEMS.slice(0,5);
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-30 flex safe-area-pb">
      {main.map(item=>(
        <button key={item.id} onClick={()=>setPage(item.id)}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${page===item.id?'text-sky-500':'text-gray-400'}`}>
          <Icon name={item.icon} size={20}/>{item.label}
        </button>
      ))}
      <button onClick={()=>setPage('more')}
        className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium ${['meetings','photos','prayers','teachers','admin'].includes(page)?'text-sky-500':'text-gray-400'}`}>
        <Icon name="menu" size={20}/>더보기
      </button>
    </nav>
  );
};
const MoreMenu = ({ setPage }) => (
  <div className="p-4 fade-in">
    <h2 className="font-bold text-xl text-gray-800 mb-4">메뉴</h2>
    <div className="grid grid-cols-3 gap-3">
      {[{id:'stats',label:'통계',icon:'chart'},{id:'teachers',label:'선생님',icon:'teacher'},{id:'meetings',label:'회의자료',icon:'doc'},{id:'photos',label:'사진앨범',icon:'photo'},{id:'prayers',label:'기도제목',icon:'pray'},{id:'admin',label:'관리자',icon:'settings'}].map(item=>(
        <button key={item.id} onClick={()=>setPage(item.id)}
          className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl shadow-sm border border-sky-100 hover:bg-sky-50 transition-all">
          <Icon name={item.icon} size={26} cls="text-sky-500"/>
          <span className="text-sm font-medium text-gray-700">{item.label}</span>
        </button>
      ))}
    </div>
  </div>
);

// ── 섹션 개요 페이지 ─────────────────────────────────────
const SectionPage = ({ section, classes, students, attendance, teachers, photos, setPage }) => {
  const sectionClasses = classes.filter(c=>c.sectionId===section.id);
  const classIds = sectionClasses.map(c=>c.id);
  const sectionStudents = students.filter(s=>classIds.includes(s.classId)&&s.active);
  const sectionPhotos = photos.filter(p=>p.sectionId===section.id||p.sectionId==='all');

  const recent = Object.entries(attendance).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,4);
  let total=0, present=0;
  recent.forEach(([,recs])=>sectionStudents.forEach(s=>{ if(recs[s.id]){total++;if(recs[s.id]==='출석')present++;} }));
  const rate = total ? Math.round(present/total*100) : 0;

  const classTeachers = (cId) => teachers.filter(t=>t.classId===cId);
  const weekBdays = sectionStudents.filter(s=>isThisWeek(s.birthDate));

  const gradColors = { rose:'from-rose-400 to-pink-500', amber:'from-amber-400 to-orange-500', sky:'from-sky-400 to-blue-500', violet:'from-violet-400 to-purple-500' };
  const textAccent = { rose:'text-rose-600', amber:'text-amber-600', sky:'text-sky-600', violet:'text-violet-600' };
  const bgAccent = { rose:'bg-rose-50', amber:'bg-amber-50', sky:'bg-sky-50', violet:'bg-violet-50' };
  const PLACEHOLDERS = ['🌸','🌿','⛅','🌟','🙏','❤️','✝️','🎉'];

  return (
    <div className="fade-in space-y-4">
      {/* 섹션 헤더 배너 */}
      <div className={`bg-gradient-to-r ${gradColors[section.color]||gradColors.sky} rounded-2xl p-5 text-white`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{section.emoji}</span>
          <div>
            <h1 className="text-2xl font-bold">{section.name}</h1>
            <p className="text-white/80 text-sm">{sectionClasses.map(c=>c.name).join(' · ')}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/20 rounded-xl p-2.5 text-center">
            <p className="text-2xl font-bold">{sectionStudents.length}</p>
            <p className="text-white/80 text-xs">재적</p>
          </div>
          <div className="bg-white/20 rounded-xl p-2.5 text-center">
            <p className="text-2xl font-bold">{rate}%</p>
            <p className="text-white/80 text-xs">출석률</p>
          </div>
          <div className="bg-white/20 rounded-xl p-2.5 text-center">
            <p className="text-2xl font-bold">{sectionClasses.length}</p>
            <p className="text-white/80 text-xs">반</p>
          </div>
        </div>
      </div>

      {/* 반별 현황 */}
      <Card>
        <h2 className="font-bold text-gray-800 mb-3">반별 현황</h2>
        <div className="space-y-3">
          {sectionClasses.map(cls=>{
            const clsStudents = students.filter(s=>s.classId===cls.id&&s.active);
            const t = classTeachers(cls.id);
            let ct=0, cp=0;
            recent.forEach(([,recs])=>clsStudents.forEach(s=>{if(recs[s.id]){ct++;if(recs[s.id]==='출석')cp++;}}));
            const cr = ct ? Math.round(cp/ct*100) : 0;
            return (
              <div key={cls.id} className={`p-3 ${bgAccent[section.color]||bgAccent.sky} rounded-xl`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-bold text-gray-800">{cls.name}</span>
                    <span className="text-sm text-gray-500 ml-2">{clsStudents.length}명</span>
                    {t.map(tc=><span key={tc.id} className="text-xs text-gray-500 ml-2">· 담당: {tc.name}</span>)}
                  </div>
                  <span className={`font-bold text-sm ${textAccent[section.color]||textAccent.sky}`}>{cr}%</span>
                </div>
                <div className="h-1.5 bg-white/60 rounded-full"><div className="h-full rounded-full bg-current opacity-60 transition-all" style={{width:`${cr}%`, color: section.color==='rose'?'#f43f5e':section.color==='amber'?'#f59e0b':section.color==='sky'?'#0ea5e9':'#8b5cf6'}}/></div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 이번 주 생일 */}
      {weekBdays.length>0 && (
        <Card>
          <h2 className="font-bold text-gray-800 mb-2">🎂 이번 주 생일자</h2>
          <div className="flex flex-wrap gap-2">
            {weekBdays.map(s=>(
              <div key={s.id} className="flex items-center gap-2 bg-pink-50 rounded-xl px-3 py-2">
                <span className="font-medium text-sm">{s.name}</span>
                <span className="text-xs text-pink-500">{getDaysUntilBirthday(s.birthDate)===0?'오늘!':'D-'+getDaysUntilBirthday(s.birthDate)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 사진 */}
      {sectionPhotos.length>0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800">📸 사진</h2>
            <Btn size="sm" variant="secondary" onClick={()=>setPage('photos')}>전체보기</Btn>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {sectionPhotos.slice(0,6).map((p,i)=>(
              <div key={p.id} className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
                {p.src?<img src={p.src} alt="" className="w-full h-full object-cover"/>:<span className="text-3xl">{PLACEHOLDERS[i%PLACEHOLDERS.length]}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 학생 목록 */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800">학생 목록</h2>
          <Btn size="sm" variant="secondary" onClick={()=>setPage('students')}>교적부</Btn>
        </div>
        <div className="flex flex-wrap gap-2">
          {sectionStudents.map(s=>(
            <div key={s.id} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br ${gradColors[section.color]||gradColors.sky}`}>{s.name[0]}</div>
              <span className="text-sm text-gray-700">{s.name}</span>
              {isThisWeek(s.birthDate)&&<span className="text-xs">🎂</span>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ── 대시보드 ─────────────────────────────────────────────
const Dashboard = ({ homeContent, sections, classes, students, attendance, meetings, setPage, onSelectSection }) => {
  const active = students.filter(s=>s.active);
  const todayRecs = attendance[todayStr()]||{};
  const todayPresent = Object.values(todayRecs).filter(s=>s==='출석').length;
  const weekBdays = active.filter(s=>isThisWeek(s.birthDate)).sort((a,b)=>getDaysUntilBirthday(a.birthDate)-getDaysUntilBirthday(b.birthDate));
  const recentMeetings = [...meetings].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
  const catCol = {'회의록':'purple','공지':'orange','교육자료':'green'};
  const secGrad = { rose:'from-rose-400 to-pink-500', amber:'from-amber-400 to-orange-500', sky:'from-sky-400 to-blue-500', violet:'from-violet-400 to-purple-500' };

  return (
    <div className="fade-in space-y-4">
      {/* 히어로 배너 */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-5 text-white">
        <p className="text-sky-100 text-sm mb-0.5">{new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'})}</p>
        <h1 className="text-xl font-bold mb-0.5">{homeContent.churchName}</h1>
        {homeContent.subtitle && <p className="text-sky-200 text-sm mb-3">{homeContent.subtitle}</p>}
        {homeContent.announcement && (
          <div className="bg-white/20 rounded-xl p-2.5 mb-3 flex items-start gap-2">
            <span>📢</span><p className="text-sm">{homeContent.announcement}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/20 rounded-xl p-3"><p className="text-sky-100 text-xs mb-1">전체 재적</p><p className="text-3xl font-bold">{active.length}<span className="text-lg ml-1">명</span></p></div>
          <div className="bg-white/20 rounded-xl p-3"><p className="text-sky-100 text-xs mb-1">오늘 출석</p><p className="text-3xl font-bold">{todayPresent}<span className="text-lg ml-1">명</span></p></div>
        </div>
      </div>

      {/* 섹션 카드 */}
      <div>
        <h2 className="font-bold text-gray-700 mb-2 text-sm">부서 바로가기</h2>
        <div className="grid grid-cols-2 gap-3">
          {sections.map(sec=>{
            const secClasses = classes.filter(c=>c.sectionId===sec.id);
            const cnt = students.filter(s=>secClasses.some(c=>c.id===s.classId)&&s.active).length;
            return (
              <button key={sec.id} onClick={()=>onSelectSection(sec.id)}
                className={`bg-gradient-to-br ${secGrad[sec.color]||secGrad.sky} rounded-2xl p-4 text-white text-left hover:opacity-90 transition-opacity active:scale-95`}>
                <p className="text-3xl mb-2">{sec.emoji}</p>
                <p className="font-bold text-base">{sec.name}</p>
                <p className="text-white/80 text-sm">{cnt}명</p>
              </button>
            );
          })}
        </div>
      </div>

      {weekBdays.length>0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><span>🎂</span> 이번 주 생일자</h2>
            <Btn size="sm" variant="secondary" onClick={()=>setPage('birthday')}>전체보기</Btn>
          </div>
          <div className="space-y-2">
            {weekBdays.map(s=>(
              <div key={s.id} className="flex items-center gap-3 p-2 bg-pink-50 rounded-xl">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center text-pink-500 font-bold text-sm">{s.name[0]}</div>
                <div className="flex-1">
                  <span className="font-medium text-gray-800 text-sm">{s.name}</span>
                  <span className="text-xs text-gray-500 ml-2">{classes.find(c=>c.id===s.classId)?.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-pink-600 font-medium">{getBirthMMDD(s.birthDate)}</p>
                  <p className="text-xs text-gray-400">{getDaysUntilBirthday(s.birthDate)===0?'오늘!🥳':`D-${getDaysUntilBirthday(s.birthDate)}`}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800">📄 최근 회의자료</h2>
          <Btn size="sm" variant="secondary" onClick={()=>setPage('meetings')}>전체보기</Btn>
        </div>
        <div className="space-y-2">
          {recentMeetings.map(m=>(
            <div key={m.id} className="flex items-center gap-3 p-2.5 hover:bg-gray-50 rounded-xl">
              <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center text-sky-500 flex-shrink-0"><Icon name="doc" size={16}/></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{m.title}</p>
                <p className="text-xs text-gray-400">{fmt(m.date)} · {m.uploader}</p>
              </div>
              <Badge text={m.category} color={catCol[m.category]||'sky'}/>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
