
// ── 교사 관리 패널 (슬라이드 드로어) ─────────────────────
const ManagePanel=({onClose,authUser,onLogout,site,setSite,sections,setSections,classes,setClasses,students,setStudents,teachers,setTeachers,attendance,setAttendance,meetings,setMeetings,photos,setPhotos,prayers,setPrayers})=>{
  const [page,setPage]=useState('dashboard');
  const [selSec,setSelSec]=useState(null); // 섹션 필터

  const nav=p=>setPage(p);
  const CYCLE={'출석':'결석','결석':'조퇴','조퇴':'공결','공결':'출석'};
  const STATUS_BG={'출석':'#dcfce7','결석':'#fee2e2','조퇴':'#fef9c3','공결':'#dbeafe'};
  const STATUS_TXT={'출석':'#16a34a','결석':'#dc2626','조퇴':'#ca8a04','공결':'#2563eb'};

  const NAVS=[
    {id:'dashboard',l:'대시보드',e:'📊'},
    {id:'attendance',l:'출석체크',e:'✅'},
    {id:'students',l:'교적부',e:'👥'},
    {id:'stats',l:'통계',e:'📈'},
    {id:'birthday',l:'생일',e:'🎂'},
    {id:'teachers',l:'선생님',e:'👨‍🏫'},
    {id:'meetings',l:'회의자료',e:'📄'},
    {id:'photos',l:'사진',e:'📸'},
    {id:'prayers',l:'기도제목',e:'🙏'},
    {id:'admin',l:'관리자',e:'⚙️'},
  ];

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* 배경 딤 */}
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      {/* 패널 */}
      <div className="w-full max-w-3xl bg-white flex flex-col shadow-2xl overflow-hidden" style={{animation:'slideIn 0.3s ease'}}>
        {/* 패널 헤더 */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-[#1a1a1a] flex-shrink-0">
          <span className="text-[#b8934a] text-xl">✝</span>
          <span className="text-white font-bold text-sm flex-1">{site.churchName} — 교사 관리</span>
          {authUser&&(
            <div className="flex items-center gap-2">
              {authUser.picture?<img src={authUser.picture} alt="" className="w-7 h-7 rounded-full border border-[#b8934a]/50" referrerPolicy="no-referrer"/>:<div className="w-7 h-7 rounded-full bg-[#b8934a] flex items-center justify-center text-white text-xs font-bold">{authUser.name?.[0]}</div>}
              <span className="text-white/70 text-xs hidden sm:inline">{authUser.name}</span>
              <button onClick={onLogout} className="text-white/40 hover:text-white text-xs px-2 py-1 rounded border border-white/20 hover:border-white/40 transition-all">로그아웃</button>
            </div>
          )}
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl leading-none ml-1">✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 사이드 메뉴 */}
          <div className="w-16 md:w-44 bg-gray-50 border-r border-gray-100 flex-shrink-0 overflow-y-auto">
            <nav className="p-2 space-y-0.5">
              {NAVS.map(n=>(
                <button key={n.id} onClick={()=>nav(n.id)}
                  className={`w-full flex flex-col md:flex-row items-center gap-1 md:gap-2 px-2 py-2.5 rounded-xl text-xs font-medium transition-all ${page===n.id?'bg-[#1a1a1a] text-white':'text-gray-600 hover:bg-gray-100'}`}>
                  <span className="text-base">{n.e}</span>
                  <span className="hidden md:inline">{n.l}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 overflow-y-auto p-4 bg-white">
            {page==='dashboard'&&<MPDashboard students={students} classes={classes} sections={sections} attendance={attendance} meetings={meetings} selSec={selSec} setSelSec={setSelSec} nav={nav}/>}
            {page==='attendance'&&<MPAttendance students={students} classes={classes} sections={sections} attendance={attendance} setAttendance={setAttendance}/>}
            {page==='students'&&<MPStudents students={students} setStudents={setStudents} classes={classes} sections={sections} attendance={attendance}/>}
            {page==='stats'&&<MPStats students={students} classes={classes} sections={sections} attendance={attendance}/>}
            {page==='birthday'&&<MPBirthday students={students} classes={classes}/>}
            {page==='teachers'&&<MPTeachers teachers={teachers} setTeachers={setTeachers} students={students} classes={classes} sections={sections}/>}
            {page==='meetings'&&<MPMeetings meetings={meetings} setMeetings={setMeetings}/>}
            {page==='photos'&&<MPPhotos photos={photos} setPhotos={setPhotos} sections={sections}/>}
            {page==='prayers'&&<MPPrayers prayers={prayers} setPrayers={setPrayers}/>}
            {page==='admin'&&<MPAdmin site={site} setSite={setSite} sections={sections} setSections={setSections} classes={classes} setClasses={setClasses} teachers={teachers} students={students}/>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── 관리 패널 서브페이지들 ────────────────────────────────

const SectionTag=({sec})=>{
  const cols={rose:'bg-rose-100 text-rose-700',amber:'bg-amber-100 text-amber-700',teal:'bg-teal-100 text-teal-700',indigo:'bg-indigo-100 text-indigo-700'};
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cols[sec?.color]||'bg-gray-100 text-gray-600'}`}>{sec?.name||''}</span>;
};

const MPDashboard=({students,classes,sections,attendance,meetings,nav})=>{
  const active=students.filter(s=>s.active);
  const todayRecs=attendance[todayStr()]||{};
  const todayPresent=Object.values(todayRecs).filter(s=>s==='출석').length;
  const weekBdays=active.filter(s=>isThisWeek(s.birthDate)).sort((a,b)=>getDUB(a.birthDate)-getDUB(b.birthDate));
  const recent=[...meetings].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);

  const secRates=sections.map(sec=>{
    const cIds=classes.filter(c=>c.sectionId===sec.id).map(c=>c.id);
    const ss=active.filter(s=>cIds.includes(s.classId));
    const recs=Object.entries(attendance).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,4);
    let t=0,p=0;
    recs.forEach(([,r])=>ss.forEach(s=>{if(r[s.id]){t++;if(r[s.id]==='출석')p++;}}));
    return {sec,cnt:ss.length,rate:t?Math.round(p/t*100):0};
  });

  return (
    <div className="space-y-5">
      <h2 className="font-bold text-gray-900 text-lg">대시보드</h2>
      <div className="grid grid-cols-2 gap-3">
        {[{v:active.length,l:'전체 재적',c:'#b8934a'},{v:todayPresent,l:'오늘 출석',c:'#3d6b4f'},{v:weekBdays.length,l:'이번 주 생일',c:'#7c3aed'},{v:Object.keys(attendance).length,l:'출석 기록',c:'#0891b2'}].map((c,i)=>(
          <div key={i} className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100">
            <p className="text-3xl font-bold mb-1" style={{color:c.c}}>{c.v}</p>
            <p className="text-xs text-gray-500">{c.l}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-3 text-sm">부서별 최근 출석률</h3>
        {secRates.map(({sec,cnt,rate})=>(
          <div key={sec.id} className="mb-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-gray-700">{sec.emoji} {sec.name} <span className="text-gray-400">({cnt}명)</span></span>
              <span className="font-bold text-gray-700">{rate}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{width:`${rate}%`,background:'#b8934a'}}/>
            </div>
          </div>
        ))}
      </div>

      {weekBdays.length>0&&(
        <div>
          <h3 className="font-semibold text-gray-800 mb-2 text-sm">🎂 이번 주 생일자</h3>
          <div className="space-y-2">
            {weekBdays.map(s=>{
              const cls=classes.find(c=>c.id===s.classId);
              return <div key={s.id} className="flex items-center gap-3 bg-pink-50 rounded-xl p-3">
                <div className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center font-bold text-pink-700 text-sm">{s.name[0]}</div>
                <div className="flex-1"><p className="font-medium text-sm">{s.name}</p><p className="text-xs text-gray-400">{cls?.name}</p></div>
                <span className="text-sm font-bold text-pink-600">{getDUB(s.birthDate)===0?'오늘!🥳':`D-${getDUB(s.birthDate)}`}</span>
              </div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const MPAttendance=({students,classes,sections,attendance,setAttendance})=>{
  const [selDate,setSelDate]=useState(todayStr());
  const [selCls,setSelCls]=useState(classes[0]?.id||'');
  const [saved,setSaved]=useState(false);
  const CYCLE={'출석':'결석','결석':'조퇴','조퇴':'공결','공결':'출석'};
  const clsSts=students.filter(s=>s.classId===selCls&&s.active);
  const recs=attendance[selDate]||{};
  const toggle=id=>{setAttendance(p=>({...p,[selDate]:{...(p[selDate]||{}),[id]:CYCLE[recs[id]||'출석']}}));setSaved(false);};
  const setAll=st=>{const nr={...(attendance[selDate]||{})};clsSts.forEach(s=>nr[s.id]=st);setAttendance(p=>({...p,[selDate]:nr}));setSaved(false);};
  const counts={출석:0,결석:0,조퇴:0,공결:0,미입력:0};
  clsSts.forEach(s=>{const st=recs[s.id];st?counts[st]++:counts['미입력']++;});
  const cls=classes.find(c=>c.id===selCls);
  const sec=sections.find(s=>s.id===cls?.sectionId);

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-gray-900 text-lg">출석체크</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">날짜</label>
          <input type="date" value={selDate} onChange={e=>{setSelDate(e.target.value);setSaved(false);}} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#b8934a]"/>
        </div>
        <Sel label="반" value={selCls} onChange={v=>{setSelCls(v);setSaved(false);}} options={classes.map(c=>({value:c.id,label:c.name}))}/>
      </div>
      {sec&&<div className="text-xs text-gray-400">{sec.emoji} {sec.name} → {cls?.name}</div>}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        {['출석','결석','조퇴','공결'].map(k=>(
          <div key={k} className="rounded-xl p-2.5 border" style={{background:k==='출석'?'#f0fdf4':k==='결석'?'#fef2f2':k==='조퇴'?'#fefce8':'#eff6ff',borderColor:k==='출석'?'#bbf7d0':k==='결석'?'#fecaca':k==='조퇴'?'#fef08a':'#bfdbfe'}}>
            <p className="font-bold text-base">{counts[k]}</p>
            <p className="text-gray-500">{k}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-2"><button onClick={()=>setAll('출석')} className="flex-1 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">전원 출석</button><button onClick={()=>setAll('결석')} className="flex-1 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">전원 결석</button></div>
      <div className="space-y-2">
        {clsSts.map(s=>{
          const st=recs[s.id];
          return (
            <div key={s.id} onClick={()=>toggle(s.id)} className="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer select-none transition-all active:scale-[0.98]"
              style={{background:st?({출석:'#f0fdf4',결석:'#fef2f2',조퇴:'#fefce8',공결:'#eff6ff'}[st]):'white',borderColor:st?({출석:'#86efac',결석:'#fca5a5',조퇴:'#fde047',공결:'#93c5fd'}[st]):'#e5e7eb'}}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                style={{background:st?({출석:'#22c55e',결석:'#ef4444',조퇴:'#eab308',공결:'#3b82f6'}[st]):'#d1d5db'}}>{s.name[0]}</div>
              <div className="flex-1"><p className="font-medium text-sm">{s.name}</p><p className="text-xs text-gray-400">{s.grade}</p></div>
              <span className="text-sm font-bold" style={{color:st?({출석:'#16a34a',결석:'#dc2626',조퇴:'#ca8a04',공결:'#2563eb'}[st]):'#9ca3af'}}>{st||'탭하여 입력'}</span>
            </div>
          );
        })}
        {!clsSts.length&&<p className="text-center text-gray-400 py-8 text-sm">이 반에 학생이 없습니다.</p>}
      </div>
      {clsSts.length>0&&(
        <button onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);}}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${saved?'bg-green-500 text-white':'bg-[#1a1a1a] text-white hover:bg-[#333]'}`}>
          {saved?'✓ 저장 완료!':'💾 출석 저장'}
        </button>
      )}
    </div>
  );
};

const MPStudents=({students,setStudents,classes,sections,attendance})=>{
  const [search,setSearch]=useState('');
  const [fSec,setFSec]=useState('전체');
  const [showAdd,setShowAdd]=useState(false);
  const [editSt,setEditSt]=useState(null);
  const [detailSt,setDetailSt]=useState(null);

  const filtered=useMemo(()=>students.filter(s=>{
    const cls=classes.find(c=>c.id===s.classId);
    const sec=cls?sections.find(se=>se.id===cls.sectionId):null;
    return (fSec==='전체'||sec?.name===fSec)&&(!search||s.name.includes(search));
  }),[students,search,fSec,classes,sections]);

  const StForm=({initial,onSave,onClose})=>{
    const e={name:'',classId:classes[0]?.id||'',grade:'',phone:'',parentPhone:'',birthDate:'',registeredDate:todayStr(),memo:'',active:true};
    const [form,setForm]=useState(initial||e);
    const set=(k,v)=>setForm(f=>({...f,[k]:v}));
    return <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3"><Inp label="이름" value={form.name} onChange={v=>set('name',v)} required/><Sel label="반" value={form.classId} onChange={v=>set('classId',v)} options={classes.map(c=>({value:c.id,label:c.name}))}/></div>
      <div className="grid grid-cols-2 gap-3"><Inp label="학년" value={form.grade} onChange={v=>set('grade',v)}/><Inp label="생년월일" type="date" value={form.birthDate} onChange={v=>set('birthDate',v)}/></div>
      <Inp label="학생 연락처" value={form.phone} onChange={v=>set('phone',v)}/>
      <Inp label="부모님 연락처" value={form.parentPhone} onChange={v=>set('parentPhone',v)}/>
      <Inp label="등록일" type="date" value={form.registeredDate} onChange={v=>set('registeredDate',v)}/>
      <div className="flex flex-col gap-1"><label className="text-sm font-medium text-gray-700">메모</label><textarea value={form.memo} onChange={e=>set('memo',e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm h-16 resize-none outline-none focus:border-[#b8934a]"/></div>
      <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.active} onChange={e=>set('active',e.target.checked)} className="accent-[#b8934a]"/>재적 중</label>
      <div className="flex gap-2 pt-1"><button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">취소</button><button onClick={()=>{if(!form.name)return alert('이름 입력');onSave(form);onClose();}} className="flex-1 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm hover:bg-[#333]">저장</button></div>
    </div>;
  };

  const StDetail=({s})=>{
    const cls=classes.find(c=>c.id===s.classId);
    const sec=sections.find(se=>se.id===cls?.sectionId);
    const recs=Object.entries(attendance).filter(([,r])=>r[s.id]).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,10);
    const cnt={출석:0,결석:0,조퇴:0,공결:0};recs.forEach(([,r])=>{if(r[s.id])cnt[r[s.id]]++;});
    const rate=recs.length?Math.round(cnt['출석']/recs.length*100):0;
    return <div className="space-y-4">
      <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold" style={{background:'linear-gradient(135deg,#b8934a,#d4aa6e)'}}>{s.name[0]}</div>
      <div><div className="flex items-center gap-2"><h2 className="text-lg font-bold">{s.name}{isThisWeek(s.birthDate)&&' 🎂'}</h2>{!s.active&&<span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">제적</span>}</div><p className="text-sm text-gray-500">{sec?.name} · {cls?.name} · {s.grade}</p></div></div>
      <div className="grid grid-cols-2 gap-2 text-sm">{s.birthDate&&<div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">생년월일</p><p className="font-medium">{fmt(s.birthDate)} ({getAge(s.birthDate)})</p></div>}<div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">등록일</p><p className="font-medium">{fmt(s.registeredDate)}</p></div>{s.phone&&<div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">학생</p><p className="font-medium">{s.phone}</p></div>}{s.parentPhone&&<div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">부모님</p><p className="font-medium">{s.parentPhone}</p></div>}</div>
      {s.memo&&<div className="bg-amber-50 rounded-xl p-3 text-sm">📝 {s.memo}</div>}
      <div><h3 className="font-semibold text-gray-800 mb-2 text-sm">출석 ({recs.length}회)</h3>
      <div className="grid grid-cols-4 gap-2 text-center text-xs mb-2">{Object.entries(cnt).map(([k,v])=><div key={k} className="bg-gray-50 rounded-xl p-2"><p className="font-bold text-base">{v}</p><p className="text-gray-400">{k}</p></div>)}</div>
      <div className="flex items-center gap-2 mb-2"><span className="text-xs text-gray-500">출석률</span><div className="flex-1 h-2 bg-gray-100 rounded-full"><div className="h-full bg-[#b8934a] rounded-full" style={{width:`${rate}%`}}/></div><span className="text-xs font-bold text-[#b8934a]">{rate}%</span></div>
      <div className="space-y-1 max-h-32 overflow-y-auto">{recs.map(([date,r])=><div key={date} className="flex items-center justify-between text-xs py-1 border-b border-gray-50"><span className="text-gray-500">{fmt(date)}</span><span className="font-medium px-2 py-0.5 rounded-full" style={{background:({출석:'#dcfce7',결석:'#fee2e2',조퇴:'#fef9c3',공결:'#dbeafe'}[r[s.id]]),color:({출석:'#16a34a',결석:'#dc2626',조퇴:'#ca8a04',공결:'#2563eb'}[r[s.id]])}}>{r[s.id]}</span></div>)}</div></div>
      <div className="flex gap-2"><button onClick={()=>setDetailSt(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">닫기</button><button onClick={()=>{setEditSt(s);setDetailSt(null);}} className="flex-1 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm">수정</button></div>
    </div>;
  };

  const grouped=useMemo(()=>{
    const g={};
    filtered.forEach(s=>{const cls=classes.find(c=>c.id===s.classId);const key=cls?.name||'미배정';if(!g[key])g[key]=[];g[key].push(s);});
    return g;
  },[filtered,classes]);

  return <div className="space-y-4">
    <div className="flex items-center justify-between"><h2 className="font-bold text-gray-900 text-lg">교적부</h2><button onClick={()=>setShowAdd(true)} className="px-3 py-1.5 bg-[#1a1a1a] text-white rounded-xl text-sm font-medium hover:bg-[#333]">+ 학생 추가</button></div>
    <div className="flex gap-2 overflow-x-auto pb-1">
      {['전체',...sections.map(s=>s.name)].map(n=><button key={n} onClick={()=>setFSec(n)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${fSec===n?'bg-[#1a1a1a] text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{n}</button>)}
    </div>
    <div className="relative"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="이름 검색..." className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#b8934a]"/><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span></div>
    {Object.entries(grouped).map(([clsName,ss])=>(
      <div key={clsName}>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{clsName} <span className="font-normal text-gray-400">({ss.filter(s=>s.active).length}명)</span></p>
        <div className="space-y-2">
          {ss.map(s=>(
            <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm cursor-pointer transition-all" onClick={()=>setDetailSt(s)}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0" style={{background:s.active?'linear-gradient(135deg,#b8934a,#d4aa6e)':'#d1d5db'}}>{s.name[0]}</div>
              <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5"><span className="font-medium text-sm">{s.name}</span>{isThisWeek(s.birthDate)&&'🎂'}{!s.active&&<span className="text-xs bg-red-100 text-red-500 px-1.5 rounded-full">제적</span>}</div><p className="text-xs text-gray-400">{s.grade}{s.birthDate&&` · ${getBMMDD(s.birthDate)}`}</p></div>
              <div className="flex gap-1"><button onClick={e=>{e.stopPropagation();setEditSt(s);}} className="p-1.5 hover:bg-[#b8934a]/10 rounded-lg text-[#b8934a] text-sm">✏️</button><button onClick={e=>{e.stopPropagation();if(confirm('삭제?'))setStudents(p=>p.filter(x=>x.id!==s.id));}} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 text-sm">🗑</button></div>
            </div>
          ))}
        </div>
      </div>
    ))}
    {!filtered.length&&<p className="text-center text-gray-400 py-12 text-sm">검색 결과 없음</p>}
    {showAdd&&<Modal title="학생 추가" onClose={()=>setShowAdd(false)}><StForm onSave={f=>setStudents(p=>[...p,{...f,id:nextId(p)}])} onClose={()=>setShowAdd(false)}/></Modal>}
    {editSt&&<Modal title="학생 수정" onClose={()=>setEditSt(null)}><StForm initial={editSt} onSave={f=>setStudents(p=>p.map(s=>s.id===f.id?f:s))} onClose={()=>setEditSt(null)}/></Modal>}
    {detailSt&&<Modal title="학생 상세" onClose={()=>setDetailSt(null)} wide><StDetail s={detailSt}/></Modal>}
  </div>;
};

const MPStats=({students,classes,sections,attendance})=>{
  const active=students.filter(s=>s.active);
  const totR=Object.values(attendance).reduce((a,r)=>a+Object.values(r).length,0);
  const totP=Object.values(attendance).reduce((a,r)=>a+Object.values(r).filter(s=>s==='출석').length,0);
  const monthly=useMemo(()=>{
    const m=[];
    for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);const ym=d.toISOString().slice(0,7),lbl=`${d.getMonth()+1}월`;
    const recs=Object.entries(attendance).filter(([k])=>k.startsWith(ym));let t=0,p=0;
    recs.forEach(([,r])=>active.forEach(s=>{if(r[s.id]){t++;if(r[s.id]==='출석')p++;}}));
    m.push({lbl,rate:t?Math.round(p/t*100):0});}
    return m;
  },[students,attendance]);
  return <div className="space-y-4">
    <h2 className="font-bold text-gray-900 text-lg">통계</h2>
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-gray-50 rounded-2xl p-4 text-center"><p className="text-3xl font-bold text-[#b8934a]">{active.length}</p><p className="text-xs text-gray-500 mt-1">재적 인원</p></div>
      <div className="bg-gray-50 rounded-2xl p-4 text-center"><p className="text-3xl font-bold text-[#3d6b4f]">{totR?Math.round(totP/totR*100):0}%</p><p className="text-xs text-gray-500 mt-1">전체 출석률</p></div>
    </div>
    <div className="bg-gray-50 rounded-2xl p-4">
      <h3 className="font-semibold text-gray-800 mb-3 text-sm">월별 출석률</h3>
      <div className="flex items-end gap-1 h-28">
        {monthly.map(({lbl,rate})=><div key={lbl} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs font-bold text-[#b8934a]">{rate}%</span>
          <div className="w-full rounded-t-lg transition-all" style={{height:`${rate}%`,background:'linear-gradient(to top,#b8934a,#d4aa6e)',minHeight:rate?'4px':'0'}}/>
          <span className="text-xs text-gray-400">{lbl}</span>
        </div>)}
      </div>
    </div>
    <div className="bg-gray-50 rounded-2xl p-4">
      <h3 className="font-semibold text-gray-800 mb-3 text-sm">부서별 현황</h3>
      {sections.map(sec=>{
        const cIds=classes.filter(c=>c.sectionId===sec.id).map(c=>c.id);
        const ss=active.filter(s=>cIds.includes(s.classId));
        const recent=Object.entries(attendance).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,8);
        let t=0,p=0;recent.forEach(([,r])=>ss.forEach(s=>{if(r[s.id]){t++;if(r[s.id]==='출석')p++;}}));
        const rate=t?Math.round(p/t*100):0;
        return <div key={sec.id} className="mb-2"><div className="flex justify-between text-xs mb-1"><span className="font-medium">{sec.emoji} {sec.name} ({ss.length}명)</span><span className="font-bold text-[#b8934a]">{rate}%</span></div><div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-[#b8934a] transition-all" style={{width:`${rate}%`}}/></div></div>;
      })}
    </div>
  </div>;
};

const MPBirthday=({students,classes})=>{
  const active=students.filter(s=>s.active&&s.birthDate);
  const getCls=id=>classes.find(c=>c.id===id)?.name||'';
  const thisWeek=active.filter(s=>isThisWeek(s.birthDate)).sort((a,b)=>getDUB(a.birthDate)-getDUB(b.birthDate));
  const thisMonth=active.filter(s=>isThisMonth(s.birthDate)&&!isThisWeek(s.birthDate));
  const byMonth=Array.from({length:12},(_,i)=>({month:i+1,ss:active.filter(s=>parseInt(s.birthDate.split('-')[1])===i+1)})).filter(m=>m.ss.length);
  return <div className="space-y-4">
    <h2 className="font-bold text-gray-900 text-lg">🎂 생일</h2>
    {thisWeek.length>0&&<div><h3 className="text-sm font-semibold text-gray-700 mb-2">🎉 이번 주</h3><div className="space-y-2">{thisWeek.map(s=><div key={s.id} className="flex items-center gap-3 bg-pink-50 rounded-xl p-3 border border-pink-100"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 text-white flex items-center justify-center font-bold">{s.name[0]}</div><div className="flex-1"><p className="font-bold text-sm">{s.name} 🎂</p><p className="text-xs text-gray-500">{getCls(s.classId)} · {getBMMDD(s.birthDate)}</p></div><p className="font-bold text-pink-600">{getDUB(s.birthDate)===0?'오늘!🥳':`D-${getDUB(s.birthDate)}`}</p></div>)}</div></div>}
    {thisMonth.length>0&&<div><h3 className="text-sm font-semibold text-gray-700 mb-2">📅 이번 달</h3><div className="space-y-2">{thisMonth.map(s=><div key={s.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"><div className="w-8 h-8 rounded-lg bg-[#b8934a] text-white flex items-center justify-center font-bold text-sm">{s.name[0]}</div><div className="flex-1 text-sm"><span className="font-medium">{s.name}</span><span className="text-gray-400 ml-2">{getCls(s.classId)} · {getBMMDD(s.birthDate)}</span></div><span className="text-sm font-medium text-[#b8934a]">D-{getDUB(s.birthDate)}</span></div>)}</div></div>}
    <div><h3 className="text-sm font-semibold text-gray-700 mb-2">📆 월별</h3><div className="space-y-3">{byMonth.map(({month,ss})=><div key={month}><div className="flex items-center gap-2 mb-1"><div className="w-7 h-7 rounded-lg bg-[#1a1a1a] text-white text-xs font-bold flex items-center justify-center">{month}</div><span className="text-xs text-gray-500">{ss.length}명</span></div><div className="pl-9 space-y-1">{ss.map(s=><div key={s.id} className="flex items-center gap-2 text-xs py-1 border-b border-gray-50"><span className="font-medium text-gray-700">{s.name}</span><span className="text-gray-400">{getCls(s.classId)}</span><span className="ml-auto text-gray-500">{getBMMDD(s.birthDate)}</span></div>)}</div></div>)}</div></div>
  </div>;
};

const MPTeachers=({teachers,setTeachers,students,classes,sections})=>{
  const [showAdd,setShowAdd]=useState(false),[editT,setEditT]=useState(null);
  const TForm=({initial,onClose,onSave})=>{
    const [f,setF]=useState(initial||{name:'',classId:classes[0]?.id||'',phone:'',email:'',memo:''});
    const set=(k,v)=>setF(p=>({...p,[k]:v}));
    return <div className="space-y-3"><div className="grid grid-cols-2 gap-3"><Inp label="이름" value={f.name} onChange={v=>set('name',v)} required/><Sel label="담당 반" value={f.classId} onChange={v=>set('classId',v)} options={classes.map(c=>({value:c.id,label:c.name}))}/></div><Inp label="연락처" value={f.phone} onChange={v=>set('phone',v)}/><Inp label="이메일" type="email" value={f.email} onChange={v=>set('email',v)}/><Inp label="메모" value={f.memo} onChange={v=>set('memo',v)}/><div className="flex gap-2 pt-1"><button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">취소</button><button onClick={()=>{if(!f.name)return alert('이름 입력');onSave(f);onClose();}} className="flex-1 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm">저장</button></div></div>;
  };
  return <div className="space-y-4">
    <div className="flex items-center justify-between"><h2 className="font-bold text-gray-900 text-lg">선생님</h2><button onClick={()=>setShowAdd(true)} className="px-3 py-1.5 bg-[#1a1a1a] text-white rounded-xl text-sm">+ 추가</button></div>
    {sections.map(sec=>{
      const secCls=classes.filter(c=>c.sectionId===sec.id);
      return <div key={sec.id}><div className="text-xs font-bold tracking-wider text-gray-400 uppercase mb-2">{sec.emoji} {sec.name}</div>
        {secCls.map(cls=>{const ts=teachers.filter(t=>t.classId===cls.id),ss=students.filter(s=>s.classId===cls.id&&s.active);return <div key={cls.id} className="bg-gray-50 rounded-xl p-3 mb-2 border border-gray-100"><div className="flex justify-between mb-2"><span className="font-semibold text-sm">{cls.name}</span><span className="text-xs text-gray-400">학생 {ss.length}명</span></div>{ts.length===0?<p className="text-xs text-gray-400">담당 선생님 없음</p>:ts.map(t=><div key={t.id} className="flex items-center gap-3 bg-white rounded-lg p-2.5 mb-1"><div className="w-8 h-8 rounded-lg bg-[#b8934a] text-white flex items-center justify-center font-bold text-sm">{t.name[0]}</div><div className="flex-1"><p className="font-medium text-sm">{t.name}</p><p className="text-xs text-gray-400">{t.phone}</p></div><div className="flex gap-1"><button onClick={()=>setEditT(t)} className="p-1 text-[#b8934a] hover:bg-[#b8934a]/10 rounded text-sm">✏️</button><button onClick={()=>{if(confirm('삭제?'))setTeachers(p=>p.filter(x=>x.id!==t.id));}} className="p-1 text-red-400 hover:bg-red-50 rounded text-sm">🗑</button></div></div>)}</div>;})}
      </div>;
    })}
    {showAdd&&<Modal title="선생님 추가" onClose={()=>setShowAdd(false)}><TForm onSave={f=>setTeachers(p=>[...p,{...f,id:nextId(p)}])} onClose={()=>setShowAdd(false)}/></Modal>}
    {editT&&<Modal title="선생님 수정" onClose={()=>setEditT(null)}><TForm initial={editT} onSave={f=>setTeachers(p=>p.map(t=>t.id===f.id?f:t))} onClose={()=>setEditT(null)}/></Modal>}
  </div>;
};

const MPMeetings=({meetings,setMeetings})=>{
  const [showAdd,setShowAdd]=useState(false),[detail,setDetail]=useState(null);
  const CATS=['회의록','공지','교육자료','기타'];
  const sorted=[...meetings].sort((a,b)=>b.date.localeCompare(a.date));
  const DocForm=({onSave,onClose})=>{
    const [f,setF]=useState({title:'',date:todayStr(),uploader:'',category:'회의록',content:''});
    const set=(k,v)=>setF(p=>({...p,[k]:v}));
    return <div className="space-y-3"><Inp label="제목" value={f.title} onChange={v=>set('title',v)} required/><div className="grid grid-cols-2 gap-3"><Inp label="날짜" type="date" value={f.date} onChange={v=>set('date',v)}/><Sel label="카테고리" value={f.category} onChange={v=>set('category',v)} options={CATS}/></div><Inp label="작성자" value={f.uploader} onChange={v=>set('uploader',v)}/><div className="flex flex-col gap-1"><label className="text-sm font-medium text-gray-700">내용</label><textarea value={f.content} onChange={e=>set('content',e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm h-24 resize-none outline-none focus:border-[#b8934a]"/></div><div className="flex gap-2 pt-1"><button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">취소</button><button onClick={()=>{if(!f.title)return alert('제목 입력');onSave(f);onClose();}} className="flex-1 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm">저장</button></div></div>;
  };
  const download=m=>{const b=new Blob([`${m.title}\n${m.date}\n${m.uploader}\n\n${m.content}`],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`${m.title}.txt`;a.click();};
  return <div className="space-y-4">
    <div className="flex items-center justify-between"><h2 className="font-bold text-gray-900 text-lg">회의자료</h2><button onClick={()=>setShowAdd(true)} className="px-3 py-1.5 bg-[#1a1a1a] text-white rounded-xl text-sm">+ 자료 추가</button></div>
    <div className="space-y-2">{sorted.map(m=><div key={m.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100 hover:shadow-sm transition-all"><div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-lg shadow-sm flex-shrink-0">📄</div><div className="flex-1 min-w-0 cursor-pointer" onClick={()=>setDetail(m)}><p className="font-medium text-sm">{m.title}</p><p className="text-xs text-gray-400">{fmt(m.date)} · {m.uploader}</p></div><div className="flex items-center gap-1 flex-shrink-0"><span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">{m.category}</span><button onClick={()=>download(m)} className="p-1.5 text-[#b8934a] hover:bg-[#b8934a]/10 rounded text-sm">⬇</button><button onClick={()=>{if(confirm('삭제?'))setMeetings(p=>p.filter(x=>x.id!==m.id));}} className="p-1.5 text-red-400 hover:bg-red-50 rounded text-sm">🗑</button></div></div>)}</div>
    {showAdd&&<Modal title="자료 추가" onClose={()=>setShowAdd(false)} wide><DocForm onSave={m=>setMeetings(p=>[...p,{...m,id:nextId(p)}])} onClose={()=>setShowAdd(false)}/></Modal>}
    {detail&&<Modal title={detail.title} onClose={()=>setDetail(null)} wide><div className="space-y-3"><div className="flex gap-2 text-xs"><span className="text-gray-500">{fmt(detail.date)}</span><span className="text-gray-300">·</span><span className="text-gray-500">{detail.uploader}</span><span className="bg-gray-100 text-gray-600 rounded-full px-2">{detail.category}</span></div><div className="bg-gray-50 rounded-xl p-4 text-sm whitespace-pre-wrap min-h-20">{detail.content}</div><div className="flex gap-2"><button onClick={()=>setDetail(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">닫기</button><button onClick={()=>download(detail)} className="flex-1 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm">⬇ 다운로드</button></div></div></Modal>}
  </div>;
};

const MPPhotos=({photos,setPhotos,sections})=>{
  const [showAdd,setShowAdd]=useState(false),[selSec,setSelSec]=useState('all'),[lb,setLb]=useState(null);
  const EMOJIS=['🌸','🌿','⛅','🌟','🙏','❤️','✝️','🎉'];
  const filtered=photos.filter(p=>selSec==='all'||p.sectionId===selSec||p.sectionId==='all');
  const byAlbum={};filtered.forEach(p=>{if(!byAlbum[p.album])byAlbum[p.album]=[];byAlbum[p.album].push(p);});
  const AddForm=({onSave,onClose})=>{
    const [f,setF]=useState({album:'',sectionId:'all',date:todayStr(),caption:''}),[img,setImg]=useState('');
    const set=(k,v)=>setF(p=>({...p,[k]:v}));
    const hf=e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>setImg(ev.target.result);r.readAsDataURL(file);};
    return <div className="space-y-3"><Inp label="앨범명" value={f.album} onChange={v=>set('album',v)} required/><Sel label="부서" value={f.sectionId} onChange={v=>set('sectionId',v)} options={[{value:'all',label:'전체(공통)'},...sections.map(s=>({value:s.id,label:`${s.emoji} ${s.name}`}))]}/><div className="grid grid-cols-2 gap-3"><Inp label="날짜" type="date" value={f.date} onChange={v=>set('date',v)}/><Inp label="설명" value={f.caption} onChange={v=>set('caption',v)}/></div><div><label className="text-sm font-medium text-gray-700 block mb-1">사진</label><input type="file" accept="image/*" onChange={hf} className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-gray-100 file:text-gray-700"/></div>{img&&<img src={img} alt="" className="w-full h-36 object-cover rounded-xl"/>}<div className="flex gap-2 pt-1"><button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">취소</button><button onClick={()=>{if(!f.album)return alert('앨범명 입력');onSave({...f,src:img});onClose();}} className="flex-1 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm">저장</button></div></div>;
  };
  return <div className="space-y-4">
    <div className="flex items-center justify-between"><h2 className="font-bold text-gray-900 text-lg">사진 앨범</h2><button onClick={()=>setShowAdd(true)} className="px-3 py-1.5 bg-[#1a1a1a] text-white rounded-xl text-sm">+ 추가</button></div>
    <div className="flex gap-2 overflow-x-auto pb-1"><button onClick={()=>setSelSec('all')} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${selSec==='all'?'bg-[#1a1a1a] text-white':'bg-gray-100 text-gray-600'}`}>전체</button>{sections.map(s=><button key={s.id} onClick={()=>setSelSec(s.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${selSec===s.id?'bg-[#1a1a1a] text-white':'bg-gray-100 text-gray-600'}`}>{s.emoji} {s.name}</button>)}</div>
    {Object.entries(byAlbum).map(([album,ps])=><div key={album}><p className="text-sm font-semibold text-gray-700 mb-2">{album} <span className="text-gray-400 font-normal">({ps.length}장)</span></p><div className="grid grid-cols-3 gap-2">{ps.map((p,i)=><div key={p.id} onClick={()=>setLb(p)} className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">{p.src?<img src={p.src} alt="" className="w-full h-full object-cover"/>:<span className="text-3xl">{EMOJIS[i%EMOJIS.length]}</span>}</div>)}</div></div>)}
    {!filtered.length&&<p className="text-center text-gray-400 py-8 text-sm">사진 없음</p>}
    {showAdd&&<Modal title="사진 추가" onClose={()=>setShowAdd(false)}><AddForm onSave={p=>setPhotos(pv=>[...pv,{...p,id:nextId(pv)}])} onClose={()=>setShowAdd(false)}/></Modal>}
    {lb&&<div className="fixed inset-0 bg-black/80 z-[300] flex flex-col items-center justify-center p-4" onClick={()=>setLb(null)}><button className="absolute top-4 right-4 text-white text-2xl">✕</button>{lb.src?<img src={lb.src} alt="" className="max-w-full max-h-[70vh] rounded-xl object-contain"/>:<div className="w-48 h-48 bg-gray-800 rounded-xl flex items-center justify-center text-5xl">🖼️</div>}{lb.caption&&<p className="text-white mt-3 text-sm">{lb.caption}</p>}</div>}
  </div>;
};

const MPPrayers=({prayers,setPrayers})=>{
  const [showAdd,setShowAdd]=useState(false),[detail,setDetail]=useState(null);
  const toggle=id=>setPrayers(p=>p.map(x=>x.id===id?{...x,answered:!x.answered}:x));
  const active=prayers.filter(p=>!p.answered).sort((a,b)=>b.date.localeCompare(a.date));
  const answered=prayers.filter(p=>p.answered);
  const PForm=({onSave,onClose})=>{
    const [f,setF]=useState({title:'',content:'',author:'',date:todayStr(),answered:false});
    const set=(k,v)=>setF(p=>({...p,[k]:v}));
    return <div className="space-y-3"><Inp label="제목" value={f.title} onChange={v=>set('title',v)} required/><div className="grid grid-cols-2 gap-3"><Inp label="올린이" value={f.author} onChange={v=>set('author',v)}/><Inp label="날짜" type="date" value={f.date} onChange={v=>set('date',v)}/></div><div className="flex flex-col gap-1"><label className="text-sm font-medium text-gray-700">내용 *</label><textarea value={f.content} onChange={e=>set('content',e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm h-24 resize-none outline-none focus:border-[#b8934a]"/></div><div className="flex gap-2 pt-1"><button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">취소</button><button onClick={()=>{if(!f.title||!f.content)return alert('제목과 내용 입력');onSave(f);onClose();}} className="flex-1 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm">등록</button></div></div>;
  };
  return <div className="space-y-4">
    <div className="flex items-center justify-between"><h2 className="font-bold text-gray-900 text-lg">🙏 기도제목</h2><button onClick={()=>setShowAdd(true)} className="px-3 py-1.5 bg-[#1a1a1a] text-white rounded-xl text-sm">+ 등록</button></div>
    <div className="space-y-2">{active.map(p=><div key={p.id} className="bg-gray-50 rounded-xl border border-gray-100"><div className="flex gap-3 p-3 cursor-pointer" onClick={()=>setDetail(p)}><div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center text-rose-500 flex-shrink-0">🙏</div><div className="flex-1 min-w-0"><p className="font-semibold text-sm">{p.title}</p><p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{p.content}</p><p className="text-xs text-gray-400 mt-1">{p.author} · {fmt(p.date)}</p></div></div><div className="flex gap-2 px-3 pb-3"><button onClick={()=>toggle(p.id)} className="flex-1 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">응답됨 ✓</button><button onClick={()=>{if(confirm('삭제?'))setPrayers(pr=>pr.filter(x=>x.id!==p.id));}} className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs hover:bg-red-100">삭제</button></div></div>)}</div>
    {!active.length&&<p className="text-center text-gray-400 py-6 text-sm">등록된 기도제목이 없습니다.</p>}
    {answered.length>0&&<div><p className="text-xs font-semibold text-gray-500 mb-2">응답됨 ({answered.length})</p>{answered.map(p=><div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-1 opacity-60"><span className="text-lg">✨</span><div className="flex-1"><p className="text-sm font-medium line-through text-gray-500">{p.title}</p><p className="text-xs text-gray-400">{p.author}</p></div><button onClick={()=>toggle(p.id)} className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-1 rounded-lg">되돌리기</button></div>)}</div>}
    {showAdd&&<Modal title="기도제목 등록" onClose={()=>setShowAdd(false)} wide><PForm onSave={p=>setPrayers(pr=>[...pr,{...p,id:nextId(pr)}])} onClose={()=>setShowAdd(false)}/></Modal>}
    {detail&&<Modal title="기도제목" onClose={()=>setDetail(null)} wide><div className="space-y-3"><h2 className="font-bold text-gray-900">{detail.title}</h2><p className="text-sm text-gray-400">{detail.author} · {fmt(detail.date)}</p><div className="bg-rose-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap">{detail.content}</div><button onClick={()=>setDetail(null)} className="w-full py-2.5 border border-gray-200 rounded-xl text-sm">닫기</button></div></Modal>}
  </div>;
};

const MPAdmin=({site,setSite,sections,setSections,classes,setClasses,teachers,students})=>{
  const [tab,setTab]=useState('site');
  const [authed,setAuthed]=useState(false),[pin,setPin]=useState('');
  const SECGR={rose:'linear-gradient(135deg,#7c2d2d,#4a1a1a)',amber:'linear-gradient(135deg,#7c5a1a,#4a2e08)',teal:'linear-gradient(135deg,#1a4a3a,#0f2e24)',indigo:'linear-gradient(135deg,#1a1a4a,#0f0f2e)'};
  const COLS=[{value:'rose',label:'빨강'},{value:'amber',label:'황금'},{value:'teal',label:'초록'},{value:'indigo',label:'남색'},{value:'purple',label:'보라'}];
  const EMJS=['🌸','🌟','📖','✝','🙏','❤️','🎵','⚽','🌈','🕊️'];

  if(!authed)return <div className="flex flex-col items-center justify-center min-h-[50vh] gap-5">
    <div className="text-center"><div className="text-5xl mb-3">⚙️</div><h2 className="text-lg font-bold text-gray-900">관리자 영역</h2><p className="text-sm text-gray-400 mt-1">PIN 입력 (기본: 1234)</p></div>
    <div className="space-y-3 w-full max-w-xs"><input type="password" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(pin===site.adminPin?setAuthed(true):alert('틀렸습니다'))} className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-center text-2xl tracking-widest outline-none focus:border-[#b8934a]" placeholder="••••"/>
    <button onClick={()=>pin===site.adminPin?setAuthed(true):alert('PIN이 틀렸습니다')} className="w-full py-3 rounded-xl bg-[#1a1a1a] text-white font-semibold">입장</button></div>
  </div>;

  const TABS=[{id:'site',l:'홈 설정'},{id:'bg',l:'배경'},{id:'sections',l:'섹션/반'},{id:'google',l:'Google 로그인'},{id:'pin',l:'보안'}];
  return <div className="space-y-4">
    <div className="flex items-center justify-between"><h2 className="font-bold text-gray-900 text-lg">⚙️ 관리자</h2><button onClick={()=>setAuthed(false)} className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-1 rounded-lg">로그아웃</button></div>
    <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1 overflow-x-auto">
      {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${tab===t.id?'bg-white text-gray-900 shadow-sm':'text-gray-500'}`}>{t.l}</button>)}
    </div>

    {tab==='site'&&<div className="space-y-4 bg-gray-50 rounded-2xl p-4">
      <Inp label="교회/학교 이름" value={site.churchName} onChange={v=>setSite(p=>({...p,churchName:v}))}/>
      <Inp label="서브타이틀" value={site.subtitle} onChange={v=>setSite(p=>({...p,subtitle:v}))}/>
      <Inp label="히어로 성경 구절" value={site.heroVerse} onChange={v=>setSite(p=>({...p,heroVerse:v}))}/>
      <Inp label="성경 구절 출처" value={site.heroVerseRef} onChange={v=>setSite(p=>({...p,heroVerseRef:v}))}/>
      <div className="flex flex-col gap-1"><label className="text-sm font-medium text-gray-700">공지사항</label><textarea value={site.announcement} onChange={e=>setSite(p=>({...p,announcement:e.target.value}))} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm h-20 resize-none outline-none focus:border-[#b8934a]" placeholder="공지 없으면 비워두세요"/></div>
      <div className="border-t border-gray-200 pt-4 space-y-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">히어로 텍스트 설정</p>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">글씨 색상</label>
          <div className="flex items-center gap-2 flex-1">
            <input type="color" value={site.heroTextColor||'#ffffff'} onChange={e=>setSite(p=>({...p,heroTextColor:e.target.value}))} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"/>
            <div className="flex gap-1.5 flex-wrap">
              {['#ffffff','#1a1a1a','#b8934a','#3d6b4f','#2563eb','#dc2626','#fbbf24'].map(c=>(
                <button key={c} onClick={()=>setSite(p=>({...p,heroTextColor:c}))} className="w-7 h-7 rounded-lg border-2 transition-all" style={{background:c,borderColor:(site.heroTextColor||'#ffffff')===c?'#b8934a':'#e5e7eb'}}/>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">배경 밝기</label>
          <div className="flex-1 flex items-center gap-3">
            <span className="text-xs text-gray-400">밝게</span>
            <input type="range" min="0" max="80" step="5" value={site.heroOverlay??30} onChange={e=>setSite(p=>({...p,heroOverlay:Number(e.target.value)}))} className="flex-1 accent-[#b8934a]"/>
            <span className="text-xs text-gray-400">어둡게</span>
            <span className="text-xs font-bold text-[#b8934a] w-8 text-right">{site.heroOverlay??30}%</span>
          </div>
        </div>
      </div>
    </div>}

    {tab==='bg'&&<BgSettings site={site} setSite={setSite}/>}

    {tab==='sections'&&<div className="space-y-4">
      <div className="flex justify-end"><button onClick={()=>{const name=prompt('새 섹션 이름:');if(name)setSections(p=>[...p,{id:'s'+Date.now(),name,color:'teal',emoji:'✝',gradient:'135deg,#1a4a3a,#0f2e24',desc:''}]);}} className="px-3 py-1.5 bg-[#1a1a1a] text-white rounded-xl text-sm">+ 섹션 추가</button></div>
      {sections.map(sec=>(
        <div key={sec.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
          <div className="h-12 rounded-xl flex items-center gap-3 px-3" style={{background:`linear-gradient(${sec.gradient})`}}><span className="text-xl">{sec.emoji}</span><span className="font-bold text-white">{sec.name}</span></div>
          <div className="grid grid-cols-2 gap-2">
            <Inp label="이름" value={sec.name} onChange={v=>setSections(p=>p.map(s=>s.id===sec.id?{...s,name:v}:s))}/>
            <Inp label="설명" value={sec.desc||''} onChange={v=>setSections(p=>p.map(s=>s.id===sec.id?{...s,desc:v}:s))}/>
          </div>
          <div className="flex flex-col gap-1"><label className="text-xs font-medium text-gray-600">색상</label><div className="flex gap-1">{COLS.map(c=><button key={c.value} onClick={()=>setSections(p=>p.map(s=>s.id===sec.id?{...s,color:c.value}:s))} className={`px-2 py-1 rounded-lg text-xs border-2 transition-all ${sec.color===c.value?'border-[#b8934a] bg-[#b8934a]/10':'border-gray-200'}`}>{c.label}</button>)}</div></div>
          <div className="flex flex-col gap-1"><label className="text-xs font-medium text-gray-600">이모지</label><div className="flex gap-1 flex-wrap">{EMJS.map(e=><button key={e} onClick={()=>setSections(p=>p.map(s=>s.id===sec.id?{...s,emoji:e}:s))} className={`w-8 h-8 rounded-lg border-2 text-base transition-all ${sec.emoji===e?'border-[#b8934a] bg-[#b8934a]/10':'border-gray-200'}`}>{e}</button>)}</div></div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-gray-500">반 목록</span><button onClick={()=>{const n=prompt('반 이름:');if(n)setClasses(p=>[...p,{id:'c'+Date.now(),name:n,sectionId:sec.id}]);}} className="text-xs text-[#b8934a] font-medium">+ 반 추가</button></div>
            {classes.filter(c=>c.sectionId===sec.id).map(cls=>{const sc=students.filter(s=>s.classId===cls.id&&s.active).length;return <div key={cls.id} className="flex items-center gap-2 py-1.5 border-b border-gray-100"><span className="flex-1 text-sm font-medium">{cls.name} <span className="text-xs text-gray-400">({sc}명)</span></span><button onClick={()=>{const n=prompt('반 이름 변경:',cls.name);if(n)setClasses(p=>p.map(c=>c.id===cls.id?{...c,name:n}:c));}} className="text-xs text-[#b8934a] hover:underline">수정</button><button onClick={()=>{if(sc>0)return alert('학생이 있어 삭제 불가');if(confirm('삭제?'))setClasses(p=>p.filter(c=>c.id!==cls.id));}} className="text-xs text-red-400 hover:underline">삭제</button></div>;})}
          </div>
          <button onClick={()=>{if(classes.some(c=>c.sectionId===sec.id))return alert('반이 있어 삭제 불가');if(confirm(`"${sec.name}" 섹션 삭제?`))setSections(p=>p.filter(s=>s.id!==sec.id));}} className="w-full py-2 text-xs text-red-400 hover:text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition-all">섹션 삭제</button>
        </div>
      ))}
    </div>}

    {tab==='google'&&<div className="space-y-4 bg-gray-50 rounded-2xl p-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
        <p className="font-semibold">📋 Google 로그인 설정</p>
        <ol className="list-decimal list-inside space-y-0.5"><li>Google Cloud Console → OAuth 2.0 클라이언트 ID 생성</li><li>유형: 웹 애플리케이션</li><li>승인된 원본: <code className="bg-blue-100 px-1 rounded">http://localhost:8000</code></li><li>아래에 Client ID 입력</li></ol>
        <p className="text-blue-500">※ 로컬 파일(file://)에서는 작동 안 함. <code>python -m http.server 8000</code> 후 접속 필요</p>
      </div>
      <Inp label="Google Client ID" value={site.googleClientId||''} onChange={v=>setSite(p=>({...p,googleClientId:v}))} placeholder="123456789-abc...apps.googleusercontent.com"/>
      {site.googleClientId&&<p className="text-xs text-green-600 font-medium">✓ 설정됨 — 로그인 필요</p>}
      <div className="flex flex-col gap-1"><label className="text-xs font-medium text-gray-600">허용 이메일 (없으면 전체 허용)</label>
        <AllowedEmails site={site} setSite={setSite}/>
      </div>
    </div>}

    {tab==='pin'&&<div className="bg-gray-50 rounded-2xl p-4"><PinChg site={site} setSite={setSite}/></div>}
  </div>;
};

const BgSettings=({site,setSite})=>{
  const cur=site.heroBgGradient||'sky';
  const curType=site.heroBgType||'gradient';
  const hf=e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>{setSite(p=>({...p,heroBgImage:ev.target.result,heroBgType:'image'}));};r.readAsDataURL(file);};
  return (
    <div className="space-y-4">
      <div className="h-28 rounded-2xl overflow-hidden relative" style={{
        background: curType==='image'&&site.heroBgImage
          ? 'url('+site.heroBgImage+') center/cover no-repeat'
          : (HERO_PRESETS.find(p=>p.key===cur)||HERO_PRESETS[0]).css,
      }}>
        <div className="absolute inset-0" style={{background:'linear-gradient(to bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.5))'}}/>
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm drop-shadow">미리보기</div>
      </div>

      <div className="flex gap-2">
        <button onClick={()=>setSite(p=>({...p,heroBgType:'gradient'}))}
          className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${curType==='gradient'?'border-[#b8934a] bg-[#b8934a]/10 text-[#b8934a]':'border-gray-200 text-gray-500'}`}>
          그라디언트
        </button>
        <button onClick={()=>setSite(p=>({...p,heroBgType:'image'}))}
          className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-all ${curType==='image'?'border-[#b8934a] bg-[#b8934a]/10 text-[#b8934a]':'border-gray-200 text-gray-500'}`}>
          사진 업로드
        </button>
      </div>

      {curType==='gradient'&&(
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">색상 테마 선택</p>
          <div className="grid grid-cols-2 gap-2">
            {HERO_PRESETS.map(preset=>(
              <button key={preset.key} onClick={()=>setSite(p=>({...p,heroBgGradient:preset.key,heroBgType:'gradient'}))}
                className={`rounded-xl overflow-hidden border-2 transition-all ${cur===preset.key?'border-[#b8934a] scale-[1.02]':'border-transparent hover:border-gray-300'}`}>
                <div className="h-10" style={{background:preset.css}}/>
                <div className={`px-2 py-1.5 text-xs font-medium text-center ${cur===preset.key?'bg-[#b8934a]/10 text-[#b8934a]':'bg-gray-50 text-gray-600'}`}>{preset.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {curType==='image'&&(
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-2">배경 사진 업로드</label>
            <input type="file" accept="image/*" onChange={hf} className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-gray-100 file:text-gray-700 file:font-medium"/>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP 권장. 가로형 이미지가 잘 어울려요.</p>
          </div>
          {site.heroBgImage&&(
            <button onClick={()=>setSite(p=>({...p,heroBgImage:'',heroBgType:'gradient'}))}
              className="w-full py-2 text-xs text-red-400 border border-red-100 rounded-xl hover:bg-red-50">
              사진 제거 (그라디언트로 되돌리기)
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const AllowedEmails=({site,setSite})=>{
  const [input,setInput]=React.useState('');
  const list=site.allowedEmails||[];
  const add=()=>{
    const v=input.trim().toLowerCase();
    if(!v.includes('@'))return alert('올바른 이메일 형식이 아닙니다.');
    if(list.includes(v))return alert('이미 추가된 이메일입니다.');
    setSite(p=>({...p,allowedEmails:[...list,v]}));
    setInput('');
  };
  const remove=email=>setSite(p=>({...p,allowedEmails:list.filter(e=>e!==email)}));
  return(
    <div className="space-y-3">
      <p className="text-xs text-gray-500">허용된 이메일만 교사로 로그인할 수 있습니다. 비워두면 누구나 가입 가능합니다.</p>
      <div className="flex gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}
          placeholder="teacher@gmail.com" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#b8934a]"/>
        <button onClick={add} className="px-4 py-2 bg-[#3d6b4f] text-white rounded-xl text-sm font-medium hover:bg-[#2d5240]">추가</button>
      </div>
      {list.length>0&&(
        <div className="space-y-1.5">
          {list.map(email=>(
            <div key={email} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
              <span className="text-sm text-gray-700">{email}</span>
              <button onClick={()=>remove(email)} className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded-lg hover:bg-red-50">삭제</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PinChg=({site,setSite})=>{
  const [form,setForm]=React.useState({cur:'',next:'',next2:''});
  const [msg,setMsg]=React.useState('');
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const save=()=>{
    if(form.cur!==site.adminPin){setMsg('현재 PIN이 틀렸습니다.');return;}
    if(form.next.length<4){setMsg('새 PIN은 4자리 이상이어야 합니다.');return;}
    if(form.next!==form.next2){setMsg('새 PIN이 일치하지 않습니다.');return;}
    setSite(p=>({...p,adminPin:form.next}));
    setForm({cur:'',next:'',next2:''});
    setMsg('✅ PIN이 변경되었습니다.');
    setTimeout(()=>setMsg(''),3000);
  };
  return(
    <div className="space-y-3">
      {['cur','next','next2'].map((k,i)=>(
        <div key={k}>
          <label className="text-xs font-medium text-gray-600 block mb-1">{['현재 PIN','새 PIN','새 PIN 확인'][i]}</label>
          <input type="password" value={form[k]} onChange={e=>set(k,e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#b8934a]" placeholder="••••"/>
        </div>
      ))}
      {msg&&<p className={`text-xs px-3 py-2 rounded-xl ${msg.startsWith('✅')?'text-green-600 bg-green-50':'text-red-500 bg-red-50'}`}>{msg}</p>}
      <button onClick={save} className="w-full py-2.5 bg-[#3d6b4f] text-white rounded-xl text-sm font-semibold hover:bg-[#2d5240]">PIN 변경</button>
    </div>
  );
};
