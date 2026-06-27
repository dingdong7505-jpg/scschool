import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { logLogin, fetchSharedState, pushSharedState, sendOtp, verifyOtp } from '../supabaseClient.js';

// 여러 사람이 동시에 같은 목록(학생/사진 등)을 고칠 때 서로 덮어쓰지 않도록,
// 저장 직전 서버의 최신 값을 받아와 이번 변경(mutate)만 적용해서 다시 올린다.
const mergeArrayWrite = async (key, setLocal, mutate) => {
  setLocal(prev => mutate(prev));
  try {
    const remote = await fetchSharedState(key);
    const base = remote || [];
    const merged = mutate(base);
    setLocal(merged);
    await pushSharedState(key, merged);
  } catch (e) {
    console.warn('merge write failed', key, e);
  }
};

const resizeImage = (file, maxDim = 800, quality = 0.8) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
        else { width = Math.round(width * maxDim / height); height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = e.target.result;
  };
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const downloadDataUrl = async (dataUrl, filename) => {
  if (!dataUrl) return;
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.warn('download failed', e);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }
};

const exportXLSX = (rows, filename, sheetName = 'Sheet1') => {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
};

// ── 데이터 ──────────────────────────────────────────────
const DEFAULT_SITE = {
  churchName: '신천교회 교회학교',
  subtitle: '하나님의 사랑 안에서 함께 자라가는 아이들',
  heroVerse: '"마땅히 행할 길을 아이에게 가르치라 그리하면 늙어도 그것을 떠나지 아니하리라"',
  heroVerseRef: '잠언 22:6',
  announcement: '',
  adminPin: '1234',
  heroBgType: 'gradient',   // 'gradient' | 'image'
  heroBgGradient: 'sky',    // preset key
  heroBgImage: '',          // base64
  heroTextColor: '#ffffff', // 히어로 글씨 색
  heroOverlay: 30,          // 오버레이 어둠 강도 0~80
};

// 히어로 배경 프리셋
const HERO_PRESETS = [
  { key:'sky',    label:'☀️ 하늘빛',   css:'linear-gradient(135deg,#0284c7 0%,#38bdf8 50%,#7dd3fc 100%)' },
  { key:'spring', label:'🌿 봄 초원',  css:'linear-gradient(135deg,#16a34a 0%,#4ade80 50%,#bbf7d0 100%)' },
  { key:'sunset', label:'🌅 노을',     css:'linear-gradient(135deg,#f97316 0%,#fbbf24 50%,#fde68a 100%)' },
  { key:'cherry', label:'🌸 벚꽃',     css:'linear-gradient(135deg,#db2777 0%,#f472b6 50%,#fda4af 100%)' },
  { key:'ocean',  label:'🌊 바다',     css:'linear-gradient(135deg,#0f4c81 0%,#1e6fa5 50%,#38bdf8 100%)' },
  { key:'grape',  label:'🍇 포도원',   css:'linear-gradient(135deg,#7c3aed 0%,#a78bfa 50%,#c4b5fd 100%)' },
  { key:'dark',   label:'🌙 다크(기존)',css:'linear-gradient(160deg,#0f1a10 0%,#1a0f08 40%,#0a0f1a 100%)' },
];
const DEFAULT_SECTIONS = [
  { id:'s1', name:'영유치부', color:'rose',   emoji:'🌸', gradient:'135deg,#fb7185,#f43f5e', desc:'하나님 안에서 첫걸음을 떼는 우리 아이들' },
  { id:'s2', name:'아동부',   color:'amber',  emoji:'🌟', gradient:'135deg,#fbbf24,#f59e0b', desc:'말씀으로 튼튼하게 자라가는 어린이들' },
  { id:'s3', name:'학생부',   color:'teal',   emoji:'📖', gradient:'135deg,#34d399,#10b981', desc:'믿음의 반석 위에 세워지는 청소년들' },
  { id:'s4', name:'청년부',   color:'indigo', emoji:'✝', gradient:'135deg,#818cf8,#6366f1', desc:'세상을 향해 나아가는 다음 세대' },
];
const DEFAULT_CLASSES = [
  { id:'c1', name:'영아부',  sectionId:'s1' },
  { id:'c2', name:'유치부',  sectionId:'s1' },
  { id:'c3', name:'초등1부', sectionId:'s2' },
  { id:'c4', name:'초등2부', sectionId:'s2' },
  { id:'c5', name:'중등부',  sectionId:'s3' },
  { id:'c6', name:'고등부',  sectionId:'s3' },
  { id:'c7', name:'청년부',  sectionId:'s4' },
];
const INITIAL_STUDENTS = [
  { id:1,  name:'김민준', classId:'c2', grade:'7세',   phone:'',              parentPhone:'010-1234-5678', birthDate:'2018-03-15', registeredDate:'2023-01-08', memo:'활발하고 씩씩함', active:true },
  { id:2,  name:'이서연', classId:'c2', grade:'6세',   phone:'',              parentPhone:'010-2345-6789', birthDate:'2019-06-22', registeredDate:'2023-01-08', memo:'', active:true },
  { id:3,  name:'박지호', classId:'c2', grade:'7세',   phone:'',              parentPhone:'010-3456-7890', birthDate:'2018-09-10', registeredDate:'2023-03-05', memo:'', active:true },
  { id:4,  name:'최아린', classId:'c3', grade:'1학년', phone:'',              parentPhone:'010-4567-8901', birthDate:'2017-01-20', registeredDate:'2022-02-06', memo:'피아노 특기', active:true },
  { id:5,  name:'정우진', classId:'c3', grade:'2학년', phone:'',              parentPhone:'010-5678-9012', birthDate:'2016-04-11', registeredDate:'2022-02-06', memo:'', active:true },
  { id:6,  name:'강하은', classId:'c3', grade:'3학년', phone:'010-6789-0123', parentPhone:'010-7890-1234', birthDate:'2015-07-30', registeredDate:'2021-03-07', memo:'찬양팀', active:true },
  { id:7,  name:'윤도현', classId:'c3', grade:'1학년', phone:'',              parentPhone:'010-8901-2345', birthDate:'2017-11-05', registeredDate:'2023-01-08', memo:'', active:true },
  { id:8,  name:'임채원', classId:'c4', grade:'4학년', phone:'010-9012-3456', parentPhone:'010-0123-4567', birthDate:'2014-02-28', registeredDate:'2020-03-01', memo:'독서를 좋아함', active:true },
  { id:9,  name:'한소희', classId:'c4', grade:'5학년', phone:'010-1122-3344', parentPhone:'010-2233-4455', birthDate:'2013-08-17', registeredDate:'2020-03-01', memo:'', active:true },
  { id:10, name:'오준서', classId:'c4', grade:'6학년', phone:'010-3344-5566', parentPhone:'010-4455-6677', birthDate:'2012-12-03', registeredDate:'2019-03-03', memo:'반장', active:true },
  { id:11, name:'신예린', classId:'c4', grade:'4학년', phone:'010-5566-7788', parentPhone:'010-6677-8899', birthDate:'2014-05-19', registeredDate:'2021-01-10', memo:'', active:true },
  { id:12, name:'배지훈', classId:'c5', grade:'중1',   phone:'010-7788-9900', parentPhone:'010-8899-0011', birthDate:'2011-07-08', registeredDate:'2023-03-05', memo:'', active:true },
  { id:13, name:'조수아', classId:'c5', grade:'중2',   phone:'010-9900-1122', parentPhone:'010-0011-2233', birthDate:'2010-03-24', registeredDate:'2022-03-06', memo:'찬양팀 드럼', active:true },
  { id:14, name:'류민서', classId:'c5', grade:'중3',   phone:'010-1122-3344', parentPhone:'010-2233-4455', birthDate:'2009-10-12', registeredDate:'2021-03-07', memo:'', active:true },
  { id:15, name:'나현우', classId:'c5', grade:'중1',   phone:'010-3344-5566', parentPhone:'010-4455-6677', birthDate:'2011-01-29', registeredDate:'2023-01-08', memo:'', active:true },
  { id:16, name:'마은지', classId:'c6', grade:'고1',   phone:'010-5566-7788', parentPhone:'010-6677-8899', birthDate:'2008-06-14', registeredDate:'2022-03-06', memo:'예배 준비 봉사', active:true },
  { id:17, name:'서태양', classId:'c6', grade:'고2',   phone:'010-7788-9900', parentPhone:'010-8899-0011', birthDate:'2007-09-05', registeredDate:'2021-03-07', memo:'', active:true },
  { id:18, name:'권나영', classId:'c6', grade:'고3',   phone:'010-9900-1122', parentPhone:'010-0011-2233', birthDate:'2006-04-20', registeredDate:'2020-03-01', memo:'수험생', active:true },
  { id:19, name:'문지원', classId:'c6', grade:'고1',   phone:'010-1234-5670', parentPhone:'010-2345-6780', birthDate:'2008-11-30', registeredDate:'2023-03-05', memo:'', active:true },
  { id:20, name:'이준혁', classId:'c7', grade:'대학생',phone:'010-2222-3333', parentPhone:'',              birthDate:'2003-05-12', registeredDate:'2022-03-06', memo:'', active:true },
  { id:21, name:'박수연', classId:'c7', grade:'청년',  phone:'010-3333-4444', parentPhone:'',              birthDate:'2001-08-25', registeredDate:'2021-01-10', memo:'찬양팀', active:true },
];
const INITIAL_TEACHERS = [
  { id:1, name:'이지은', classId:'c2', phone:'010-1111-2222', email:'jieun@church.com',   memo:'10년 경력' },
  { id:2, name:'박성민', classId:'c3', phone:'010-2222-3333', email:'sungmin@church.com', memo:'' },
  { id:3, name:'김하늘', classId:'c4', phone:'010-3333-4444', email:'haneul@church.com',  memo:'음악 전공' },
  { id:4, name:'정다운', classId:'c5', phone:'010-4444-5555', email:'dawoon@church.com',  memo:'' },
  { id:5, name:'최예진', classId:'c6', phone:'010-5555-6666', email:'yejin@church.com',   memo:'' },
];
const INITIAL_MEETINGS = [
  { id:1, title:'6월 교사 회의록',        date:'2026-06-01', uploader:'이지은', category:'회의록',   content:'· 여름성경학교 준비\n· 출석률 개선 방안' },
  { id:2, title:'상반기 교육 계획서',      date:'2026-01-05', uploader:'박성민', category:'교육자료', content:'상반기 교육 목표 및 커리큘럼' },
  { id:3, title:'여름성경학교 안내문',     date:'2026-05-20', uploader:'김하늘', category:'공지',     content:'일정: 8월 3~5일 / 장소: 교육관' },
];
const INITIAL_PHOTOS = [
  { id:1, album:'2026 어린이날', sectionId:'s2', date:'2026-05-05', caption:'어린이날 행사', src:'' },
  { id:2, album:'부활절 예배',   sectionId:'all',date:'2026-04-20', caption:'부활절 연합 예배', src:'' },
  { id:3, album:'영유치부 봄 소풍',sectionId:'s1',date:'2026-04-10', caption:'봄 소풍', src:'' },
];
const INITIAL_PRAYERS = [
  { id:1, title:'여름성경학교를 위해', content:'이번 여름성경학교가 은혜롭게 진행되도록 기도해주세요.', author:'이지은', date:'2026-06-10', answered:false },
  { id:2, title:'수험생 권나영 자매', content:'수능을 준비하는 권나영 자매를 위해 기도 부탁드립니다.', author:'최예진', date:'2026-06-15', answered:false },
];

function genAttendance() {
  const r = {}; const now = new Date();
  for (let w=0;w<12;w++) {
    const d=new Date(now); d.setDate(d.getDate()-d.getDay()-w*7);
    const ds=d.toISOString().split('T')[0]; r[ds]={};
    INITIAL_STUDENTS.forEach(s=>{ const x=Math.random(); r[ds][s.id]=x>0.15?'출석':x>0.08?'결석':x>0.04?'조퇴':'공결'; });
  }
  return r;
}

// ── 유틸 ─────────────────────────────────────────────────
function useLocalState(key,init){
  const [v,setV]=useState(()=>{ try{const s=localStorage.getItem(key);return s?JSON.parse(s):(typeof init==='function'?init():init);}catch{return typeof init==='function'?init():init;} });
  useEffect(()=>{ try{localStorage.setItem(key,JSON.stringify(v));}catch{} },[key,v]);
  return [v,setV];
}
function useLS(key,init){
  const [v,setV]=useState(()=>{ try{const s=localStorage.getItem(key);return s?JSON.parse(s):(typeof init==='function'?init():init);}catch{return typeof init==='function'?init():init;} });
  const remoteReady=useRef(false);
  const initialRef=useRef(v);
  const currentRef=useRef(v);
  useEffect(()=>{ currentRef.current=v; },[v]);

  useEffect(()=>{
    let alive=true;
    fetchSharedState(key).then(remote=>{
      if(!alive)return;
      if(remote!==null){
        if(currentRef.current===initialRef.current){ setV(remote); }
        else { pushSharedState(key,currentRef.current); }
      } else { pushSharedState(key,currentRef.current); }
      remoteReady.current=true;
    });
    return ()=>{ alive=false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[key]);

  useEffect(()=>{
    try{localStorage.setItem(key,JSON.stringify(v));}catch{}
    if(!remoteReady.current)return;
    const t=setTimeout(()=>pushSharedState(key,v),500);
    return ()=>clearTimeout(t);
  },[key,v]);

  return [v,setV];
}
const todayStr=()=>new Date().toISOString().split('T')[0];
const fmt=d=>d?d.replace(/-/g,'.'):''  ;
function getDUB(bd){ if(!bd)return null; const now=new Date(),[,m,day]=bd.split('-').map(Number),next=new Date(now.getFullYear(),m-1,day); if(next<now)next.setFullYear(now.getFullYear()+1); const diff=Math.ceil((next-now)/86400000); return diff===365?0:diff; }
const getWeekRange=()=>{ const today=new Date(); today.setHours(0,0,0,0); const sun=new Date(today); sun.setDate(today.getDate()-today.getDay()); const sat=new Date(sun); sat.setDate(sun.getDate()+6); return {sun,sat}; };
const isThisWeek=bd=>{
  if(!bd)return false;
  const {sun,sat}=getWeekRange();
  const [,m,day]=bd.split('-').map(Number);
  return [sun.getFullYear(),sat.getFullYear()].some(y=>{ const c=new Date(y,m-1,day); return c>=sun&&c<=sat; });
};
const getWeekDiff=bd=>{
  if(!bd)return null;
  const {sun,sat}=getWeekRange();
  const [,m,day]=bd.split('-').map(Number);
  const today=new Date(); today.setHours(0,0,0,0);
  for(const y of [sun.getFullYear(),sat.getFullYear()]){ const c=new Date(y,m-1,day); if(c>=sun&&c<=sat) return Math.round((c-today)/86400000); }
  return null;
};
const isThisMonth=bd=>{ if(!bd)return false;return parseInt(bd.split('-')[1])===new Date().getMonth()+1; };
const getAge=bd=>{ if(!bd)return '';return new Date().getFullYear()-parseInt(bd.split('-')[0])+'세'; };
const getBMMDD=bd=>{ if(!bd)return '';const[,m,d]=bd.split('-');return `${m}월 ${d}일`; };
const nextId=arr=>arr.length?Math.max(...arr.map(x=>x.id))+1:1;
const SECTION_COLOR_HEX={rose:'#dc2626',amber:'#d97706',teal:'#0d9488',indigo:'#6366f1',purple:'#9333ea'};
const sectionColorOf=(sections,sectionId)=>{
  const sec=sections?.find(s=>s.id===sectionId);
  return SECTION_COLOR_HEX[sec?.color]||'#b8934a';
};
const fmtWeekDiff=d=>d===0?'오늘!🥳':d>0?`D-${d}`:`${-d}일 전`;

// ── 공통 컴포넌트 ─────────────────────────────────────────
const Modal=({title,onClose,children,wide=false})=>(
  <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center" style={{background:'rgba(0,0,0,0.6)'}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className={`bg-white w-full ${wide?'sm:max-w-2xl':'sm:max-w-md'} rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
      <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-3xl sm:rounded-t-2xl">
        <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">✕</button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const GoldBtn=({children,onClick,cls='',outline=false})=>(
  <button onClick={onClick} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-95 ${outline?'border-2 border-[#b8934a] text-[#b8934a] hover:bg-[#b8934a] hover:text-white':'bg-[#b8934a] hover:bg-[#a07c35] text-white shadow-md'} ${cls}`}>{children}</button>
);
const ForestBtn=({children,onClick,cls=''})=>(
  <button onClick={onClick} className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-[#3d6b4f] hover:bg-[#2d5240] text-white shadow-md transition-all active:scale-95 ${cls}`}>{children}</button>
);
const Inp=({label,value,onChange,type='text',placeholder='',required=false})=>(
  <div className="flex flex-col gap-1">
    {label&&<label className="text-sm font-medium text-gray-700">{label}{required&&<span className="text-red-400 ml-0.5">*</span>}</label>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#b8934a] focus:ring-2 focus:ring-[#b8934a]/20 outline-none transition-all"/>
  </div>
);
const Sel=({label,value,onChange,options})=>(
  <div className="flex flex-col gap-1">
    {label&&<label className="text-sm font-medium text-gray-700">{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#b8934a] bg-white">
    {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
</div>
);


const MiniCalendar=({events,sections})=>{
  const today=new Date();
  const [viewYear,setViewYear]=useState(today.getFullYear());
  const [viewMonth,setViewMonth]=useState(today.getMonth());
  const year=viewYear,month=viewMonth;
  const first=new Date(year,month,1);
  const startDow=first.getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const goPrev=()=>{ if(month===0){setViewYear(y=>y-1);setViewMonth(11);} else setViewMonth(m=>m-1); };
  const goNext=()=>{ if(month===11){setViewYear(y=>y+1);setViewMonth(0);} else setViewMonth(m=>m+1); };
  const goToday=()=>{ setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };
  const eventsByDay={};
  (events||[]).forEach(e=>{
    const d=new Date(e.date+'T00:00:00');
    if(d.getFullYear()===year&&d.getMonth()===month){
      const day=d.getDate();
      (eventsByDay[day]=eventsByDay[day]||[]).push(e);
    }
  });
  const cells=[];
  for(let i=0;i<startDow;i++)cells.push(null);
  for(let d=1;d<=daysInMonth;d++)cells.push(d);
  return (
    <div className="bg-[#faf7f2] rounded-2xl p-3">
      <div className="flex items-center justify-between mb-3">
        <button onClick={goPrev} className="w-7 h-7 rounded-full hover:bg-black/5 text-gray-500 flex items-center justify-center">‹</button>
        <button onClick={goToday} className="font-bold text-gray-900 text-sm hover:text-[#b8934a] transition-colors">{year}년 {month+1}월</button>
        <button onClick={goNext} className="w-7 h-7 rounded-full hover:bg-black/5 text-gray-500 flex items-center justify-center">›</button>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] text-gray-400 mb-1">
        {['일','월','화','수','목','금','토'].map(d=><span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-[2px]">
        {cells.map((d,i)=>{
          const isToday=d===today.getDate()&&year===today.getFullYear()&&month===today.getMonth();
          const dayEvents=d?(eventsByDay[d]||[]):[];
          return (
            <div key={i} className="min-h-[44px] rounded-md p-0.5">
              {d&&<span className={`text-[13px] inline-flex items-center justify-center w-5 h-5 rounded-full ${isToday?'bg-[#1a1a1a] text-white font-bold':'text-gray-700'}`}>{d}</span>}
              <div className="space-y-0.5 mt-0.5">
                {dayEvents.slice(0,2).map(e=>(
                  <div key={e.id} className="flex items-center gap-0.5 text-[8px] leading-tight truncate" style={{color:sectionColorOf(sections,e.sectionId)}}>
                    <span className="w-1 h-1 rounded-full flex-shrink-0" style={{background:sectionColorOf(sections,e.sectionId)}}/>
                    <span className="truncate">{e.title}</span>
                  </div>
                ))}
                {dayEvents.length>2&&<p className="text-[8px] text-gray-400">+{dayEvents.length-2}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── 공개 홈페이지 ─────────────────────────────────────────
const Homepage=({site,sections,classes,students,photos,prayers,events,onOpenManage,authUser,onRequestDownload,onRequestLogin})=>{
  const [scrolled,setScrolled]=useState(false);
  const [activeSec,setActiveSec]=useState(null); // null = 전체
  const [mobileMenu,setMobileMenu]=useState(false);
  const [showPrayerForm,setShowPrayerForm]=useState(false);
  const [lb,setLb]=useState(null);
  const [secDetail,setSecDetail]=useState(null);

  const downloadPhoto=p=>{
    if(!p?.src)return;
    onRequestDownload(p);
  };

  useEffect(()=>{
    const fn=()=>setScrolled(window.scrollY>60);
    window.addEventListener('scroll',fn);
    return ()=>window.removeEventListener('scroll',fn);
  },[]);

  const active=students.filter(s=>s.active);
  const weekBdays=active.filter(s=>isThisWeek(s.birthDate)).sort((a,b)=>getWeekDiff(a.birthDate)-getWeekDiff(b.birthDate));
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
    {label:'행사안내',href:'#events'},
    {label:'갤러리',href:'#gallery'},
    {label:'기도제목',href:'#prayers'},
  ];

  const scrollTo=id=>{ document.getElementById(id)?.scrollIntoView({behavior:'smooth'}); setMobileMenu(false); };

  const visiblePhotos = photos.filter(p=>p.visibility!=='member'||authUser);
  const filteredPhotos = activeSec ? visiblePhotos.filter(p=>p.sectionId===activeSec||p.sectionId==='all') : visiblePhotos;
  const byAlbum={}; filteredPhotos.forEach(p=>{ if(!byAlbum[p.album])byAlbum[p.album]=[]; byAlbum[p.album].push(p); });

  const heroTc = site.heroTextColor || '#ffffff';
  const heroOv = Math.max(20, site.heroOverlay != null ? site.heroOverlay : 30) / 100;
  const heroShadow = '0 1px 2px rgba(0,0,0,0.85), 0 4px 16px rgba(0,0,0,0.55)';

  return (
    <div className="font-serif">
      {/* ── 고정 네비게이션 ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled?'bg-white/95 backdrop-blur-md shadow-sm':'bg-black/20 backdrop-blur-sm'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center h-16 gap-8">
          <div className="flex items-center gap-3 flex-1">
            <span className={`text-2xl ${scrolled?'text-[#1a1a1a]':'text-white'}`}>✝</span>
            <span className={`font-bold text-lg tracking-wide ${scrolled?'text-[#1a1a1a]':'text-white'}`}>{site.churchName}</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(l=>(
              <button key={l.href} onClick={()=>scrollTo(l.href.slice(1))}
                className={`text-sm font-medium tracking-wide transition-colors ${scrolled?'text-gray-600 hover:text-[#b8934a]':'text-white/80 hover:text-white'}`}>{l.label}</button>
            ))}
          </div>
          <button onClick={onOpenManage}
            className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${scrolled?'bg-[#3d6b4f] text-white hover:bg-[#2d5240]':'bg-white/15 border border-white/30 text-white hover:bg-white/25'}`}>
            {authUser?(authUser.role==='teacher'?'⚙️ 교사 모드':`👋 ${authUser.name}`):'🔐 로그인'}
          </button>
          <button onClick={()=>setMobileMenu(v=>!v)} className={`md:hidden ${scrolled?'text-gray-700':'text-white'} text-xl`}>☰</button>
        </div>
        {/* 모바일 메뉴 */}
        {mobileMenu&&(
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
            {navLinks.map(l=>(
              <button key={l.href} onClick={()=>scrollTo(l.href.slice(1))} className="block w-full text-left text-gray-700 py-2 font-medium">{l.label}</button>
            ))}
            <button onClick={onOpenManage} className="w-full py-2.5 bg-[#3d6b4f] text-white rounded-xl font-semibold">{authUser?(authUser.role==='teacher'?'⚙️ 교사 모드':`👋 ${authUser.name}`):'🔐 로그인'}</button>
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
          <h1 className="text-4xl md:text-6xl font-semibold leading-tight mb-6 font-jua" style={{textShadow:heroShadow}}>
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
                const cnt=students.filter(s=>classes.find(c=>c.id===s.classId)?.sectionId===sec.id&&s.active).length;
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
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 font-jua">부서 안내</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sections.map(sec=>{
              const secClasses=classes.filter(c=>c.sectionId===sec.id);
              const cnt=students.filter(s=>secClasses.some(c=>c.id===s.classId)&&s.active).length;
              const th=secTheme[sec.color]||secTheme.teal;
              return (
                <div key={sec.id} onClick={()=>setSecDetail(sec)} className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100">
                  <div className="h-36 flex items-center justify-center text-6xl relative overflow-hidden" style={sec.bannerImage?{}:{background:`linear-gradient(${sec.gradient})`}}>
                    {sec.bannerImage?(
                      <img src={sec.bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover"/>
                    ):(
                      <>
                        <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.3) 1px,transparent 1px)',backgroundSize:'20px 20px'}}/>
                        <span className="relative">{sec.emoji}</span>
                      </>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1 font-jua">{sec.name}</h3>
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

      {secDetail&&(()=>{
        const secClasses=classes.filter(c=>c.sectionId===secDetail.id);
        const cnt=students.filter(s=>secClasses.some(c=>c.id===s.classId)&&s.active).length;
        const rows=[
          {l:'예배시간',v:secDetail.serviceTime,icon:'🕊️'},
          {l:'담당 교역자',v:secDetail.pastor,icon:'🙏'},
          {l:'이번 주 주제',v:secDetail.theme,icon:'💬'},
          {l:'말씀',v:secDetail.verse,icon:'📖'},
        ].filter(r=>r.v);
        return (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e=>{if(e.target===e.currentTarget)setSecDetail(null);}}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[85vh] overflow-y-auto">
              <div className="h-28 flex items-center justify-center text-5xl relative overflow-hidden" style={secDetail.bannerImage?{}:{background:`linear-gradient(${secDetail.gradient})`}}>
                {secDetail.bannerImage&&<img src={secDetail.bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover"/>}
                <button onClick={()=>setSecDetail(null)} className="absolute top-3 right-3 text-white/90 hover:text-white text-xl drop-shadow z-10">✕</button>
                {!secDetail.bannerImage&&<span>{secDetail.emoji}</span>}
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-xl font-jua">{secDetail.name}</h3>
                  <p className="text-gray-500 text-sm mt-1 leading-relaxed">{secDetail.desc}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">{secClasses.map(c=><span key={c.id} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{c.name}</span>)}</div>
                  <span className="text-xs text-gray-400 font-medium">{cnt}명</span>
                </div>
                {rows.length>0&&(
                  <div className="space-y-2 border-t border-gray-100 pt-4">
                    {rows.map(r=>(
                      <div key={r.l} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-20 text-gray-400">{r.icon} {r.l}</span>
                        <span className="text-gray-700 font-medium">{r.v}</span>
                      </div>
                    ))}
                  </div>
                )}
                {secDetail.notice&&(
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-sm text-amber-800">
                    📢 {secDetail.notice}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── 다가오는 행사 ── */}
      {events&&events.length>0&&(
        <section id="events" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-10">
              <p className="text-[#b8934a] text-xs tracking-[0.3em] uppercase mb-3 font-sans">EVENTS</p>
              <h2 className="text-3xl font-bold text-gray-900 font-jua">다가오는 행사</h2>
            </div>
            <div className="grid md:grid-cols-[3fr_2fr] gap-6 items-start">
              <MiniCalendar events={events} sections={sections}/>
              <div className="space-y-2.5">
                {events.filter(e=>e.date>=todayStr()).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6).map(e=>(
                  <div key={e.id} className="flex items-center gap-3 bg-[#faf7f2] rounded-xl p-3">
                    <div className="w-11 h-11 rounded-lg text-white flex flex-col items-center justify-center flex-shrink-0" style={{background:sectionColorOf(sections,e.sectionId)}}>
                      <span className="text-[9px] leading-none opacity-80">{e.date.slice(5,7)}월</span>
                      <span className="text-base font-bold leading-none">{e.date.slice(8,10)}</span>
                    </div>
                    <div className="flex-1 min-w-0"><p className="font-bold text-gray-900 text-sm truncate">{e.title}</p>{e.desc&&<p className="text-xs text-gray-500 mt-0.5 truncate">{e.desc}</p>}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

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
                        <p className="text-lg font-bold text-[#b8934a]">{fmtWeekDiff(getWeekDiff(s.birthDate))}</p>
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
              <div key={p.id} onClick={()=>setLb(p)} className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group cursor-pointer hover:shadow-lg transition-all relative">
                {p.src?<img src={p.src} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>:(
                  <div className="text-center">
                    <div className="text-4xl mb-1">{EMOJIS[i%EMOJIS.length]}</div>
                    <p className="text-xs text-gray-500 px-2">{p.caption}</p>
                  </div>
                )}
                {p.src&&<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-end p-2 opacity-0 group-hover:opacity-100"><span className="text-white text-xs bg-black/50 rounded-full px-2 py-1">⬇ 크게보기</span></div>}
              </div>
            ))}
          </div>
          {filteredPhotos.length===0&&authUser&&<p className="text-center text-gray-400 py-12">사진이 없습니다.</p>}
          {!authUser&&(
            <div className="text-center py-12">
              <p className="text-gray-400 mb-3">🔒 로그인 후 볼 수 있는 사진이 있습니다.</p>
              <button onClick={onRequestLogin} className="px-5 py-2.5 bg-[#1a1a1a] text-white rounded-full text-sm font-semibold hover:bg-[#333] transition-all">로그인 / 회원가입</button>
            </div>
          )}
        </div>
      </section>

      {lb&&(
        <div className="fixed inset-0 bg-black/85 z-[300] flex flex-col items-center justify-center p-4" onClick={()=>setLb(null)}>
          <button className="absolute top-4 right-4 text-white text-2xl" onClick={()=>setLb(null)}>✕</button>
          {lb.src?<img src={lb.src} alt="" className="max-w-full max-h-[70vh] rounded-xl object-contain" onClick={e=>e.stopPropagation()}/>:<div className="w-48 h-48 bg-gray-800 rounded-xl flex items-center justify-center text-5xl">🖼️</div>}
          {lb.caption&&<p className="text-white mt-3 text-sm">{lb.caption}</p>}
          {lb.src&&(
            <button onClick={e=>{e.stopPropagation();downloadPhoto(lb);}} className="mt-4 px-5 py-2.5 bg-white text-[#1a1a1a] rounded-full text-sm font-semibold hover:bg-gray-100 transition-all">
              {authUser?'⬇ 사진 다운로드':'🔒 로그인 후 다운로드'}
            </button>
          )}
        </div>
      )}

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
            <button onClick={onOpenManage} className="px-5 py-2 rounded-full border border-[#b8934a] text-[#b8934a] text-sm font-medium hover:bg-[#b8934a] hover:text-white transition-all">{authUser?(authUser.role==='teacher'?'교사 모드':authUser.name):'로그인'}</button>
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
          <button onClick={()=>{mergeArrayWrite('prayers_v3',setPrayers,p=>[...p,{...form,id:nextId(p)}]);onClose();}}
            className="flex-1 py-2.5 rounded-xl bg-[#3d6b4f] text-white text-sm font-medium hover:bg-[#2d5240]">등록</button>
        </div>
      </div>
    </Modal>
  );
};

// ── 교사 관리 패널 (슬라이드 드로어) ─────────────────────
const ManagePanel=({onClose,authUser,onLogout,onWithdraw,site,setSite,sections,setSections,classes,setClasses,students,setStudents,teachers,setTeachers,attendance,setAttendance,meetings,setMeetings,events,setEvents,photos,setPhotos,prayers,setPrayers,accounts,setAccounts})=>{
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
    {id:'events',l:'행사',e:'📅'},
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
              <button onClick={onWithdraw} className="text-red-300/60 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-300/20 hover:border-red-300/40 transition-all">회원탈퇴</button>
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
            {page==='meetings'&&<MPMeetings meetings={meetings} setMeetings={setMeetings} sections={sections}/>}
            {page==='events'&&<MPEvents events={events} setEvents={setEvents} sections={sections}/>}
            {page==='photos'&&<MPPhotos photos={photos} setPhotos={setPhotos} sections={sections}/>}
            {page==='prayers'&&<MPPrayers prayers={prayers} setPrayers={setPrayers}/>}
            {page==='admin'&&<MPAdmin site={site} setSite={setSite} sections={sections} setSections={setSections} classes={classes} setClasses={setClasses} teachers={teachers} students={students} accounts={accounts} setAccounts={setAccounts}/>}
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
  const weekBdays=active.filter(s=>isThisWeek(s.birthDate)).sort((a,b)=>getWeekDiff(a.birthDate)-getWeekDiff(b.birthDate));
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
                <span className="text-sm font-bold text-pink-600">{fmtWeekDiff(getWeekDiff(s.birthDate))}</span>
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

  // 같은 날짜라도 다른 반/학생을 동시에 체크하는 다른 교사의 변경이 덮어써지지 않도록,
  // 저장 시 서버의 최신 출석 데이터를 받아와 이번 변경분만 병합해서 다시 올린다.
  const commitAttendance=async(date,updater)=>{
    setAttendance(p=>({...p,[date]:updater(p[date]||{})}));
    try{
      const remote=await fetchSharedState('attendance_v3');
      const base=remote||{};
      const merged={...base,[date]:updater(base[date]||{})};
      setAttendance(merged);
      await pushSharedState('attendance_v3',merged);
    }catch(e){ console.warn('attendance sync failed',e); }
  };
  const toggle=id=>{commitAttendance(selDate,day=>({...day,[id]:CYCLE[day[id]||'출석']}));setSaved(false);};
  const setAll=st=>{commitAttendance(selDate,day=>{const nr={...day};clsSts.forEach(s=>nr[s.id]=st);return nr;});setSaved(false);};
  const counts={출석:0,결석:0,조퇴:0,공결:0,미입력:0};
  clsSts.forEach(s=>{const st=recs[s.id];st?counts[st]++:counts['미입력']++;});
  const cls=classes.find(c=>c.id===selCls);
  const sec=sections.find(s=>s.id===cls?.sectionId);

  const exportAttendance=()=>{
    const rows=[];
    Object.entries(attendance).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([date,recs])=>{
      Object.entries(recs).forEach(([sid,status])=>{
        const st=students.find(s=>s.id===Number(sid)||s.id===sid);
        if(!st)return;
        const c=classes.find(c=>c.id===st.classId);
        const sc=sections.find(se=>se.id===c?.sectionId);
        rows.push({날짜:date,부서:sc?.name||'',반:c?.name||'',이름:st.name,상태:status});
      });
    });
    if(!rows.length)return alert('내보낼 출석 기록이 없습니다.');
    exportXLSX(rows,`출석체크_${todayStr()}.xlsx`,'출석체크');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="font-bold text-gray-900 text-lg">출석체크</h2><div className="flex gap-2"><button onClick={()=>{if(confirm('모든 출석 기록을 초기화할까요? 되돌릴 수 없습니다.'))setAttendance({});}} className="px-3 py-1.5 border border-red-200 text-red-500 rounded-xl text-xs font-medium hover:bg-red-50">전체 초기화</button><button onClick={exportAttendance} className="px-3 py-1.5 bg-[#3d6b4f] text-white rounded-xl text-xs font-medium hover:bg-[#2d5240]">⬇ 엑셀 다운로드</button></div></div>
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
  const [photoLb,setPhotoLb]=useState('');

  const filtered=useMemo(()=>students.filter(s=>{
    const cls=classes.find(c=>c.id===s.classId);
    const sec=cls?sections.find(se=>se.id===cls.sectionId):null;
    return (fSec==='전체'||sec?.name===fSec)&&(!search||s.name.includes(search));
  }),[students,search,fSec,classes,sections]);

  const StForm=({initial,onSave,onClose})=>{
    const e={name:'',classId:classes[0]?.id||'',grade:'',gender:'',phone:'',parentPhone:'',birthDate:'',address:'',registeredDate:todayStr(),memo:'',active:true,photo:''};
    const [form,setForm]=useState(initial||e);
    const set=(k,v)=>setForm(f=>({...f,[k]:v}));
    const handlePhoto=async ev=>{const file=ev.target.files[0];if(!file)return;try{set('photo',await resizeImage(file,600,0.8));}catch{alert('사진을 처리하지 못했습니다.');}};
    return <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center text-white text-xl font-bold" style={{background:'linear-gradient(135deg,#b8934a,#d4aa6e)'}}>{form.photo?<img src={form.photo} alt="" className="w-full h-full object-cover"/>:(form.name?.[0]||'?')}</div>
        <div className="flex-1">
          <label className="text-sm font-medium text-gray-700 block mb-1">사진</label>
          <input type="file" accept="image/*" onChange={handlePhoto} className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700"/>
        </div>
        {form.photo&&<button onClick={()=>set('photo','')} className="text-xs text-red-400 hover:underline flex-shrink-0">제거</button>}
      </div>
      <div className="grid grid-cols-2 gap-3"><Inp label="이름" value={form.name} onChange={v=>set('name',v)} required/><Sel label="반" value={form.classId} onChange={v=>set('classId',v)} options={classes.map(c=>({value:c.id,label:c.name}))}/></div>
      <div className="grid grid-cols-3 gap-3"><Inp label="학년" value={form.grade} onChange={v=>set('grade',v)}/><Sel label="성별" value={form.gender} onChange={v=>set('gender',v)} options={[{value:'',label:'선택 안 함'},{value:'남',label:'남'},{value:'여',label:'여'}]}/><Inp label="생년월일" type="date" value={form.birthDate} onChange={v=>set('birthDate',v)}/></div>
      <Inp label="학생 연락처" value={form.phone} onChange={v=>set('phone',v)}/>
      <Inp label="부모님 연락처" value={form.parentPhone} onChange={v=>set('parentPhone',v)}/>
      <Inp label="주소" value={form.address} onChange={v=>set('address',v)} placeholder="예: 서울시 강남구 ..."/>
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
      <div className="flex items-center gap-4"><div onClick={s.photo?()=>setPhotoLb(s.photo):undefined} className={`w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 ${s.photo?'cursor-zoom-in':''}`} style={{background:'linear-gradient(135deg,#b8934a,#d4aa6e)'}}>{s.photo?<img src={s.photo} alt="" className="w-full h-full object-cover"/>:s.name[0]}</div>
      <div><div className="flex items-center gap-2"><h2 className="text-lg font-bold">{s.name}{isThisWeek(s.birthDate)&&' 🎂'}</h2>{!s.active&&<span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">제적</span>}</div><p className="text-sm text-gray-500">{sec?.name} · {cls?.name} · {s.grade}</p></div></div>
      <div className="grid grid-cols-2 gap-2 text-sm">{s.gender&&<div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">성별</p><p className="font-medium">{s.gender}</p></div>}{s.birthDate&&<div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">생년월일</p><p className="font-medium">{fmt(s.birthDate)} ({getAge(s.birthDate)})</p></div>}<div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">등록일</p><p className="font-medium">{fmt(s.registeredDate)}</p></div>{s.phone&&<div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">학생</p><p className="font-medium">{s.phone}</p></div>}{s.parentPhone&&<div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">부모님</p><p className="font-medium">{s.parentPhone}</p></div>}</div>
      {s.address&&<div className="space-y-2">
        <div className="bg-gray-50 rounded-xl p-3 text-sm"><p className="text-xs text-gray-400 mb-1">주소</p><p className="font-medium">{s.address}</p></div>
        <iframe title="지도" className="w-full h-40 rounded-xl border border-gray-100" loading="lazy" src={`https://www.google.com/maps?q=${encodeURIComponent(s.address)}&output=embed`}/>
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}`} target="_blank" rel="noreferrer" className="block text-center text-xs text-[#b8934a] hover:underline">Google 지도에서 크게 보기 ↗</a>
      </div>}
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

  const exportStudents=()=>{
    if(!students.length)return alert('내보낼 학생이 없습니다.');
    const rows=students.map(s=>{
      const c=classes.find(c=>c.id===s.classId);
      const sc=sections.find(se=>se.id===c?.sectionId);
      return {이름:s.name,부서:sc?.name||'',반:c?.name||'',학년:s.grade||'',성별:s.gender||'',생년월일:s.birthDate||'',학생연락처:s.phone||'',부모님연락처:s.parentPhone||'',주소:s.address||'',등록일:s.registeredDate||'',재적여부:s.active?'재적':'제적',메모:s.memo||''};
    });
    exportXLSX(rows,`교적부_${todayStr()}.xlsx`,'교적부');
  };

  const importStudents=async e=>{
    const file=e.target.files[0];e.target.value='';
    if(!file)return;
    try{
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:'array'});
      const rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      if(!rows.length)return alert('읽을 데이터가 없습니다. (이름, 반, 학년, 성별, 생년월일, 학생연락처, 부모님연락처, 주소, 메모 컬럼을 인식합니다)');
      const newStudents=rows.map(r=>{
        const clsName=String(r['반']||'').trim();
        const cls=classes.find(c=>c.name===clsName);
        return {
          name:String(r['이름']||'').trim(),
          classId:cls?.id||classes[0]?.id||'',
          grade:String(r['학년']||''),
          gender:String(r['성별']||''),
          birthDate:r['생년월일']?String(r['생년월일']):'',
          phone:String(r['학생연락처']||''),
          parentPhone:String(r['부모님연락처']||''),
          address:String(r['주소']||''),
          registeredDate:r['등록일']?String(r['등록일']):todayStr(),
          active:String(r['재적여부']||'재적')!=='제적',
          memo:String(r['메모']||''),
        };
      }).filter(s=>s.name);
      if(!newStudents.length)return alert('"이름" 컬럼이 있는 행이 없습니다.');
      if(!confirm(`${newStudents.length}명을 교적부에 추가할까요?`))return;
      mergeArrayWrite('students_v3',setStudents,p=>{
        let nid=nextId(p);
        return [...p,...newStudents.map(s=>({...s,id:nid++}))];
      });
      alert(`${newStudents.length}명이 추가되었습니다.`);
    }catch(err){ alert('엑셀 파일을 읽지 못했습니다. 형식을 확인해주세요.'); console.warn(err); }
  };

  return <div className="space-y-4">
    <div className="flex items-center justify-between"><h2 className="font-bold text-gray-900 text-lg">교적부</h2><div className="flex gap-2">
      <label className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 cursor-pointer">⬆ 엑셀 업로드<input type="file" accept=".xlsx,.xls,.csv" onChange={importStudents} className="hidden"/></label>
      <button onClick={exportStudents} className="px-3 py-1.5 bg-[#3d6b4f] text-white rounded-xl text-sm font-medium hover:bg-[#2d5240]">⬇ 엑셀 다운로드</button><button onClick={()=>setShowAdd(true)} className="px-3 py-1.5 bg-[#1a1a1a] text-white rounded-xl text-sm font-medium hover:bg-[#333]">+ 학생 추가</button></div></div>
    <p className="text-xs text-gray-400">엑셀 업로드 형식: 엑셀 다운로드한 파일과 같은 컬럼(이름, 반, 학년, 성별, 생년월일, 학생연락처, 부모님연락처, 주소, 등록일, 재적여부, 메모). "반" 이름은 기존 반 이름과 정확히 일치해야 자동으로 배정됩니다.</p>
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
              <div onClick={s.photo?e=>{e.stopPropagation();setPhotoLb(s.photo);}:undefined} className={`w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${s.photo?'cursor-zoom-in':''}`} style={{background:s.active?'linear-gradient(135deg,#b8934a,#d4aa6e)':'#d1d5db'}}>{s.photo?<img src={s.photo} alt="" className="w-full h-full object-cover"/>:s.name[0]}</div>
              <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5"><span className="font-medium text-sm">{s.name}</span>{s.gender&&<span className="text-xs text-gray-400">({s.gender})</span>}{isThisWeek(s.birthDate)&&'🎂'}{!s.active&&<span className="text-xs bg-red-100 text-red-500 px-1.5 rounded-full">제적</span>}</div><p className="text-xs text-gray-400">{s.grade}{s.birthDate&&` · ${getBMMDD(s.birthDate)}`}</p></div>
              <div className="flex gap-1"><button onClick={e=>{e.stopPropagation();setEditSt(s);}} className="p-1.5 hover:bg-[#b8934a]/10 rounded-lg text-[#b8934a] text-sm">✏️</button><button onClick={e=>{e.stopPropagation();if(confirm('삭제?'))mergeArrayWrite('students_v3',setStudents,p=>p.filter(x=>x.id!==s.id));}} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 text-sm">🗑</button></div>
            </div>
          ))}
        </div>
      </div>
    ))}
    {!filtered.length&&<p className="text-center text-gray-400 py-12 text-sm">검색 결과 없음</p>}
    {showAdd&&<Modal title="학생 추가" onClose={()=>setShowAdd(false)}><StForm onSave={f=>mergeArrayWrite('students_v3',setStudents,p=>[...p,{...f,id:nextId(p)}])} onClose={()=>setShowAdd(false)}/></Modal>}
    {editSt&&<Modal title="학생 수정" onClose={()=>setEditSt(null)}><StForm initial={editSt} onSave={f=>mergeArrayWrite('students_v3',setStudents,p=>p.map(s=>s.id===f.id?f:s))} onClose={()=>setEditSt(null)}/></Modal>}
    {detailSt&&<Modal title="학생 상세" onClose={()=>setDetailSt(null)} wide><StDetail s={detailSt}/></Modal>}
    {photoLb&&<div className="fixed inset-0 bg-black/80 z-[300] flex flex-col items-center justify-center p-4" onClick={()=>setPhotoLb('')}><button className="absolute top-4 right-4 text-white text-2xl">✕</button><img src={photoLb} alt="" className="max-w-full max-h-[80vh] rounded-xl object-contain" onClick={e=>e.stopPropagation()}/></div>}
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
    <div className="bg-gray-50 rounded-2xl p-4">
      <h3 className="font-semibold text-gray-800 mb-3 text-sm">⚠️ 최근 결석이 잦은 학생</h3>
      {(()=>{
        const recentDates=Object.keys(attendance).sort((a,b)=>b.localeCompare(a)).slice(0,4);
        const atRisk=active.map(s=>{
          const recs=recentDates.map(d=>attendance[d]?.[s.id]).filter(Boolean);
          const absences=recs.filter(st=>st==='결석').length;
          return {s,absences,total:recs.length};
        }).filter(x=>x.absences>=2).sort((a,b)=>b.absences-a.absences);
        if(!atRisk.length)return <p className="text-xs text-gray-400">최근 4회 출석 기록 중 결석이 2회 이상인 학생이 없습니다.</p>;
        return <div className="space-y-1.5">{atRisk.map(({s,absences,total})=>{const cls=classes.find(c=>c.id===s.classId);return <div key={s.id} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-red-100"><span className="text-sm font-medium">{s.name} <span className="text-xs text-gray-400">{cls?.name}</span></span><span className="text-xs font-bold text-red-500">최근 {total}회 중 결석 {absences}회</span></div>;})}</div>;
      })()}
    </div>
  </div>;
};

const MPBirthday=({students,classes})=>{
  const active=students.filter(s=>s.active&&s.birthDate);
  const getCls=id=>classes.find(c=>c.id===id)?.name||'';
  const thisWeek=active.filter(s=>isThisWeek(s.birthDate)).sort((a,b)=>getWeekDiff(a.birthDate)-getWeekDiff(b.birthDate));
  const thisMonth=active.filter(s=>isThisMonth(s.birthDate)&&!isThisWeek(s.birthDate));
  const byMonth=Array.from({length:12},(_,i)=>({month:i+1,ss:active.filter(s=>parseInt(s.birthDate.split('-')[1])===i+1)})).filter(m=>m.ss.length);
  return <div className="space-y-4">
    <h2 className="font-bold text-gray-900 text-lg">🎂 생일</h2>
    {thisWeek.length>0&&<div><h3 className="text-sm font-semibold text-gray-700 mb-2">🎉 이번 주</h3><div className="space-y-2">{thisWeek.map(s=><div key={s.id} className="flex items-center gap-3 bg-pink-50 rounded-xl p-3 border border-pink-100"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 text-white flex items-center justify-center font-bold">{s.name[0]}</div><div className="flex-1"><p className="font-bold text-sm">{s.name} 🎂</p><p className="text-xs text-gray-500">{getCls(s.classId)} · {getBMMDD(s.birthDate)}</p></div><p className="font-bold text-pink-600">{fmtWeekDiff(getWeekDiff(s.birthDate))}</p></div>)}</div></div>}
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
        {secCls.map(cls=>{const ts=teachers.filter(t=>t.classId===cls.id),ss=students.filter(s=>s.classId===cls.id&&s.active);return <div key={cls.id} className="bg-gray-50 rounded-xl p-3 mb-2 border border-gray-100"><div className="flex justify-between mb-2"><span className="font-semibold text-sm">{cls.name}</span><span className="text-xs text-gray-400">학생 {ss.length}명</span></div>{ts.length===0?<p className="text-xs text-gray-400">담당 선생님 없음</p>:ts.map(t=><div key={t.id} className="flex items-center gap-3 bg-white rounded-lg p-2.5 mb-1"><div className="w-8 h-8 rounded-lg bg-[#b8934a] text-white flex items-center justify-center font-bold text-sm">{t.name[0]}</div><div className="flex-1"><p className="font-medium text-sm">{t.name}</p><p className="text-xs text-gray-400">{t.phone}</p></div><div className="flex gap-1"><button onClick={()=>setEditT(t)} className="p-1 text-[#b8934a] hover:bg-[#b8934a]/10 rounded text-sm">✏️</button><button onClick={()=>{if(confirm('삭제?'))mergeArrayWrite('teachers_v3',setTeachers,p=>p.filter(x=>x.id!==t.id));}} className="p-1 text-red-400 hover:bg-red-50 rounded text-sm">🗑</button></div></div>)}</div>;})}
      </div>;
    })}
    {showAdd&&<Modal title="선생님 추가" onClose={()=>setShowAdd(false)}><TForm onSave={f=>mergeArrayWrite('teachers_v3',setTeachers,p=>[...p,{...f,id:nextId(p)}])} onClose={()=>setShowAdd(false)}/></Modal>}
    {editT&&<Modal title="선생님 수정" onClose={()=>setEditT(null)}><TForm initial={editT} onSave={f=>mergeArrayWrite('teachers_v3',setTeachers,p=>p.map(t=>t.id===f.id?f:t))} onClose={()=>setEditT(null)}/></Modal>}
  </div>;
};

const MPMeetings=({meetings,setMeetings,sections})=>{
  const [tab,setTab]=useState('meeting'); // 'meeting' | 'lesson'
  const [showAdd,setShowAdd]=useState(false),[detail,setDetail]=useState(null),[filterSec,setFilterSec]=useState('all');
  const MEETING_CATS=['회의록','공지','교육자료','기타'];
  const getSecName=id=>sections.find(s=>s.id===id)?.name;
  const inTab=tab==='lesson'
    ? meetings.filter(m=>m.category==='공과')
    : meetings.filter(m=>m.category!=='공과');
  const sorted=(tab==='lesson'?inTab.filter(m=>filterSec==='all'||m.sectionId===filterSec):inTab).sort((a,b)=>b.date.localeCompare(a.date));
  const DocForm=({onSave,onClose})=>{
    const [f,setF]=useState({title:'',date:todayStr(),uploader:'',category:tab==='lesson'?'공과':'회의록',sectionId:'all',content:'',fileName:'',fileData:''});
    const set=(k,v)=>setF(p=>({...p,[k]:v}));
    const handleFile=e=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>setF(p=>({...p,fileName:file.name,fileData:ev.target.result}));r.readAsDataURL(file);};
    return <div className="space-y-3"><Inp label="제목" value={f.title} onChange={v=>set('title',v)} required/>
      <div className="grid grid-cols-2 gap-3">
        <Inp label="날짜" type="date" value={f.date} onChange={v=>set('date',v)}/>
        {tab==='meeting'&&<Sel label="카테고리" value={f.category} onChange={v=>set('category',v)} options={MEETING_CATS}/>}
      </div>
      {tab==='lesson'&&<Sel label="담당 부서" value={f.sectionId} onChange={v=>set('sectionId',v)} options={[{value:'all',label:'전체/공통'},...sections.map(s=>({value:s.id,label:`${s.emoji} ${s.name}`}))]}/>}
      <Inp label="작성자" value={f.uploader} onChange={v=>set('uploader',v)}/>
      <div><label className="text-sm font-medium text-gray-700 block mb-1">파일 첨부 (PDF, 문서, 이미지 등)</label><input type="file" onChange={handleFile} className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-gray-100 file:text-gray-700"/>{f.fileName&&<p className="text-xs text-green-600 mt-1">✓ {f.fileName}</p>}</div>
      <div className="flex flex-col gap-1"><label className="text-sm font-medium text-gray-700">내용 (파일 없을 때 텍스트로 기록)</label><textarea value={f.content} onChange={e=>set('content',e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm h-24 resize-none outline-none focus:border-[#b8934a]"/></div>
      <div className="flex gap-2 pt-1"><button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">취소</button><button onClick={()=>{if(!f.title)return alert('제목 입력');onSave(f);onClose();}} className="flex-1 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm">저장</button></div></div>;
  };
  const download=m=>{
    if(m.fileData){downloadDataUrl(m.fileData,m.fileName||`${m.title}`);return;}
    const b=new Blob([`${m.title}\n${m.date}\n${m.uploader}\n\n${m.content}`],{type:'text/plain;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`${m.title}.txt`;a.click();
  };
  return <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button onClick={()=>setTab('meeting')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tab==='meeting'?'bg-white shadow-sm text-gray-900':'text-gray-500'}`}>📄 회의자료</button>
        <button onClick={()=>setTab('lesson')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${tab==='lesson'?'bg-white shadow-sm text-gray-900':'text-gray-500'}`}>📖 공과</button>
      </div>
      <button onClick={()=>setShowAdd(true)} className="px-3 py-1.5 bg-[#1a1a1a] text-white rounded-xl text-sm">+ 추가</button>
    </div>
    {tab==='lesson'&&(
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={()=>setFilterSec('all')} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${filterSec==='all'?'bg-[#1a1a1a] text-white':'bg-gray-100 text-gray-600'}`}>전체</button>
        {sections.map(s=><button key={s.id} onClick={()=>setFilterSec(s.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${filterSec===s.id?'bg-[#1a1a1a] text-white':'bg-gray-100 text-gray-600'}`}>{s.emoji} {s.name}</button>)}
      </div>
    )}
    <div className="space-y-2">{sorted.map(m=><div key={m.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100 hover:shadow-sm transition-all"><div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center text-lg shadow-sm flex-shrink-0">{m.category==='공과'?'📖':'📄'}</div><div className="flex-1 min-w-0 cursor-pointer" onClick={()=>setDetail(m)}><p className="font-medium text-sm">{m.title}</p><p className="text-xs text-gray-400">{fmt(m.date)} · {m.uploader}{m.sectionId&&m.sectionId!=='all'&&getSecName(m.sectionId)?` · ${getSecName(m.sectionId)}`:''}</p></div><div className="flex items-center gap-1 flex-shrink-0">{tab==='meeting'&&<span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">{m.category}</span>}<button onClick={()=>download(m)} className="p-1.5 text-[#b8934a] hover:bg-[#b8934a]/10 rounded text-sm">⬇</button><button onClick={()=>{if(confirm('삭제?'))mergeArrayWrite('meetings_v3',setMeetings,p=>p.filter(x=>x.id!==m.id));}} className="p-1.5 text-red-400 hover:bg-red-50 rounded text-sm">🗑</button></div></div>)}</div>
    {!sorted.length&&<p className="text-center text-gray-400 py-8 text-sm">{tab==='lesson'?'등록된 공과가 없습니다.':'등록된 회의자료가 없습니다.'}</p>}
    {showAdd&&<Modal title={tab==='lesson'?'공과 추가':'회의자료 추가'} onClose={()=>setShowAdd(false)} wide><DocForm onSave={m=>mergeArrayWrite('meetings_v3',setMeetings,p=>[...p,{...m,id:nextId(p)}])} onClose={()=>setShowAdd(false)}/></Modal>}
    {detail&&<Modal title={detail.title} onClose={()=>setDetail(null)} wide><div className="space-y-3"><div className="flex gap-2 text-xs flex-wrap"><span className="text-gray-500">{fmt(detail.date)}</span><span className="text-gray-300">·</span><span className="text-gray-500">{detail.uploader}</span><span className="bg-gray-100 text-gray-600 rounded-full px-2">{detail.category}</span>{detail.sectionId&&detail.sectionId!=='all'&&getSecName(detail.sectionId)&&<span className="bg-[#b8934a]/10 text-[#b8934a] rounded-full px-2">{getSecName(detail.sectionId)}</span>}</div><div className="bg-gray-50 rounded-xl p-4 text-sm whitespace-pre-wrap min-h-20">{detail.content}</div><div className="flex gap-2"><button onClick={()=>setDetail(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">닫기</button><button onClick={()=>download(detail)} className="flex-1 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm">⬇ 다운로드</button></div></div></Modal>}
  </div>;
};

const MPEvents=({events,setEvents,sections})=>{
  const [showAdd,setShowAdd]=useState(false),[editE,setEditE]=useState(null);
  const sorted=[...events].sort((a,b)=>a.date.localeCompare(b.date));
  const upcoming=sorted.filter(e=>e.date>=todayStr());
  const past=sorted.filter(e=>e.date<todayStr()).reverse();
  const getSec=id=>sections.find(s=>s.id===id);
  const EForm=({initial,onSave,onClose})=>{
    const [f,setF]=useState(initial||{title:'',date:todayStr(),desc:'',sectionId:'all'});
    const set=(k,v)=>setF(p=>({...p,[k]:v}));
    return <div className="space-y-3"><Inp label="행사명" value={f.title} onChange={v=>set('title',v)} required/><Inp label="날짜" type="date" value={f.date} onChange={v=>set('date',v)}/>
      <Sel label="담당 부서 (색상 구분)" value={f.sectionId} onChange={v=>set('sectionId',v)} options={[{value:'all',label:'⛪ 전체/공통'},...sections.map(s=>({value:s.id,label:`${s.emoji} ${s.name}`}))]}/>
      <div className="flex flex-col gap-1"><label className="text-sm font-medium text-gray-700">설명</label><textarea value={f.desc} onChange={e=>set('desc',e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm h-20 resize-none outline-none focus:border-[#b8934a]"/></div><div className="flex gap-2 pt-1"><button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">취소</button><button onClick={()=>{if(!f.title)return alert('행사명 입력');onSave(f);onClose();}} className="flex-1 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm">{initial?'수정 완료':'등록'}</button></div></div>;
  };
  const Row=({e,faded})=>{
    const sec=getSec(e.sectionId);
    const color=sectionColorOf(sections,e.sectionId);
    return (
    <div className={`flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100 ${faded?'opacity-60':''}`}>
      <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 font-bold text-white" style={{background:color}}>
        <span className="text-[10px] leading-none opacity-80">{e.date.slice(5,7)}월</span>
        <span className="text-base leading-none">{e.date.slice(8,10)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full flex-shrink-0" style={{background:color}}/><p className="font-medium text-sm truncate">{e.title}</p></div>
        <p className="text-xs text-gray-400 mt-0.5">{sec?`${sec.emoji} ${sec.name}`:'전체/공통'}{e.desc?` · ${e.desc}`:''}</p>
      </div>
      <div className="flex gap-1.5 flex-shrink-0"><button onClick={()=>setEditE(e)} className="px-2.5 py-1.5 bg-[#b8934a]/10 text-[#b8934a] rounded-lg text-xs hover:bg-[#b8934a]/20">수정</button><button onClick={()=>{if(confirm('삭제?'))mergeArrayWrite('events_v3',setEvents,p=>p.filter(x=>x.id!==e.id));}} className="px-2.5 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs hover:bg-red-100">삭제</button></div>
    </div>
    );
  };
  return <div className="space-y-4">
    <div className="flex items-center justify-between"><h2 className="font-bold text-gray-900 text-lg">📅 행사 안내</h2><button onClick={()=>setShowAdd(true)} className="px-3 py-1.5 bg-[#1a1a1a] text-white rounded-xl text-sm">+ 행사 등록</button></div>
    <p className="text-xs text-gray-400">여기 등록한 행사는 홈페이지에 "다가오는 행사"로 표시됩니다. 담당 부서를 지정하면 그 부서 색상으로 캘린더에 표시됩니다.</p>
    <div className="space-y-2">{upcoming.map(e=><Row key={e.id} e={e}/>)}</div>
    {!upcoming.length&&<p className="text-center text-gray-400 py-6 text-sm">등록된 예정 행사가 없습니다.</p>}
    {past.length>0&&<div><p className="text-xs font-semibold text-gray-500 mb-2 mt-2">지난 행사</p><div className="space-y-2">{past.map(e=><Row key={e.id} e={e} faded/>)}</div></div>}
    {showAdd&&<Modal title="행사 등록" onClose={()=>setShowAdd(false)}><EForm onSave={f=>mergeArrayWrite('events_v3',setEvents,p=>[...p,{...f,id:nextId(p)}])} onClose={()=>setShowAdd(false)}/></Modal>}
    {editE&&<Modal title="행사 수정" onClose={()=>setEditE(null)}><EForm initial={editE} onSave={f=>mergeArrayWrite('events_v3',setEvents,p=>p.map(x=>x.id===editE.id?{...x,...f}:x))} onClose={()=>setEditE(null)}/></Modal>}
  </div>;
};

const MPPhotos=({photos,setPhotos,sections})=>{
  const [showAdd,setShowAdd]=useState(false),[selSec,setSelSec]=useState('all'),[lb,setLb]=useState(null);
  const EMOJIS=['🌸','🌿','⛅','🌟','🙏','❤️','✝️','🎉'];
  const filtered=photos.filter(p=>selSec==='all'||p.sectionId===selSec||p.sectionId==='all');
  const byAlbum={};filtered.forEach(p=>{if(!byAlbum[p.album])byAlbum[p.album]=[];byAlbum[p.album].push(p);});
  const AddForm=({onSave,onClose})=>{
    const [f,setF]=useState({album:'',sectionId:'all',date:todayStr(),caption:'',visibility:'public'}),[img,setImg]=useState('');
    const set=(k,v)=>setF(p=>({...p,[k]:v}));
    const hf=async e=>{const file=e.target.files[0];if(!file)return;try{setImg(await resizeImage(file,1000,0.8));}catch{alert('사진을 처리하지 못했습니다.');}};
    return <div className="space-y-3"><Inp label="앨범명" value={f.album} onChange={v=>set('album',v)} required/><Sel label="부서" value={f.sectionId} onChange={v=>set('sectionId',v)} options={[{value:'all',label:'전체(공통)'},...sections.map(s=>({value:s.id,label:`${s.emoji} ${s.name}`}))]}/><div className="grid grid-cols-2 gap-3"><Inp label="날짜" type="date" value={f.date} onChange={v=>set('date',v)}/><Inp label="설명" value={f.caption} onChange={v=>set('caption',v)}/></div>
      <Sel label="공개 범위" value={f.visibility} onChange={v=>set('visibility',v)} options={[{value:'public',label:'🌐 전체 공개 (누구나 볼 수 있음)'},{value:'member',label:'🔒 회원 전용 (로그인해야 보임)'}]}/>
      <div><label className="text-sm font-medium text-gray-700 block mb-1">사진</label><input type="file" accept="image/*" onChange={hf} className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-gray-100 file:text-gray-700"/></div>{img&&<img src={img} alt="" className="w-full h-36 object-cover rounded-xl"/>}<div className="flex gap-2 pt-1"><button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">취소</button><button onClick={()=>{if(!f.album)return alert('앨범명 입력');onSave({...f,src:img});onClose();}} className="flex-1 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm">저장</button></div></div>;
  };
  return <div className="space-y-4">
    <div className="flex items-center justify-between"><h2 className="font-bold text-gray-900 text-lg">사진 앨범</h2><button onClick={()=>setShowAdd(true)} className="px-3 py-1.5 bg-[#1a1a1a] text-white rounded-xl text-sm">+ 추가</button></div>
    <div className="flex gap-2 overflow-x-auto pb-1"><button onClick={()=>setSelSec('all')} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${selSec==='all'?'bg-[#1a1a1a] text-white':'bg-gray-100 text-gray-600'}`}>전체</button>{sections.map(s=><button key={s.id} onClick={()=>setSelSec(s.id)} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${selSec===s.id?'bg-[#1a1a1a] text-white':'bg-gray-100 text-gray-600'}`}>{s.emoji} {s.name}</button>)}</div>
    {Object.entries(byAlbum).map(([album,ps])=><div key={album}><p className="text-sm font-semibold text-gray-700 mb-2">{album} <span className="text-gray-400 font-normal">({ps.length}장)</span></p><div className="grid grid-cols-3 gap-2">{ps.map((p,i)=><div key={p.id} onClick={()=>setLb(p)} className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity relative">{p.src?<img src={p.src} alt="" className="w-full h-full object-cover"/>:<span className="text-3xl">{EMOJIS[i%EMOJIS.length]}</span>}{p.visibility==='member'&&<span className="absolute top-1 right-1 bg-black/60 text-white text-[10px] rounded-full px-1.5 py-0.5">🔒 회원</span>}</div>)}</div></div>)}
    {!filtered.length&&<p className="text-center text-gray-400 py-8 text-sm">사진 없음</p>}
    {showAdd&&<Modal title="사진 추가" onClose={()=>setShowAdd(false)}><AddForm onSave={p=>mergeArrayWrite('photos_v3',setPhotos,pv=>[...pv,{...p,id:nextId(pv)}])} onClose={()=>setShowAdd(false)}/></Modal>}
    {lb&&<div className="fixed inset-0 bg-black/80 z-[300] flex flex-col items-center justify-center p-4" onClick={()=>setLb(null)}><button className="absolute top-4 right-4 text-white text-2xl">✕</button>{lb.src?<img src={lb.src} alt="" className="max-w-full max-h-[70vh] rounded-xl object-contain" onClick={e=>e.stopPropagation()}/>:<div className="w-48 h-48 bg-gray-800 rounded-xl flex items-center justify-center text-5xl">🖼️</div>}{lb.caption&&<p className="text-white mt-3 text-sm">{lb.caption}</p>}<div className="flex gap-2 mt-4">{lb.src&&<button onClick={e=>{e.stopPropagation();downloadDataUrl(lb.src,`${lb.album||'photo'}.jpg`);}} className="px-5 py-2.5 bg-white text-[#1a1a1a] rounded-full text-sm font-semibold hover:bg-gray-100 transition-all">⬇ 다운로드</button>}<button onClick={e=>{e.stopPropagation();if(confirm('이 사진을 삭제할까요?')){mergeArrayWrite('photos_v3',setPhotos,pv=>pv.filter(x=>x.id!==lb.id));setLb(null);}}} className="px-5 py-2.5 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600 transition-all">🗑 삭제</button></div></div>}
  </div>;
};

const MPPrayers=({prayers,setPrayers})=>{
  const [showAdd,setShowAdd]=useState(false),[detail,setDetail]=useState(null),[editP,setEditP]=useState(null);
  const toggle=id=>mergeArrayWrite('prayers_v3',setPrayers,p=>p.map(x=>x.id===id?{...x,answered:!x.answered}:x));
  const active=prayers.filter(p=>!p.answered).sort((a,b)=>b.date.localeCompare(a.date));
  const answered=prayers.filter(p=>p.answered);
  const PForm=({initial,onSave,onClose})=>{
    const [f,setF]=useState(initial||{title:'',content:'',author:'',date:todayStr(),answered:false});
    const set=(k,v)=>setF(p=>({...p,[k]:v}));
    return <div className="space-y-3"><Inp label="제목" value={f.title} onChange={v=>set('title',v)} required/><div className="grid grid-cols-2 gap-3"><Inp label="올린이" value={f.author} onChange={v=>set('author',v)}/><Inp label="날짜" type="date" value={f.date} onChange={v=>set('date',v)}/></div><div className="flex flex-col gap-1"><label className="text-sm font-medium text-gray-700">내용 *</label><textarea value={f.content} onChange={e=>set('content',e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm h-24 resize-none outline-none focus:border-[#b8934a]"/></div><div className="flex gap-2 pt-1"><button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">취소</button><button onClick={()=>{if(!f.title||!f.content)return alert('제목과 내용 입력');onSave(f);onClose();}} className="flex-1 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm">{initial?'수정 완료':'등록'}</button></div></div>;
  };
  return <div className="space-y-4">
    <div className="flex items-center justify-between"><h2 className="font-bold text-gray-900 text-lg">🙏 기도제목</h2><button onClick={()=>setShowAdd(true)} className="px-3 py-1.5 bg-[#1a1a1a] text-white rounded-xl text-sm">+ 등록</button></div>
    <div className="space-y-2">{active.map(p=><div key={p.id} className="bg-gray-50 rounded-xl border border-gray-100"><div className="flex gap-3 p-3 cursor-pointer" onClick={()=>setDetail(p)}><div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center text-rose-500 flex-shrink-0">🙏</div><div className="flex-1 min-w-0"><p className="font-semibold text-sm">{p.title}</p><p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{p.content}</p><p className="text-xs text-gray-400 mt-1">{p.author} · {fmt(p.date)}</p></div></div><div className="flex gap-2 px-3 pb-3"><button onClick={()=>toggle(p.id)} className="flex-1 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600">응답됨 ✓</button><button onClick={e=>{e.stopPropagation();setEditP(p);}} className="px-3 py-1.5 bg-[#b8934a]/10 text-[#b8934a] rounded-lg text-xs hover:bg-[#b8934a]/20">수정</button><button onClick={()=>{if(confirm('삭제?'))mergeArrayWrite('prayers_v3',setPrayers,pr=>pr.filter(x=>x.id!==p.id));}} className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs hover:bg-red-100">삭제</button></div></div>)}</div>
    {!active.length&&<p className="text-center text-gray-400 py-6 text-sm">등록된 기도제목이 없습니다.</p>}
    {answered.length>0&&<div><p className="text-xs font-semibold text-gray-500 mb-2">응답됨 ({answered.length})</p>{answered.map(p=><div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-1 opacity-60"><span className="text-lg">✨</span><div className="flex-1"><p className="text-sm font-medium line-through text-gray-500">{p.title}</p><p className="text-xs text-gray-400">{p.author}</p></div><button onClick={()=>setEditP(p)} className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-1 rounded-lg">수정</button><button onClick={()=>toggle(p.id)} className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-1 rounded-lg">되돌리기</button></div>)}</div>}
    {showAdd&&<Modal title="기도제목 등록" onClose={()=>setShowAdd(false)} wide><PForm onSave={p=>mergeArrayWrite('prayers_v3',setPrayers,pr=>[...pr,{...p,id:nextId(pr)}])} onClose={()=>setShowAdd(false)}/></Modal>}
    {editP&&<Modal title="기도제목 수정" onClose={()=>setEditP(null)} wide><PForm initial={editP} onSave={f=>mergeArrayWrite('prayers_v3',setPrayers,pr=>pr.map(x=>x.id===editP.id?{...x,...f}:x))} onClose={()=>setEditP(null)}/></Modal>}
    {detail&&<Modal title="기도제목" onClose={()=>setDetail(null)} wide><div className="space-y-3"><h2 className="font-bold text-gray-900">{detail.title}</h2><p className="text-sm text-gray-400">{detail.author} · {fmt(detail.date)}</p><div className="bg-rose-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap">{detail.content}</div><div className="flex gap-2"><button onClick={()=>setDetail(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">닫기</button><button onClick={()=>{setEditP(detail);setDetail(null);}} className="flex-1 py-2.5 bg-[#1a1a1a] text-white rounded-xl text-sm">수정</button></div></div></Modal>}
  </div>;
};

const MPAdmin=({site,setSite,sections,setSections,classes,setClasses,teachers,students,accounts,setAccounts})=>{
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

  const pendingTeachers=(accounts||[]).filter(a=>a.role==='teacher_pending');
  const TABS=[{id:'site',l:'홈 설정'},{id:'bg',l:'배경'},{id:'sections',l:'섹션/반'},{id:'accounts',l:`교사 승인${pendingTeachers.length?` (${pendingTeachers.length})`:''}`},{id:'pin',l:'보안'}];
  return <div className="space-y-4">
    <div className="flex items-center justify-between"><h2 className="font-bold text-gray-900 text-lg">⚙️ 관리자</h2><button onClick={()=>setAuthed(false)} className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-2 py-1 rounded-lg">로그아웃</button></div>
    <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1 overflow-x-auto">
      {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${tab===t.id?'bg-white text-gray-900 shadow-sm':'text-gray-500'}`}>{t.l}</button>)}
    </div>

    {tab==='site'&&<div className="space-y-4 bg-gray-50 rounded-2xl p-4">
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
      <div className="flex justify-end"><button onClick={()=>{const name=prompt('새 섹션 이름:');if(name)mergeArrayWrite('sections_v3',setSections,p=>[...p,{id:'s'+Date.now(),name,color:'teal',emoji:'✝',gradient:'135deg,#1a4a3a,#0f2e24',desc:''}]);}} className="px-3 py-1.5 bg-[#1a1a1a] text-white rounded-xl text-sm">+ 섹션 추가</button></div>
      {sections.map(sec=>(
        <div key={sec.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
          <div className="h-12 rounded-xl flex items-center gap-3 px-3" style={{background:`linear-gradient(${sec.gradient})`}}><span className="text-xl">{sec.emoji}</span><span className="font-bold text-white">{sec.name}</span></div>
          <div className="grid grid-cols-2 gap-2">
            <Inp label="이름" value={sec.name} onChange={v=>setSections(p=>p.map(s=>s.id===sec.id?{...s,name:v}:s))}/>
            <Inp label="설명" value={sec.desc||''} onChange={v=>setSections(p=>p.map(s=>s.id===sec.id?{...s,desc:v}:s))}/>
            <Inp label="예배시간" value={sec.serviceTime||''} onChange={v=>setSections(p=>p.map(s=>s.id===sec.id?{...s,serviceTime:v}:s))} placeholder="예: 주일 오전 10시"/>
            <Inp label="담당 교역자" value={sec.pastor||''} onChange={v=>setSections(p=>p.map(s=>s.id===sec.id?{...s,pastor:v}:s))} placeholder="예: 김OO 전도사"/>
            <Inp label="이번 주 주제" value={sec.theme||''} onChange={v=>setSections(p=>p.map(s=>s.id===sec.id?{...s,theme:v}:s))}/>
            <Inp label="말씀" value={sec.verse||''} onChange={v=>setSections(p=>p.map(s=>s.id===sec.id?{...s,verse:v}:s))} placeholder="예: 잠언 22:6"/>
          </div>
          <div className="flex flex-col gap-1"><label className="text-xs font-medium text-gray-600">공지사항</label><textarea value={sec.notice||''} onChange={e=>setSections(p=>p.map(s=>s.id===sec.id?{...s,notice:e.target.value}:s))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm h-16 resize-none outline-none focus:border-[#b8934a]" placeholder="공지 없으면 비워두세요"/></div>
          <div className="flex flex-col gap-1"><label className="text-xs font-medium text-gray-600">색상</label><div className="flex gap-1">{COLS.map(c=><button key={c.value} onClick={()=>mergeArrayWrite('sections_v3',setSections,p=>p.map(s=>s.id===sec.id?{...s,color:c.value}:s))} className={`px-2 py-1 rounded-lg text-xs border-2 transition-all ${sec.color===c.value?'border-[#b8934a] bg-[#b8934a]/10':'border-gray-200'}`}>{c.label}</button>)}</div></div>
          <div className="flex flex-col gap-1"><label className="text-xs font-medium text-gray-600">이모지 (사진 없을 때 표시)</label><div className="flex gap-1 flex-wrap">{EMJS.map(e=><button key={e} onClick={()=>mergeArrayWrite('sections_v3',setSections,p=>p.map(s=>s.id===sec.id?{...s,emoji:e}:s))} className={`w-8 h-8 rounded-lg border-2 text-base transition-all ${sec.emoji===e?'border-[#b8934a] bg-[#b8934a]/10':'border-gray-200'}`}>{e}</button>)}</div></div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">대표 사진</label>
            <input type="file" accept="image/*" onChange={async e=>{const file=e.target.files[0];if(!file)return;try{const dataUrl=await resizeImage(file,1000,0.8);mergeArrayWrite('sections_v3',setSections,p=>p.map(s=>s.id===sec.id?{...s,bannerImage:dataUrl}:s));}catch{alert('사진을 처리하지 못했습니다.');}}} className="text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700"/>
            {sec.bannerImage&&<div className="flex items-center gap-2 mt-1"><img src={sec.bannerImage} alt="" className="w-16 h-16 rounded-lg object-cover"/><button onClick={()=>mergeArrayWrite('sections_v3',setSections,p=>p.map(s=>s.id===sec.id?{...s,bannerImage:''}:s))} className="text-xs text-red-400 hover:underline">사진 제거</button></div>}
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-gray-500">반 목록</span><button onClick={()=>{const n=prompt('반 이름:');if(n)mergeArrayWrite('classes_v3',setClasses,p=>[...p,{id:'c'+Date.now(),name:n,sectionId:sec.id}]);}} className="text-xs text-[#b8934a] font-medium">+ 반 추가</button></div>
            {classes.filter(c=>c.sectionId===sec.id).map(cls=>{const sc=students.filter(s=>s.classId===cls.id&&s.active).length;return <div key={cls.id} className="flex items-center gap-2 py-1.5 border-b border-gray-100"><span className="flex-1 text-sm font-medium">{cls.name} <span className="text-xs text-gray-400">({sc}명)</span></span><button onClick={()=>{const n=prompt('반 이름 변경:',cls.name);if(n)mergeArrayWrite('classes_v3',setClasses,p=>p.map(c=>c.id===cls.id?{...c,name:n}:c));}} className="text-xs text-[#b8934a] hover:underline">수정</button><button onClick={()=>{if(sc>0)return alert('학생이 있어 삭제 불가');if(confirm('삭제?'))mergeArrayWrite('classes_v3',setClasses,p=>p.filter(c=>c.id!==cls.id));}} className="text-xs text-red-400 hover:underline">삭제</button></div>;})}
          </div>
          <button onClick={()=>{if(classes.some(c=>c.sectionId===sec.id))return alert('반이 있어 삭제 불가');if(confirm(`"${sec.name}" 섹션 삭제?`))mergeArrayWrite('sections_v3',setSections,p=>p.filter(s=>s.id!==sec.id));}} className="w-full py-2 text-xs text-red-400 hover:text-red-600 border border-red-100 rounded-lg hover:bg-red-50 transition-all">섹션 삭제</button>
        </div>
      ))}
    </div>}

    {tab==='accounts'&&<div className="space-y-3">
      <p className="text-sm text-gray-500">교사로 가입 신청한 회원을 승인하면 교사 관리 기능을 사용할 수 있게 됩니다.</p>
      {pendingTeachers.length===0&&<p className="text-center text-gray-400 py-8 text-sm">대기 중인 교사 신청이 없습니다.</p>}
      {pendingTeachers.map(a=>(
        <div key={a.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0" style={{background:'linear-gradient(135deg,#b8934a,#d4aa6e)'}}>{a.name[0]}</div>
          <div className="flex-1"><p className="font-medium text-sm">{a.name}</p><p className="text-xs text-gray-400">{a.email}</p></div>
          <div className="flex gap-1.5">
            <button onClick={()=>mergeArrayWrite('accounts_v3',setAccounts,p=>p.map(x=>x.id===a.id?{...x,role:'teacher'}:x))} className="px-3 py-1.5 bg-[#3d6b4f] text-white rounded-lg text-xs font-medium hover:bg-[#2d5240]">승인</button>
            <button onClick={()=>{if(confirm('이 신청을 거부할까요? 일반 회원으로 전환됩니다.'))mergeArrayWrite('accounts_v3',setAccounts,p=>p.map(x=>x.id===a.id?{...x,role:'member'}:x));}} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-100">거부</button>
          </div>
        </div>
      ))}
      {accounts&&accounts.filter(a=>a.role==='teacher').length>0&&(
        <div className="pt-2">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">승인된 교사</p>
          <div className="space-y-1.5">
            {accounts.filter(a=>a.role==='teacher').map(a=>(
              <div key={a.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-3 py-2 text-sm">
                <span>{a.name} <span className="text-gray-400 text-xs">{a.email}</span></span>
                <button onClick={()=>{if(confirm('교사 권한을 해제할까요?'))mergeArrayWrite('accounts_v3',setAccounts,p=>p.map(x=>x.id===a.id?{...x,role:'member'}:x));}} className="text-xs text-red-400 hover:text-red-600">권한 해제</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>}

    {tab==='pin'&&<div className="bg-gray-50 rounded-2xl p-4"><PinChg site={site} setSite={setSite}/></div>}
  </div>;
};

const BgSettings=({site,setSite})=>{
  const cur=site.heroBgGradient||'sky';
  const curType=site.heroBgType||'gradient';
  const hf=async e=>{const file=e.target.files[0];if(!file)return;try{const dataUrl=await resizeImage(file,1600,0.8);setSite(p=>({...p,heroBgImage:dataUrl,heroBgType:'image'}));}catch{alert('사진을 처리하지 못했습니다.');}};
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
  const [form, setForm] = useState({ name: '', email: '', password: '', password2: '', wantsTeacher: false });
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErr(''); setMsg(''); };

  const [resetStep, setResetStep] = useState('email');
  const [resetAcc, setResetAcc] = useState(null);
  const [resetPw, setResetPw] = useState({ pw: '', pw2: '' });
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState(false);

  const handleFindAccount = async () => {
    const acc = accounts.find(a => a.email.toLowerCase() === form.email.toLowerCase());
    if (!acc) { setErr('등록되지 않은 이메일입니다.'); return; }
    setOtpBusy(true);
    const { error } = await sendOtp(form.email);
    setOtpBusy(false);
    if (error) { setErr('인증코드 발송 실패: ' + error); return; }
    setResetAcc(acc); setResetStep('verify'); setErr('');
  };
  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) { setErr('인증코드를 입력하세요.'); return; }
    setOtpBusy(true);
    const { error } = await verifyOtp(form.email, otpCode.trim());
    setOtpBusy(false);
    if (error) { setErr('인증코드가 올바르지 않습니다.'); return; }
    setResetStep('newpass'); setErr('');
  };
  const handleResetPassword = () => {
    if (resetPw.pw.length < 6) { setErr('비밀번호는 6자 이상이어야 합니다.'); return; }
    if (resetPw.pw !== resetPw.pw2) { setErr('비밀번호가 일치하지 않습니다.'); return; }
    mergeArrayWrite('accounts_v3', setAccounts, p => p.map(a => a.id === resetAcc.id ? { ...a, passwordHash: hashPw(resetPw.pw) } : a));
    setTab('login'); setResetStep('email'); setResetAcc(null); setResetPw({ pw: '', pw2: '' }); setOtpCode('');
    setForm(f => ({ ...f, password: '' }));
    setMsg('비밀번호가 변경되었습니다. 새 비밀번호로 로그인해주세요.');
  };

  const handleLogin = () => {
    if (!form.email || !form.password) { setErr('이메일과 비밀번호를 입력하세요.'); return; }
    const acc = accounts.find(a => a.email.toLowerCase() === form.email.toLowerCase());
    if (!acc) { setErr('등록되지 않은 이메일입니다.'); return; }
    if (acc.passwordHash !== hashPw(form.password)) { setErr('비밀번호가 틀렸습니다.'); return; }
    onSuccess({ name: acc.name, email: acc.email, provider: 'email', role: acc.role || 'teacher' });
  };

  const handleSignup = () => {
    if (!form.name.trim()) { setErr('이름을 입력하세요.'); return; }
    if (!form.email.includes('@')) { setErr('올바른 이메일을 입력하세요.'); return; }
    if (form.password.length < 6) { setErr('비밀번호는 6자 이상이어야 합니다.'); return; }
    if (form.password !== form.password2) { setErr('비밀번호가 일치하지 않습니다.'); return; }
    if (accounts.find(a => a.email.toLowerCase() === form.email.toLowerCase())) { setErr('이미 등록된 이메일입니다.'); return; }
    const role = form.wantsTeacher ? 'teacher_pending' : 'member';
    const name = form.name.trim(), email = form.email.trim(), passwordHash = hashPw(form.password);
    mergeArrayWrite('accounts_v3', setAccounts, p => [...p, { id: nextId(p), name, email, passwordHash, role }]);
    onSuccess({ name, email, provider: 'email', role });
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-[#1a1a1a] px-6 py-5 text-center">
          <div className="text-[#b8934a] text-3xl mb-2">✝</div>
          <h2 className="text-white font-bold text-lg">로그인</h2>
          <p className="text-white/40 text-xs mt-1">{site.churchName}</p>
        </div>

        {tab !== 'reset' && (
          <div className="flex gap-1 px-6 pt-5">
            {['login', 'signup'].map(t => (
              <button key={t} onClick={() => { setTab(t); setErr(''); setMsg(''); setForm({ name: '', email: '', password: '', password2: '', wantsTeacher: false }); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${tab === t ? 'bg-[#1a1a1a] text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                {t === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>
        )}

        {tab === 'reset' && (
          <div className="px-6 pb-6 pt-5 space-y-3">
            <h3 className="text-sm font-bold text-gray-800">비밀번호 재설정</h3>
            {resetStep === 'email' ? (
              <>
                <p className="text-xs text-gray-500">가입하신 이메일을 입력해주세요. (이메일이 곧 아이디입니다)</p>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">이메일</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleFindAccount(); }}
                    placeholder="example@gmail.com" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#b8934a] transition-colors" />
                </div>
                {err && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{err}</p>}
                <button onClick={handleFindAccount} disabled={otpBusy} className="w-full py-3 bg-[#3d6b4f] text-white rounded-2xl text-sm font-semibold hover:bg-[#2d5240] transition-all disabled:opacity-50">{otpBusy ? '발송 중...' : '인증코드 받기'}</button>
              </>
            ) : resetStep === 'verify' ? (
              <>
                <p className="text-xs text-gray-500">{form.email}로 인증코드를 보냈습니다. 메일을 확인해주세요. (스팸함도 확인)</p>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">인증코드</label>
                  <input value={otpCode} onChange={e => { setOtpCode(e.target.value); setErr(''); }}
                    onKeyDown={e => { if (e.key === 'Enter') handleVerifyOtp(); }}
                    placeholder="이메일로 받은 인증코드" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#b8934a] transition-colors tracking-widest text-center" />
                </div>
                {err && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{err}</p>}
                <button onClick={handleVerifyOtp} disabled={otpBusy} className="w-full py-3 bg-[#3d6b4f] text-white rounded-2xl text-sm font-semibold hover:bg-[#2d5240] transition-all disabled:opacity-50">{otpBusy ? '확인 중...' : '인증코드 확인'}</button>
                <button onClick={handleFindAccount} disabled={otpBusy} className="w-full py-1.5 text-xs text-gray-400 hover:text-[#b8934a]">코드 다시 받기</button>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-500">{resetAcc?.name}님, 새 비밀번호를 설정해주세요.</p>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">새 비밀번호 (6자 이상)</label>
                  <input type="password" value={resetPw.pw} onChange={e => { setResetPw(p => ({ ...p, pw: e.target.value })); setErr(''); }}
                    placeholder="••••••" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#b8934a] transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">새 비밀번호 확인</label>
                  <input type="password" value={resetPw.pw2} onChange={e => { setResetPw(p => ({ ...p, pw2: e.target.value })); setErr(''); }}
                    onKeyDown={e => { if (e.key === 'Enter') handleResetPassword(); }}
                    placeholder="••••••" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#b8934a] transition-colors" />
                </div>
                {err && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{err}</p>}
                <button onClick={handleResetPassword} className="w-full py-3 bg-[#3d6b4f] text-white rounded-2xl text-sm font-semibold hover:bg-[#2d5240] transition-all">비밀번호 변경</button>
              </>
            )}
            <button onClick={() => { setTab('login'); setResetStep('email'); setResetAcc(null); setOtpCode(''); setErr(''); }} className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-600">로그인으로 돌아가기</button>
          </div>
        )}

        {tab !== 'reset' && <div className="px-6 pb-6 pt-4 space-y-3">
          {msg && (
            <p className="text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2">{msg}</p>
          )}
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
          {tab === 'login' && (
            <button onClick={() => { setTab('reset'); setErr(''); setMsg(''); setResetStep('email'); }} className="text-xs text-gray-400 hover:text-[#b8934a] hover:underline">비밀번호를 잊으셨나요?</button>
          )}
          {tab === 'signup' && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">비밀번호 확인</label>
              <input type="password" value={form.password2} onChange={e => set('password2', e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSignup(); }}
                placeholder="••••••" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#b8934a] transition-colors" />
            </div>
          )}
          {tab === 'signup' && (
            <label className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 rounded-xl p-3 cursor-pointer">
              <input type="checkbox" checked={form.wantsTeacher} onChange={e => set('wantsTeacher', e.target.checked)} className="mt-0.5 accent-[#b8934a]" />
              <span>저는 <b>교사</b>입니다. (교사로 가입 신청 — 관리자 승인 후 교사 관리 기능을 이용할 수 있어요. 체크하지 않으면 일반 회원으로 가입되어 사진 다운로드만 가능합니다.)</span>
            </label>
          )}

          {err && (
            <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{err}</p>
          )}

          <button onClick={tab === 'login' ? handleLogin : handleSignup}
            className="w-full py-3 bg-[#3d6b4f] text-white rounded-2xl text-sm font-semibold hover:bg-[#2d5240] transition-all mt-1">
            {tab === 'login' ? '로그인' : '가입하기'}
          </button>

          <button onClick={onClose} className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-600">취소</button>
        </div>}
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
  const [events, setEvents] = useLS('events_v3', []);
  const [photos, setPhotos] = useLS('photos_v3', INITIAL_PHOTOS);
  const [prayers, setPrayers] = useLS('prayers_v3', INITIAL_PRAYERS);
  const [accounts, setAccounts] = useLS('accounts_v3', []);

  const [authUser, setAuthUser] = useLocalState('authUser_v3', null);
  const [showLogin, setShowLogin] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [pendingDownload, setPendingDownload] = useState(null);

  const handleTeacherBtn = () => {
    if (authUser?.role === 'teacher') { setShowManage(true); return; }
    if (authUser) { setShowAccountMenu(true); return; }
    setShowLogin(true);
  };
  const handleRequestDownload = p => {
    if (authUser) { downloadDataUrl(p.src, `${p.album || 'photo'}${p.caption ? '_' + p.caption : ''}.jpg`); return; }
    setPendingDownload(p);
    setShowLogin(true);
  };
  const handleRequestLogin = () => { if (!authUser) setShowLogin(true); };
  const handleLogout = () => {
    setAuthUser(null); setShowManage(false); setShowAccountMenu(false);
  };
  const handleWithdraw = () => {
    if (!confirm('정말 회원탈퇴 하시겠어요? 계정 정보가 삭제되며 되돌릴 수 없습니다.')) return;
    if (authUser?.email) mergeArrayWrite('accounts_v3', setAccounts, p => p.filter(a => a.email.toLowerCase() !== authUser.email.toLowerCase()));
    handleLogout();
  };

  return (
    <React.Fragment>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jua&family=Noto+Serif+KR:wght@400;600;700&family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Noto Sans KR',sans-serif;color:#1a1a1a;background:#fff;}
        h1,h2,h3{font-family:'Noto Sans KR',sans-serif;}
        .font-jua{font-family:'Noto Sans KR',sans-serif;}
        @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeIn 0.5s ease}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#f1f1f1}::-webkit-scrollbar-thumb{background:#b8934a;border-radius:2px}
        .line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        select,input,textarea{font-family:'Noto Sans KR',sans-serif}
      `}</style>

      <Homepage
        site={site} sections={sections} classes={classes} students={students}
        prayers={prayers} setPrayers={setPrayers} photos={photos} events={events}
        onOpenManage={handleTeacherBtn} authUser={authUser} onRequestDownload={handleRequestDownload} onRequestLogin={handleRequestLogin}
      />

      {showLogin && (
        <AuthModal
          site={site}
          accounts={accounts}
          setAccounts={setAccounts}
          onSuccess={user => {
            setAuthUser(user); setShowLogin(false);
            logLogin({ name: user.name, email: user.email || '', provider: user.provider });
            if (pendingDownload) { downloadDataUrl(pendingDownload.src, `${pendingDownload.album || 'photo'}${pendingDownload.caption ? '_' + pendingDownload.caption : ''}.jpg`); setPendingDownload(null); }
            else if (user.role === 'teacher') { setShowManage(true); }
            else if (user.role === 'teacher_pending') { alert('교사 가입 신청이 완료되었습니다. 관리자 승인 후 교사 기능을 이용할 수 있어요.'); }
          }}
          onClose={() => { setShowLogin(false); setPendingDownload(null); }}
        />
      )}

      {showAccountMenu && authUser && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => { if (e.target === e.currentTarget) setShowAccountMenu(false); }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-[#1a1a1a] px-6 py-5 text-center">
              {authUser.picture ? <img src={authUser.picture} alt="" className="w-12 h-12 rounded-full mx-auto mb-2 border border-[#b8934a]/50" referrerPolicy="no-referrer" /> : <div className="w-12 h-12 rounded-full bg-[#b8934a] flex items-center justify-center text-white font-bold text-lg mx-auto mb-2">{authUser.name?.[0]}</div>}
              <h2 className="text-white font-bold text-lg">{authUser.name}</h2>
              <p className="text-white/40 text-xs mt-1">{authUser.role === 'teacher_pending' ? '교사 승인 대기 중' : '일반 회원'}</p>
            </div>
            <div className="p-6 space-y-2">
              <button onClick={() => { setShowAccountMenu(false); handleLogout(); }} className="w-full py-3 bg-[#1a1a1a] text-white rounded-2xl text-sm font-semibold hover:bg-[#333] transition-all">로그아웃</button>
              <button onClick={handleWithdraw} className="w-full py-3 border border-red-200 text-red-500 rounded-2xl text-sm font-semibold hover:bg-red-50 transition-all">회원탈퇴</button>
              <button onClick={() => setShowAccountMenu(false)} className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-600">닫기</button>
            </div>
          </div>
        </div>
      )}

      {showManage && authUser?.role === 'teacher' && (
        <ManagePanel
          onClose={() => setShowManage(false)}
          authUser={authUser}
          onLogout={handleLogout}
          onWithdraw={handleWithdraw}
          site={site} setSite={setSite}
          sections={sections} setSections={setSections}
          classes={classes} setClasses={setClasses}
          students={students} setStudents={setStudents}
          teachers={teachers} setTeachers={setTeachers}
          attendance={attendance} setAttendance={setAttendance}
          meetings={meetings} setMeetings={setMeetings}
          events={events} setEvents={setEvents}
          photos={photos} setPhotos={setPhotos}
          prayers={prayers} setPrayers={setPrayers}
          accounts={accounts} setAccounts={setAccounts}
        />
      )}
    </React.Fragment>
  );
};

export default App;
