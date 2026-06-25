
// ── 생일 ─────────────────────────────────────────────────
const BirthdayPage = ({ students, classes }) => {
  const active = students.filter(s=>s.active&&s.birthDate);
  const getClassName = id => classes.find(c=>c.id===id)?.name||'';
  const thisWeek = active.filter(s=>isThisWeek(s.birthDate)).sort((a,b)=>getDaysUntilBirthday(a.birthDate)-getDaysUntilBirthday(b.birthDate));
  const thisMonth = active.filter(s=>isThisMonth(s.birthDate)&&!isThisWeek(s.birthDate)).sort((a,b)=>a.birthDate.slice(5).localeCompare(b.birthDate.slice(5)));
  const byMonth = Array.from({length:12},(_,i)=>({
    month:i+1, students:active.filter(s=>parseInt(s.birthDate.split('-')[1])===i+1).sort((a,b)=>parseInt(a.birthDate.split('-')[2])-parseInt(b.birthDate.split('-')[2]))
  })).filter(m=>m.students.length>0);
  return (
    <div className="fade-in space-y-4">
      <h1 className="text-xl font-bold text-gray-800">🎂 생일</h1>
      {thisWeek.length>0&&(
        <div>
          <h2 className="font-bold text-gray-700 mb-2">🎉 이번 주 생일자</h2>
          <div className="space-y-2">
            {thisWeek.map(s=>(
              <Card key={s.id} cls="border-pink-200 bg-gradient-to-r from-pink-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg">{s.name[0]}</div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">{s.name} <span className="text-lg">🎂</span></p>
                    <p className="text-sm text-gray-500">{getClassName(s.classId)} · {s.grade}</p>
                    <p className="text-sm text-pink-500 font-medium">{getBirthMMDD(s.birthDate)} · {getAge(s.birthDate)}</p>
                  </div>
                  <div className={`text-2xl font-bold ${getDaysUntilBirthday(s.birthDate)===0?'text-pink-500':'text-gray-600'}`}>
                    {getDaysUntilBirthday(s.birthDate)===0?'오늘!🥳':`D-${getDaysUntilBirthday(s.birthDate)}`}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      {thisMonth.length>0&&(
        <div>
          <h2 className="font-bold text-gray-700 mb-2">📅 이번 달 생일자</h2>
          <div className="space-y-2">
            {thisMonth.map(s=>(
              <Card key={s.id}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold">{s.name[0]}</div>
                  <div className="flex-1"><p className="font-medium text-gray-800">{s.name}</p><p className="text-sm text-gray-500">{getClassName(s.classId)} · {getBirthMMDD(s.birthDate)}</p></div>
                  <span className="text-sm text-sky-500 font-medium">D-{getDaysUntilBirthday(s.birthDate)}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      <div>
        <h2 className="font-bold text-gray-700 mb-2">📆 월별 생일자</h2>
        <div className="space-y-3">
          {byMonth.map(({month,students:ms})=>(
            <div key={month}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">{month}월</div>
                <span className="text-sm text-gray-500">{ms.length}명</span>
              </div>
              <div className="pl-10 space-y-1">
                {ms.map(s=>(
                  <div key={s.id} className="flex items-center gap-2 text-sm py-1 border-b border-gray-50">
                    <span className="font-medium text-gray-700">{s.name}</span>
                    <span className="text-gray-400">{getClassName(s.classId)}</span>
                    <span className="ml-auto text-gray-500">{getBirthMMDD(s.birthDate)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── 선생님 ───────────────────────────────────────────────
const TeachersPage = ({ teachers, setTeachers, students, classes, sections }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [editT, setEditT] = useState(null);
  const TeacherForm = ({ initial, onSave, onClose }) => {
    const empty = { name:'', classId:classes[0]?.id||'', phone:'', email:'', memo:'' };
    const [form, setForm] = useState(initial||empty);
    const set = (k,v)=>setForm(f=>({...f,[k]:v}));
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Inp label="이름" value={form.name} onChange={v=>set('name',v)} required/>
          <Sel label="담당 반" value={form.classId} onChange={v=>set('classId',v)} options={classes.map(c=>({value:c.id,label:c.name}))}/>
        </div>
        <Inp label="연락처" value={form.phone} onChange={v=>set('phone',v)}/>
        <Inp label="이메일" type="email" value={form.email} onChange={v=>set('email',v)}/>
        <Inp label="메모" value={form.memo} onChange={v=>set('memo',v)}/>
        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose} variant="secondary" cls="flex-1">취소</Btn>
          <Btn onClick={()=>{if(!form.name)return alert('이름 입력');onSave(form);onClose();}} cls="flex-1">저장</Btn>
        </div>
      </div>
    );
  };
  const secGrad = { rose:'from-rose-400 to-pink-500', amber:'from-amber-400 to-orange-500', sky:'from-sky-400 to-blue-500', violet:'from-violet-400 to-purple-500' };
  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">선생님</h1>
        <Btn onClick={()=>setShowAdd(true)}><Icon name="plus" size={16}/>추가</Btn>
      </div>
      {sections.map(sec=>{
        const secClasses = classes.filter(c=>c.sectionId===sec.id);
        return (
          <div key={sec.id}>
            <div className={`bg-gradient-to-r ${secGrad[sec.color]||secGrad.sky} rounded-xl px-4 py-2 mb-2 flex items-center gap-2`}>
              <span>{sec.emoji}</span><span className="font-bold text-white">{sec.name}</span>
            </div>
            <div className="space-y-3">
              {secClasses.map(cls=>{
                const clsTeachers = teachers.filter(t=>t.classId===cls.id);
                const clsStudents = students.filter(s=>s.classId===cls.id&&s.active);
                return (
                  <Card key={cls.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-800">{cls.name}</span>
                      <span className="text-xs text-gray-400">학생 {clsStudents.length}명</span>
                    </div>
                    {!clsTeachers.length?<p className="text-sm text-gray-400 text-center py-1">담당 선생님 없음</p>:(
                      <div className="space-y-2">
                        {clsTeachers.map(t=>(
                          <div key={t.id} className="flex items-center gap-3 p-2 bg-sky-50 rounded-xl">
                            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold">{t.name[0]}</div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{t.name}</p>
                              <p className="text-xs text-gray-500">{t.phone}</p>
                              {t.memo&&<p className="text-xs text-sky-600">{t.memo}</p>}
                            </div>
                            <div className="flex gap-1">
                              <button onClick={()=>setEditT(t)} className="p-1.5 hover:bg-sky-100 rounded-lg text-sky-500"><Icon name="edit" size={14}/></button>
                              <button onClick={()=>{if(confirm('삭제?'))setTeachers(p=>p.filter(x=>x.id!==t.id));}} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"><Icon name="trash" size={14}/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {clsStudents.length>0&&<div className="mt-2 flex flex-wrap gap-1">{clsStudents.slice(0,8).map(s=><span key={s.id} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{s.name}</span>)}{clsStudents.length>8&&<span className="text-xs text-gray-400">+{clsStudents.length-8}</span>}</div>}
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
      {showAdd&&<Modal title="선생님 추가" onClose={()=>setShowAdd(false)}><TeacherForm onSave={t=>setTeachers(p=>[...p,{...t,id:nextId(p)}])} onClose={()=>setShowAdd(false)}/></Modal>}
      {editT&&<Modal title="선생님 수정" onClose={()=>setEditT(null)}><TeacherForm initial={editT} onSave={t=>setTeachers(p=>p.map(x=>x.id===t.id?t:x))} onClose={()=>setEditT(null)}/></Modal>}
    </div>
  );
};

// ── 회의자료 ─────────────────────────────────────────────
const MeetingsPage = ({ meetings, setMeetings }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [detail, setDetail] = useState(null);
  const [filterCat, setFilterCat] = useState('전체');
  const CATS = ['전체','회의록','공지','교육자료','기타'];
  const catCol = {'회의록':'purple','공지':'orange','교육자료':'green','기타':'sky'};
  const filtered = meetings.filter(m=>filterCat==='전체'||m.category===filterCat).sort((a,b)=>b.date.localeCompare(a.date));
  const DocForm = ({ onSave, onClose }) => {
    const [form, setForm] = useState({ title:'', date:todayStr(), uploader:'', category:'회의록', content:'' });
    const set = (k,v)=>setForm(f=>({...f,[k]:v}));
    return (
      <div className="space-y-3">
        <Inp label="제목" value={form.title} onChange={v=>set('title',v)} required/>
        <div className="grid grid-cols-2 gap-3">
          <Inp label="날짜" type="date" value={form.date} onChange={v=>set('date',v)}/>
          <Sel label="카테고리" value={form.category} onChange={v=>set('category',v)} options={['회의록','공지','교육자료','기타']}/>
        </div>
        <Inp label="작성자" value={form.uploader} onChange={v=>set('uploader',v)}/>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">내용</label>
          <textarea value={form.content} onChange={e=>set('content',e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm h-28 resize-none outline-none focus:border-sky-400"/>
        </div>
        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose} variant="secondary" cls="flex-1">취소</Btn>
          <Btn onClick={()=>{if(!form.title)return alert('제목 입력');onSave(form);onClose();}} cls="flex-1">저장</Btn>
        </div>
      </div>
    );
  };
  const download = m => {
    const b=new Blob([`${m.title}\n날짜: ${m.date}\n작성자: ${m.uploader}\n\n${m.content}`],{type:'text/plain;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`${m.title}.txt`; a.click();
  };
  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">회의자료</h1>
        <Btn onClick={()=>setShowAdd(true)}><Icon name="plus" size={16}/>자료 추가</Btn>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {CATS.map(c=><button key={c} onClick={()=>setFilterCat(c)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filterCat===c?'bg-sky-500 text-white':'bg-white text-gray-600 border border-gray-200'}`}>{c}</button>)}
      </div>
      <div className="space-y-2">
        {filtered.map(m=>(
          <Card key={m.id} cls="cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center text-sky-500 flex-shrink-0"><Icon name="doc" size={18}/></div>
              <div className="flex-1 min-w-0" onClick={()=>setDetail(m)}>
                <p className="font-medium text-gray-800">{m.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{fmt(m.date)} · {m.uploader}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Badge text={m.category} color={catCol[m.category]||'sky'}/>
                <button onClick={()=>download(m)} className="p-1.5 hover:bg-sky-50 rounded-lg text-sky-500"><Icon name="download" size={15}/></button>
                <button onClick={()=>{if(confirm('삭제?'))setMeetings(p=>p.filter(x=>x.id!==m.id));}} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"><Icon name="trash" size={15}/></button>
              </div>
            </div>
          </Card>
        ))}
        {!filtered.length&&<div className="text-center text-gray-400 py-12">자료가 없습니다.</div>}
      </div>
      {showAdd&&<Modal title="자료 추가" onClose={()=>setShowAdd(false)} wide><DocForm onSave={m=>setMeetings(p=>[...p,{...m,id:nextId(p)}])} onClose={()=>setShowAdd(false)}/></Modal>}
      {detail&&(
        <Modal title={detail.title} onClose={()=>setDetail(null)} wide>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="text-gray-500">{fmt(detail.date)}</span><span className="text-gray-400">·</span>
              <span className="text-gray-500">{detail.uploader}</span>
              <Badge text={detail.category} color={catCol[detail.category]||'sky'}/>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap min-h-24">{detail.content||'내용 없음'}</div>
            <div className="flex gap-2">
              <Btn onClick={()=>setDetail(null)} variant="secondary" cls="flex-1">닫기</Btn>
              <Btn onClick={()=>download(detail)} cls="flex-1"><Icon name="download" size={14}/>다운로드</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ── 사진앨범 (섹션별) ────────────────────────────────────
const PhotosPage = ({ photos, setPhotos, sections }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [selSec, setSelSec] = useState('all');
  const [lightbox, setLightbox] = useState(null);
  const PLACEHOLDERS = ['🌸','🌿','⛅','🌟','🙏','❤️','✝️','🎉'];

  const filtered = photos.filter(p=>selSec==='all'||p.sectionId===selSec||p.sectionId==='all');
  const byAlbum = {};
  filtered.forEach(p=>{ if(!byAlbum[p.album])byAlbum[p.album]=[]; byAlbum[p.album].push(p); });

  const AddForm = ({ onSave, onClose }) => {
    const [form, setForm] = useState({ album:'', sectionId:'all', date:todayStr(), caption:'' });
    const [imgSrc, setImgSrc] = useState('');
    const set = (k,v)=>setForm(f=>({...f,[k]:v}));
    const handleFile = e => { const file=e.target.files[0]; if(!file)return; const r=new FileReader(); r.onload=ev=>setImgSrc(ev.target.result); r.readAsDataURL(file); };
    return (
      <div className="space-y-3">
        <Inp label="앨범명" value={form.album} onChange={v=>set('album',v)} required/>
        <Sel label="부서" value={form.sectionId} onChange={v=>set('sectionId',v)} options={[{value:'all',label:'전체(공통)'},...sections.map(s=>({value:s.id,label:s.emoji+' '+s.name}))]}/>
        <div className="grid grid-cols-2 gap-3">
          <Inp label="날짜" type="date" value={form.date} onChange={v=>set('date',v)}/>
          <Inp label="설명" value={form.caption} onChange={v=>set('caption',v)}/>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">사진 선택</label>
          <input type="file" accept="image/*" onChange={handleFile} className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-sm file:bg-sky-50 file:text-sky-600"/>
        </div>
        {imgSrc&&<img src={imgSrc} alt="" className="w-full h-40 object-cover rounded-xl"/>}
        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose} variant="secondary" cls="flex-1">취소</Btn>
          <Btn onClick={()=>{if(!form.album)return alert('앨범명 입력');onSave({...form,src:imgSrc});onClose();}} cls="flex-1">저장</Btn>
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">사진 앨범</h1>
        <Btn onClick={()=>setShowAdd(true)}><Icon name="plus" size={16}/>추가</Btn>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button onClick={()=>setSelSec('all')} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selSec==='all'?'bg-sky-500 text-white':'bg-white text-gray-600 border border-gray-200'}`}>전체</button>
        {sections.map(s=>(
          <button key={s.id} onClick={()=>setSelSec(s.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selSec===s.id?'bg-sky-500 text-white':'bg-white text-gray-600 border border-gray-200'}`}>{s.emoji} {s.name}</button>
        ))}
      </div>
      {Object.entries(byAlbum).map(([album,ps])=>(
        <div key={album}>
          <h2 className="font-bold text-gray-700 mb-2">{album} <span className="text-sm text-gray-400 font-normal">({ps.length}장)</span></h2>
          <div className="grid grid-cols-3 gap-2">
            {ps.map((p,i)=>(
              <div key={p.id} onClick={()=>setLightbox(p)} className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
                {p.src?<img src={p.src} alt="" className="w-full h-full object-cover"/>:<span className="text-4xl">{PLACEHOLDERS[i%PLACEHOLDERS.length]}</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
      {!filtered.length&&<div className="text-center text-gray-400 py-12">사진이 없습니다.</div>}
      {showAdd&&<Modal title="사진 추가" onClose={()=>setShowAdd(false)}><AddForm onSave={p=>setPhotos(prev=>[...prev,{...p,id:nextId(prev)}])} onClose={()=>setShowAdd(false)}/></Modal>}
      {lightbox&&(
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4" onClick={()=>setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white p-2"><Icon name="x" size={24}/></button>
          {lightbox.src?<img src={lightbox.src} alt="" className="max-w-full max-h-[70vh] rounded-xl object-contain"/>:<div className="w-64 h-64 bg-gray-800 rounded-xl flex items-center justify-center text-6xl">🖼️</div>}
          {lightbox.caption&&<p className="text-white mt-3 text-sm">{lightbox.caption}</p>}
          <p className="text-gray-400 text-xs mt-1">{lightbox.album} · {fmt(lightbox.date)}</p>
        </div>
      )}
    </div>
  );
};

// ── 기도제목 ─────────────────────────────────────────────
const PrayersPage = ({ prayers, setPrayers }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [detail, setDetail] = useState(null);
  const PrayerForm = ({ onSave, onClose }) => {
    const [form, setForm] = useState({ title:'', content:'', author:'', date:todayStr(), answered:false });
    const set = (k,v)=>setForm(f=>({...f,[k]:v}));
    return (
      <div className="space-y-3">
        <Inp label="제목" value={form.title} onChange={v=>set('title',v)} required/>
        <div className="grid grid-cols-2 gap-3">
          <Inp label="올린이" value={form.author} onChange={v=>set('author',v)}/>
          <Inp label="날짜" type="date" value={form.date} onChange={v=>set('date',v)}/>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">내용 <span className="text-red-500">*</span></label>
          <textarea value={form.content} onChange={e=>set('content',e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm h-28 resize-none outline-none focus:border-sky-400"/>
        </div>
        <div className="flex gap-2 pt-2">
          <Btn onClick={onClose} variant="secondary" cls="flex-1">취소</Btn>
          <Btn onClick={()=>{if(!form.title||!form.content)return alert('제목과 내용 입력');onSave(form);onClose();}} cls="flex-1">등록</Btn>
        </div>
      </div>
    );
  };
  const toggle = id=>setPrayers(p=>p.map(x=>x.id===id?{...x,answered:!x.answered}:x));
  const active = prayers.filter(p=>!p.answered).sort((a,b)=>b.date.localeCompare(a.date));
  const answered = prayers.filter(p=>p.answered).sort((a,b)=>b.date.localeCompare(a.date));
  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">🙏 기도제목</h1>
        <Btn onClick={()=>setShowAdd(true)}><Icon name="plus" size={16}/>등록</Btn>
      </div>
      <div className="space-y-2">
        <h2 className="font-bold text-gray-700 text-sm">기도 중 ({active.length})</h2>
        {active.map(p=>(
          <Card key={p.id}>
            <div className="flex items-start gap-3 cursor-pointer" onClick={()=>setDetail(p)}>
              <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-500 flex-shrink-0 text-lg">🙏</div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800">{p.title}</p>
                <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{p.content}</p>
                <p className="text-xs text-gray-400 mt-1">{fmt(p.date)} · {p.author}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
              <Btn size="sm" variant="success" onClick={()=>toggle(p.id)} cls="flex-1">응답됨 ✓</Btn>
              <Btn size="sm" variant="danger" onClick={()=>{if(confirm('삭제?'))setPrayers(pr=>pr.filter(x=>x.id!==p.id));}}>삭제</Btn>
            </div>
          </Card>
        ))}
        {!active.length&&<div className="text-center text-gray-400 py-6">등록된 기도제목이 없습니다.</div>}
      </div>
      {answered.length>0&&(
        <div className="space-y-2">
          <h2 className="font-bold text-gray-700 text-sm">응답됨 ({answered.length})</h2>
          {answered.map(p=>(
            <Card key={p.id} cls="opacity-60">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <div className="flex-1"><p className="font-medium text-gray-600 line-through">{p.title}</p><p className="text-xs text-gray-400">{p.author}</p></div>
                <Btn size="sm" variant="secondary" onClick={()=>toggle(p.id)}>되돌리기</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
      {showAdd&&<Modal title="기도제목 등록" onClose={()=>setShowAdd(false)} wide><PrayerForm onSave={p=>setPrayers(pr=>[...pr,{...p,id:nextId(pr)}])} onClose={()=>setShowAdd(false)}/></Modal>}
      {detail&&(
        <Modal title="기도제목" onClose={()=>setDetail(null)} wide>
          <div className="space-y-3">
            <h2 className="font-bold text-gray-800 text-lg">{detail.title}</h2>
            <p className="text-sm text-gray-500">{fmt(detail.date)} · {detail.author}</p>
            <div className="bg-rose-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap">{detail.content}</div>
            <Btn onClick={()=>setDetail(null)} variant="secondary" cls="w-full justify-center">닫기</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};
