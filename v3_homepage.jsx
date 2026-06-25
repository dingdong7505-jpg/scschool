
// ── 공개 홈페이지 ─────────────────────────────────────────
const Homepage=({site,sections,classes,students,photos,prayers,onOpenManage})=>{
  const [scrolled,setScrolled]=useState(false);
  const [activeSec,setActiveSec]=useState(null); // null = 전체
  const [mobileMenu,setMobileMenu]=useState(false);
  const [showPrayerForm,setShowPrayerForm]=useState(false);

  useEffect(()=>{
    const fn=()=>setScrolled(window.scrollY>60);
    window.addEventListener('scroll',fn);
    return ()=>window.removeEventListener('scroll',fn);
  },[]);

  const active=students.filter(s=>s.active);
  const weekBdays=active.filter(s=>isThisWeek(s.birthDate)).sort((a,b)=>getDUB(a.birthDate)-getDUB(b.birthDate));
  const EMOJIS=['🌸','🌿','⛅','🌟','🙏','❤️','✝️','🎉','📖','🕊️'];

  // 섹션별 색상 테마
  const secTheme={
    rose:  {bg:'#7c2d2d',light:'#fdf2f2',accent:'#dc2626',text:'rose'},
    amber: {bg:'#7c5a1a',light:'#fdf8ee',accent:'#d97706',text:'amber'},
    teal:  {bg:'#1a4a3a',light:'#f0fdf8',accent:'#0d9488',text:'teal'},
    indigo:{bg:'#1a1a4a',light:'#f0f0ff',accent:'#6366f1',text:'indigo'},
  };

  const navLinks=[
    {label:'홈',href:'#home'},
    {label:'교회학교 소개',href:'#about'},
    {label:'부서 안내',href:'#sections'},
    {label:'갤러리',href:'#gallery'},
    {label:'기도제목',href:'#prayers'},
  ];

  const scrollTo=id=>{ document.getElementById(id)?.scrollIntoView({behavior:'smooth'}); setMobileMenu(false); };

  const filteredPhotos = activeSec ? photos.filter(p=>p.sectionId===activeSec||p.sectionId==='all') : photos;
  const byAlbum={}; filteredPhotos.forEach(p=>{ if(!byAlbum[p.album])byAlbum[p.album]=[]; byAlbum[p.album].push(p); });

  const heroTc = site.heroTextColor || '#ffffff';
  const heroOv = (site.heroOverlay != null ? site.heroOverlay : 30) / 100;
  const heroShadow = '0 2px 12px rgba(0,0,0,0.6)';

  return (
    <div className="font-serif">
      {/* ── 고정 네비게이션 ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled?'bg-white/95 backdrop-blur-md shadow-sm':'bg-black/20 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center h-16 gap-8">
          <div className="flex items-center gap-3 flex-1">
            <span className={`text-xl ${scrolled?'text-[#1a1a1a]':'text-white'}`}>✝</span>
            <span className={`font-bold text-sm tracking-wide ${scrolled?'text-[#1a1a1a]':'text-white'}`}>{site.churchName}</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(l=>(
              <button key={l.href} onClick={()=>scrollTo(l.href.slice(1))}
                className={`text-sm font-medium tracking-wide transition-colors ${scrolled?'text-gray-600 hover:text-[#b8934a]':'text-white/80 hover:text-white'}`}>{l.label}</button>
            ))}
          </div>
          <button onClick={onOpenManage}
            className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${scrolled?'bg-[#3d6b4f] text-white hover:bg-[#2d5240]':'bg-white/15 border border-white/30 text-white hover:bg-white/25'}`}>
            🔐 교사 로그인
          </button>
          <button onClick={()=>setMobileMenu(v=>!v)} className={`md:hidden ${scrolled?'text-gray-700':'text-white'} text-xl`}>☰</button>
        </div>
        {/* 모바일 메뉴 */}
        {mobileMenu&&(
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
            {navLinks.map(l=>(
              <button key={l.href} onClick={()=>scrollTo(l.href.slice(1))} className="block w-full text-left text-gray-700 py-2 font-medium">{l.label}</button>
            ))}
            <button onClick={onOpenManage} className="w-full py-2.5 bg-[#3d6b4f] text-white rounded-xl font-semibold">🔐 교사 로그인</button>
          </div>
        )}
      </nav>

      {/* ── 히어로 ── */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* 배경 */}
        <div className="absolute inset-0" style={{
          background: site.heroBgType==='image' && site.heroBgImage
            ? `url(${site.heroBgImage}) center/cover no-repeat`
            : (HERO_PRESETS.find(p=>p.key===(site.heroBgGradient||'sky'))?.css || HERO_PRESETS[0].css),
        }}>
          {/* 빛 번짐 효과 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[32rem] h-[32rem] rounded-full opacity-20" style={{background:'radial-gradient(circle,rgba(255,255,255,0.6) 0%,transparent 70%)'}}/>
          </div>
          {/* 물결 패턴 장식 */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.5) 1px,transparent 1px)',
            backgroundSize:'32px 32px',
          }}/>
          {/* 아치형 창문 장식 */}
          <div className="absolute inset-x-0 top-0 flex justify-center gap-16 opacity-15 pointer-events-none">
            {[1,2,3].map(i=>(
              <div key={i} className="w-24" style={{height:'60vh',background:'linear-gradient(to bottom,rgba(255,255,255,0.3),transparent)',borderRadius:'0 0 50% 50%',border:'1px solid rgba(255,255,255,0.3)'}}/>
            ))}
          </div>
        </div>
        {/* 오버레이 — 강도 조절 가능 */}
        <div className="absolute inset-0" style={{background:`linear-gradient(to bottom,rgba(0,0,0,${heroOv*0.7}) 0%,rgba(0,0,0,${heroOv*0.5}) 40%,rgba(0,0,0,${heroOv}) 100%)`}}/>

        {/* 콘텐츠 */}
        <div className="relative text-center px-6 max-w-4xl mx-auto" style={{color:heroTc}}>
          <p className="text-xs tracking-[0.4em] uppercase mb-6 font-sans opacity-90" style={{textShadow:heroShadow}}>CHURCH SCHOOL</p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6 font-jua" style={{textShadow:heroShadow}}>
            {site.churchName}
          </h1>
          <p className="text-lg md:text-xl mb-8 font-medium leading-relaxed opacity-90 font-jua" style={{textShadow:heroShadow}}>
            {site.subtitle}
          </p>
          {site.heroVerse&&(
            <div className="max-w-xl mx-auto mb-8 rounded-2xl px-6 py-4" style={{background:'rgba(0,0,0,0.25)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.25)'}}>
              <p className="text-sm italic leading-relaxed opacity-95" style={{color:heroTc,textShadow:heroShadow}}>"{site.heroVerse.replace(/["""]/g,'')}"</p>
              {site.heroVerseRef&&<p className="text-xs mt-2 tracking-wider opacity-70" style={{color:heroTc}}>— {site.heroVerseRef}</p>}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={()=>scrollTo('sections')} className="px-8 py-3.5 rounded-full font-semibold text-sm bg-white text-gray-900 hover:bg-white/90 transition-all shadow-xl">부서 안내 보기</button>
            <button onClick={onOpenManage} className="px-8 py-3.5 rounded-full font-semibold text-sm transition-all" style={{color:heroTc,background:'rgba(0,0,0,0.25)',border:'2px solid rgba(255,255,255,0.6)',backdropFilter:'blur(4px)'}}>🔐 교사 로그인</button>
          </div>
          {site.announcement&&(
            <div className="mt-8 inline-block bg-white/15 border border-white/30 rounded-2xl px-5 py-3 text-sm text-white backdrop-blur-sm">
              📢 {site.announcement}
            </div>
          )}
        </div>
        {/* 스크롤 힌트 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50">
          <span className="text-xs tracking-widest font-sans drop-shadow">SCROLL DOWN</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/50 to-transparent"/>
        </div>
      </section>

      {/* ── 소개 ── */}
      <section id="about" className="py-24" style={{background:'#faf7f2'}}>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-[#b8934a] text-xs tracking-[0.3em] uppercase mb-4 font-sans">ABOUT US</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-snug mb-6">하나님의 말씀 위에<br/>세워지는 다음 세대</h2>
            <p className="text-gray-600 leading-relaxed mb-6">교회학교는 아이들이 처음으로 하나님의 사랑을 배우고, 믿음의 공동체 안에서 함께 자라가는 곳입니다. 영유치부부터 청년부까지, 각 나이에 맞는 말씀 교육과 신앙 훈련을 제공합니다.</p>
            <div className="grid grid-cols-2 gap-4">
              {sections.map(sec=>{
                const cnt=students.filter(s=>DEFAULT_CLASSES.find(c=>c.id===s.classId)?.sectionId===sec.id&&s.active).length;
                return (
                  <div key={sec.id} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm">
                    <span className="text-2xl">{sec.emoji}</span>
                    <div><p className="font-bold text-gray-800 text-sm">{sec.name}</p><p className="text-xs text-gray-400">{cnt}명</p></div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* 통계 카드 */}
          <div className="grid grid-cols-2 gap-4">
            {[{v:active.length,l:'전체 재적',s:'명'},{v:classes.length,l:'반 수',s:'개'},{v:weekBdays.length,l:'이번 주 생일',s:'명'},{v:sections.length,l:'부서',s:'개'}].map((c,i)=>(
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm text-center border border-gray-50">
                <p className="text-4xl font-bold text-[#b8934a] mb-1">{c.v}<span className="text-xl">{c.s}</span></p>
                <p className="text-sm text-gray-500">{c.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 부서 안내 ── */}
      <section id="sections" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[#b8934a] text-xs tracking-[0.3em] uppercase mb-3 font-sans">MINISTRIES</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 font-jua">부서 안내</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sections.map(sec=>{
              const secClasses=classes.filter(c=>c.sectionId===sec.id);
              const cnt=students.filter(s=>secClasses.some(c=>c.id===s.classId)&&s.active).length;
              const th=secTheme[sec.color]||secTheme.teal;
              return (
                <div key={sec.id} className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100">
                  <div className="h-36 flex items-center justify-center text-6xl relative" style={{background:`linear-gradient(${sec.gradient})`}}>
                    <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.3) 1px,transparent 1px)',backgroundSize:'20px 20px'}}/>
                    <span className="relative">{sec.emoji}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-lg mb-1 font-jua">{sec.name}</h3>
                    <p className="text-gray-500 text-sm mb-3 leading-relaxed">{sec.desc}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">{secClasses.map(c=><span key={c.id} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{c.name}</span>)}</div>
                      <span className="text-xs text-gray-400 font-medium">{cnt}명</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 이번 주 생일 + 기도제목 ── */}
      <section className="py-24" style={{background:'#faf7f2'}}>
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-12">
          {/* 생일 */}
          <div>
            <p className="text-[#b8934a] text-xs tracking-[0.3em] uppercase mb-3 font-sans">BIRTHDAYS</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">이번 주 생일 🎂</h2>
            {weekBdays.length===0?(
              <p className="text-gray-400 text-sm">이번 주 생일자가 없습니다.</p>
            ):(
              <div className="space-y-3">
                {weekBdays.map(s=>{
                  const cls=classes.find(c=>c.id===s.classId);
                  return (
                    <div key={s.id} className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{background:'linear-gradient(135deg,#b8934a,#d4aa6e)'}}>{s.name[0]}</div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{s.name}</p>
                        <p className="text-sm text-gray-500">{cls?.name} · {getBMMDD(s.birthDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#b8934a]">{getDUB(s.birthDate)===0?'🥳오늘!':`D-${getDUB(s.birthDate)}`}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* 기도제목 */}
          <div id="prayers">
            <p className="text-[#b8934a] text-xs tracking-[0.3em] uppercase mb-3 font-sans">PRAYERS</p>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">기도제목 🙏</h2>
              <button onClick={()=>setShowPrayerForm(true)} className="text-sm text-[#b8934a] font-medium hover:underline">+ 등록</button>
            </div>
            <div className="space-y-3">
              {prayers.filter(p=>!p.answered).slice(0,3).map(p=>(
                <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <p className="font-semibold text-gray-900 mb-1">{p.title}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">{p.content}</p>
                  <p className="text-xs text-gray-400 mt-2">{p.author} · {fmt(p.date)}</p>
                </div>
              ))}
              {prayers.filter(p=>!p.answered).length===0&&<p className="text-gray-400 text-sm">등록된 기도제목이 없습니다.</p>}
            </div>
          </div>
        </div>
      </section>

      {/* ── 사진 갤러리 ── */}
      <section id="gallery" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-[#b8934a] text-xs tracking-[0.3em] uppercase mb-3 font-sans">GALLERY</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">사진 갤러리</h2>
            <div className="flex justify-center gap-2 flex-wrap">
              <button onClick={()=>setActiveSec(null)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!activeSec?'bg-[#1a1a1a] text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>전체</button>
              {sections.map(s=>(
                <button key={s.id} onClick={()=>setActiveSec(s.id)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeSec===s.id?'bg-[#1a1a1a] text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s.emoji} {s.name}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.map((p,i)=>(
              <div key={p.id} className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group cursor-pointer hover:shadow-lg transition-all">
                {p.src?<img src={p.src} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>:(
                  <div className="text-center">
                    <div className="text-4xl mb-1">{EMOJIS[i%EMOJIS.length]}</div>
                    <p className="text-xs text-gray-500 px-2">{p.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {filteredPhotos.length===0&&<p className="text-center text-gray-400 py-12">사진이 없습니다.</p>}
        </div>
      </section>

      {/* ── 푸터 ── */}
      <footer className="py-12" style={{background:'#1a1a1a'}}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[#b8934a] text-2xl">✝</span>
            <div>
              <p className="text-white font-bold">{site.churchName}</p>
              <p className="text-white/40 text-sm">{site.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onOpenManage} className="px-5 py-2 rounded-full border border-[#b8934a] text-[#b8934a] text-sm font-medium hover:bg-[#b8934a] hover:text-white transition-all">교사 로그인</button>
            <p className="text-white/30 text-xs">© 2026 {site.churchName}</p>
          </div>
        </div>
      </footer>

      {/* 기도제목 등록 모달 */}
      {showPrayerForm&&<PrayerFormModal onClose={()=>setShowPrayerForm(false)}/>}
    </div>
  );
};

// 기도제목 등록 (공개용 — App 전달 없이 독립적)
const PrayerFormModal=({onClose})=>{
  const [prayers,setPrayers]=useLS('prayers_v3',INITIAL_PRAYERS);
  const [form,setForm]=useState({title:'',content:'',author:'',date:todayStr(),answered:false});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return (
    <Modal title="기도제목 등록" onClose={onClose}>
      <div className="space-y-3">
        <Inp label="제목" value={form.title} onChange={v=>set('title',v)} required/>
        <Inp label="올린이" value={form.author} onChange={v=>set('author',v)}/>
        <div className="flex flex-col gap-1"><label className="text-sm font-medium text-gray-700">내용 <span className="text-red-400">*</span></label>
          <textarea value={form.content} onChange={e=>set('content',e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm h-24 resize-none outline-none focus:border-[#b8934a]"/>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">취소</button>
          <button onClick={()=>{setPrayers(p=>[...p,{...form,id:nextId(p)}]);onClose();}}
            className="flex-1 py-2.5 rounded-xl bg-[#3d6b4f] text-white text-sm font-medium hover:bg-[#2d5240]">등록</button>
        </div>
      </div>
    </Modal>
  );
};
