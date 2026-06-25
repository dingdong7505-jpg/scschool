
// ── 교적부 ───────────────────────────────────────────────
const StudentsPage = ({ students, setStudents, classes, sections, attendance }) => {
  const [search, setSearch] = useState('');
  const [filterSec, setFilterSec] = useState('전체');
  const [filterCls, setFilterCls] = useState('전체');
  const [showAdd, setShowAdd] = useState(false);
  const [editSt, setEditSt] = useState(null);
  const [detailSt, setDetailSt] = useState(null);

  const filteredClasses = filterSec==='전체' ? classes : classes.filter(c=>{
    const sec = sections.find(s=>s.id===c.sectionId);
    return sec?.name===filterSec;
  });

  const filtered = useMemo(()=>students.filter(s=>{
    const cls = classes.find(c=>c.id===s.classId);
    const sec = cls ? sections.find(se=>se.id===cls.sectionId) : null;
    const matchSec = filterSec==='전체'||sec?.name===filterSec;
    const matchCls = filterCls==='전체'||cls?.name===filterCls;
    const matchQ = !search||s.name.includes(search)||(cls?.name||'').includes(search);
    return matchSec&&matchCls&&matchQ;
  }),[students,search,filterSec,filterCls,classes,sections]);

  const StudentForm = ({ initial, onSave, onClose }) => {
    const empty = { name:'', classId:classes[0]?.id||'', grade:'', phone:'', parentPhone:'', birthDate:'', registeredDate:todayStr(), memo:'', active:true };
    const [form, setForm] = useState(initial||empty);
    const set = (k,v) => setForm(f=>({...f,[k]:v}));
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Inp label="이름" value={form.name} onChange={v=>set('name',v)} required/>
          <Sel label="반" value={form.classId} onChange={v=>set('classId',v)} options={classes.map(c=>({value:c.id,label:c.name}))}/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Inp label="학년" value={form.grade} onChange={v=>set('grade',v)} placeholder="2학년"/>
          <Inp label="생년월일" type="date" value={form.birthDate} onChange={v=>set('birthDate',v)}/>
        </div>
        <Inp label="학생 연락처" value={form.phone} onChange={v=>set('phone',v)} placeholder="010-0000-0000"/>
        <Inp label="부모님 연락처" value={form.parentPhone} onChange={v=>set('parentPhone',v)} placeholder="010-0000-0000"/>
        <Inp label="등록일" type="date" value={form.registeredDate} onChange={v=>set('registeredDate',v)}/>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">메모</label>
          <textarea value={form.memo} onChange={e=>set('memo',e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm h-20 resize-none outline-none focus:border-sky-400"/>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={form.active} onChange={e=>set('active',e.target.checked)} className="accent-sky-500"/>재적 중
        </label>
        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose} variant="secondary" cls="flex-1">취소</Btn>
          <Btn onClick={()=>{if(!form.name.trim())return alert('이름을 입력하세요.');onSave(form);onClose();}} cls="flex-1">저장</Btn>
        </div>
      </div>
    );
  };

  const StudentDetail = ({ student }) => {
    const cls = classes.find(c=>c.id===student.classId);
    const sec = sections.find(s=>s.id===cls?.sectionId);
    const records = Object.entries(attendance).filter(([,r])=>r[student.id]).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,12);
    const counts = {출석:0,결석:0,조퇴:0,공결:0};
    records.forEach(([,r])=>{if(r[student.id])counts[r[student.id]]++;});
    const total=records.length, rate=total?Math.round(counts['출석']/total*100):0;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">{student.name[0]}</div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-800">{student.name}</h2>
              {isThisWeek(student.birthDate)&&<span>🎂</span>}
              {!student.active&&<Badge text="제적" color="red"/>}
            </div>
            <p className="text-sm text-gray-500">{sec?.name} · {cls?.name} · {student.grade}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {student.birthDate&&<div className="bg-sky-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">생년월일</p><p className="font-medium">{fmt(student.birthDate)} ({getAge(student.birthDate)})</p></div>}
          <div className="bg-sky-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">등록일</p><p className="font-medium">{fmt(student.registeredDate)}</p></div>
          {student.phone&&<div className="bg-sky-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">학생 연락처</p><p className="font-medium">{student.phone}</p></div>}
          {student.parentPhone&&<div className="bg-sky-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">부모님 연락처</p><p className="font-medium">{student.parentPhone}</p></div>}
        </div>
        {student.memo&&<div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-800">📝 {student.memo}</div>}
        <div>
          <h3 className="font-bold text-gray-700 mb-2">출석 현황 (최근 {total}회)</h3>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {Object.entries(counts).map(([k,v])=>(
              <div key={k} className="text-center bg-gray-50 rounded-xl p-2"><p className="text-lg font-bold">{v}</p><p className="text-xs text-gray-500">{k}</p></div>
            ))}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-600">출석률</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full"><div className="h-full bg-sky-400 rounded-full" style={{width:`${rate}%`}}/></div>
            <span className="text-sm font-bold text-sky-600">{rate}%</span>
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-hide">
            {records.map(([date,recs])=>(
              <div key={date} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50">
                <span className="text-gray-600">{fmt(date)}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full status-${recs[student.id]}`}>{recs[student.id]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Btn onClick={()=>setDetailSt(null)} variant="secondary" cls="flex-1">닫기</Btn>
          <Btn onClick={()=>{setEditSt(student);setDetailSt(null);}} cls="flex-1"><Icon name="edit" size={14}/>수정</Btn>
        </div>
      </div>
    );
  };

  const groupedByClass = filteredClasses.filter(c=>filterCls==='전체'||c.name===filterCls).map(cls=>({
    cls, students: filtered.filter(s=>s.classId===cls.id)
  })).filter(g=>g.students.length>0);

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-gray-800">교적부</h1><p className="text-sm text-gray-500">재적 {students.filter(s=>s.active).length}명</p></div>
        <Btn onClick={()=>setShowAdd(true)}><Icon name="plus" size={16}/>학생 추가</Btn>
      </div>
      {/* 필터 */}
      <div className="space-y-2">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {['전체',...sections.map(s=>s.name)].map(n=>(
            <button key={n} onClick={()=>{setFilterSec(n);setFilterCls('전체');}}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterSec===n?'bg-sky-500 text-white':'bg-white text-gray-600 border border-gray-200'}`}>{n}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Icon name="search" size={16} cls="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="이름 검색..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-sky-400"/>
          </div>
          <select value={filterCls} onChange={e=>setFilterCls(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none">
            <option value="전체">전체 반</option>
            {filteredClasses.map(c=><option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-4">
        {groupedByClass.map(({cls,students:ss})=>(
          <div key={cls.id}>
            <p className="font-bold text-gray-700 text-sm mb-2">{cls.name} <span className="text-gray-400 font-normal">({ss.filter(s=>s.active).length}명)</span></p>
            <div className="space-y-2">
              {ss.map(s=>(
                <Card key={s.id} cls="cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3" onClick={()=>setDetailSt(s)}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${s.active?'bg-gradient-to-br from-sky-400 to-blue-500':'bg-gray-300'}`}>{s.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-800">{s.name}</span>
                        {isThisWeek(s.birthDate)&&<span>🎂</span>}
                        {!s.active&&<Badge text="제적" color="red"/>}
                      </div>
                      <p className="text-xs text-gray-400">{s.grade}{s.birthDate&&` · ${getBirthMMDD(s.birthDate)}`}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={e=>{e.stopPropagation();setEditSt(s);}} className="p-1.5 hover:bg-sky-50 rounded-lg text-sky-500"><Icon name="edit" size={15}/></button>
                      <button onClick={e=>{e.stopPropagation();if(confirm('삭제?'))setStudents(p=>p.filter(x=>x.id!==s.id));}} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"><Icon name="trash" size={15}/></button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
        {!groupedByClass.length&&<div className="text-center text-gray-400 py-12">결과 없음</div>}
      </div>
      {showAdd&&<Modal title="학생 추가" onClose={()=>setShowAdd(false)}><StudentForm onSave={f=>setStudents(p=>[...p,{...f,id:nextId(p)}])} onClose={()=>setShowAdd(false)}/></Modal>}
      {editSt&&<Modal title="학생 수정" onClose={()=>setEditSt(null)}><StudentForm initial={editSt} onSave={f=>setStudents(p=>p.map(s=>s.id===f.id?f:s))} onClose={()=>setEditSt(null)}/></Modal>}
      {detailSt&&<Modal title="학생 정보" onClose={()=>setDetailSt(null)} wide><StudentDetail student={detailSt}/></Modal>}
    </div>
  );
};

// ── 출석체크 ─────────────────────────────────────────────
const AttendancePage = ({ students, classes, sections, attendance, setAttendance }) => {
  const [selDate, setSelDate] = useState(todayStr());
  const [selCls, setSelCls] = useState(classes[0]?.id||'');
  const [saved, setSaved] = useState(false);
  const CYCLE = {'출석':'결석','결석':'조퇴','조퇴':'공결','공결':'출석'};
  const STATUS_BG = {'출석':'bg-green-50 border-green-200','결석':'bg-red-50 border-red-200','조퇴':'bg-yellow-50 border-yellow-200','공결':'bg-blue-50 border-blue-200'};
  const STATUS_DOT = {'출석':'bg-green-500','결석':'bg-red-400','조퇴':'bg-yellow-400','공결':'bg-blue-400'};
  const STATUS_TXT = {'출석':'text-green-700','결석':'text-red-600','조퇴':'text-yellow-700','공결':'text-blue-700'};

  const clsStudents = students.filter(s=>s.classId===selCls&&s.active);
  const recs = attendance[selDate]||{};
  const toggle = id => { setAttendance(p=>({...p,[selDate]:{...(p[selDate]||{}), [id]:CYCLE[recs[id]||'출석']}})); setSaved(false); };
  const setAll = st => { const nr={...(attendance[selDate]||{})}; clsStudents.forEach(s=>nr[s.id]=st); setAttendance(p=>({...p,[selDate]:nr})); setSaved(false); };
  const counts = {출석:0,결석:0,조퇴:0,공결:0,미입력:0};
  clsStudents.forEach(s=>{ const st=recs[s.id]; st?counts[st]++:counts['미입력']++; });

  const cls = classes.find(c=>c.id===selCls);
  const sec = sections.find(s=>s.id===cls?.sectionId);

  return (
    <div className="fade-in space-y-4">
      <h1 className="text-xl font-bold text-gray-800">출석체크</h1>
      <Card cls="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">날짜</label>
            <input type="date" value={selDate} onChange={e=>{setSelDate(e.target.value);setSaved(false);}}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-sky-400"/>
          </div>
          <Sel label="반 선택" value={selCls} onChange={v=>{setSelCls(v);setSaved(false);}}
            options={classes.map(c=>({value:c.id,label:c.name}))}/>
        </div>
        {sec&&<div className="flex items-center gap-2"><Badge text={sec.name} color={sec.color}/><span className="text-xs text-gray-400">·</span><span className="text-xs text-gray-500">{cls?.name}</span></div>}
        <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
          {['출석','결석','조퇴','공결'].map(k=>(
            <div key={k} className={`rounded-lg p-2 ${STATUS_BG[k]} border`}>
              <p className={`font-bold text-base ${STATUS_TXT[k]}`}>{counts[k]}</p>
              <p className="text-gray-500">{k}</p>
            </div>
          ))}
        </div>
      </Card>
      <div className="flex gap-2">
        <Btn variant="secondary" size="sm" onClick={()=>setAll('출석')} cls="flex-1">전원 출석</Btn>
        <Btn variant="secondary" size="sm" onClick={()=>setAll('결석')} cls="flex-1">전원 결석</Btn>
      </div>
      <div className="space-y-2">
        {!clsStudents.length&&<div className="text-center text-gray-400 py-8">이 반에 학생이 없습니다.</div>}
        {clsStudents.map(s=>{
          const st=recs[s.id]||null;
          return (
            <div key={s.id} onClick={()=>toggle(s.id)}
              className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all select-none active:scale-[0.98] ${st?STATUS_BG[st]:'bg-white border-gray-200 hover:border-sky-200'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${st?STATUS_DOT[st]:'bg-gray-300'}`}>{s.name[0]}</div>
              <div className="flex-1"><p className="font-medium text-gray-800">{s.name}</p><p className="text-xs text-gray-400">{s.grade}</p></div>
              <div className="text-right">
                {st?<span className={`text-sm font-bold ${STATUS_TXT[st]}`}>{st}</span>:<span className="text-sm text-gray-300">탭하여 입력</span>}
                <p className="text-xs text-gray-400">탭으로 변경</p>
              </div>
            </div>
          );
        })}
      </div>
      {clsStudents.length>0&&(
        <Btn onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);}} cls="w-full justify-center py-3" variant={saved?'success':'primary'}>
          {saved?'✓ 저장 완료!':'💾 출석 저장'}
        </Btn>
      )}
    </div>
  );
};

// ── 통계 ─────────────────────────────────────────────────
const StatsPage = ({ students, classes, sections, attendance }) => {
  const active = students.filter(s=>s.active);
  const secColors = ['#fb7185','#fbbf24','#38bdf8','#a78bfa'];
  const secData = sections.map((sec,i)=>{
    const clsIds = classes.filter(c=>c.sectionId===sec.id).map(c=>c.id);
    return { label:sec.name, value:active.filter(s=>clsIds.includes(s.classId)).length, color:secColors[i]||'#38bdf8' };
  });
  const monthlyData = useMemo(()=>{
    const months = [];
    for (let i=5;i>=0;i--){
      const d=new Date(); d.setMonth(d.getMonth()-i);
      const ym=d.toISOString().slice(0,7), label=`${d.getMonth()+1}월`;
      const monthRecs = Object.entries(attendance).filter(([k])=>k.startsWith(ym));
      let total=0, present=0;
      monthRecs.forEach(([,r])=>active.forEach(s=>{ if(r[s.id]){total++;if(r[s.id]==='출석')present++;} }));
      months.push({ label, value:total?Math.round(present/total*100):0 });
    }
    return months;
  },[students,attendance]);

  const recent8 = Object.entries(attendance).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,8);
  const clsStats = classes.map((cls,i)=>{
    const ss=active.filter(s=>s.classId===cls.id);
    let t=0,p=0;
    recent8.forEach(([,r])=>ss.forEach(s=>{if(r[s.id]){t++;if(r[s.id]==='출석')p++;}}));
    const sec=sections.find(se=>se.id===cls.sectionId);
    return { label:cls.name, value:ss.length, rate:t?Math.round(p/t*100):0, color:secColors[sections.indexOf(sec)]||'#38bdf8' };
  });

  const totR = Object.values(attendance).reduce((a,r)=>a+Object.values(r).length,0);
  const totP = Object.values(attendance).reduce((a,r)=>a+Object.values(r).filter(s=>s==='출석').length,0);

  return (
    <div className="fade-in space-y-4">
      <h1 className="text-xl font-bold text-gray-800">통계</h1>
      <div className="grid grid-cols-2 gap-3">
        <Card cls="text-center"><p className="text-3xl font-bold text-sky-600">{active.length}</p><p className="text-sm text-gray-500 mt-1">재적 인원</p></Card>
        <Card cls="text-center"><p className="text-3xl font-bold text-green-500">{totR?Math.round(totP/totR*100):0}%</p><p className="text-sm text-gray-500 mt-1">전체 출석률</p></Card>
      </div>
      <Card><h2 className="font-bold text-gray-800 mb-3">부서별 재적 인원</h2><BarChart data={secData} height={160}/></Card>
      <Card><h2 className="font-bold text-gray-800 mb-3">월별 출석률 추이</h2><LineChart data={monthlyData} height={180}/></Card>
      <Card>
        <h2 className="font-bold text-gray-800 mb-3">반별 출석률 (최근 8주)</h2>
        <div className="space-y-3">
          {clsStats.map(c=>(
            <div key={c.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{c.label} <span className="text-gray-400">({c.value}명)</span></span>
                <span className="font-bold" style={{color:c.color}}>{c.rate}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{width:`${c.rate}%`,background:c.color}}/>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <h2 className="font-bold text-gray-800 mb-3">연간 요약</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-sky-50 rounded-xl p-3"><p className="text-xl font-bold text-sky-600">{Object.keys(attendance).length}</p><p className="text-gray-500 text-xs mt-1">기록 일수</p></div>
          <div className="bg-green-50 rounded-xl p-3"><p className="text-xl font-bold text-green-600">{totP}</p><p className="text-gray-500 text-xs mt-1">총 출석</p></div>
          <div className="bg-purple-50 rounded-xl p-3"><p className="text-xl font-bold text-purple-600">{students.filter(s=>!s.active).length}</p><p className="text-gray-500 text-xs mt-1">제적</p></div>
        </div>
      </Card>
    </div>
  );
};
