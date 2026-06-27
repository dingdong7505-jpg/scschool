import React, { useState, useEffect, useRef, useMemo } from 'react';
import { logLogin, fetchSharedState, pushSharedState } from '../supabaseClient.js';

// ── 기본 데이터 ──────────────────────────────────────────
const DEFAULT_SECTIONS = [
  { id:'s1', name:'영유치부', color:'rose',   emoji:'🌸', gradient:'from-rose-400 to-pink-500' },
  { id:'s2', name:'아동부',   color:'amber',  emoji:'🌟', gradient:'from-amber-400 to-orange-500' },
  { id:'s3', name:'학생부',   color:'sky',    emoji:'📚', gradient:'from-sky-400 to-blue-500' },
  { id:'s4', name:'청년부',   color:'violet', emoji:'✨', gradient:'from-violet-400 to-purple-500' },
];
const DEFAULT_CLASSES = [
  { id:'c1', name:'영아부',   sectionId:'s1' },
  { id:'c2', name:'유치부',   sectionId:'s1' },
  { id:'c3', name:'초등1부',  sectionId:'s2' },
  { id:'c4', name:'초등2부',  sectionId:'s2' },
  { id:'c5', name:'중등부',   sectionId:'s3' },
  { id:'c6', name:'고등부',   sectionId:'s3' },
  { id:'c7', name:'청년부',   sectionId:'s4' },
];
const DEFAULT_HOME = {
  churchName: '신천교회 교회학교',
  subtitle: '하나님의 사랑으로 함께 자라가는 교회학교',
  announcement: '',
  adminPin: '1234',
};

const INITIAL_STUDENTS = [
  { id:1,  name:'김민준', classId:'c2', grade:'7세',  phone:'',              parentPhone:'010-1234-5678', birthDate:'2018-03-15', registeredDate:'2023-01-08', memo:'활발하고 씩씩함', active:true },
  { id:2,  name:'이서연', classId:'c2', grade:'6세',  phone:'',              parentPhone:'010-2345-6789', birthDate:'2019-06-22', registeredDate:'2023-01-08', memo:'', active:true },
  { id:3,  name:'박지호', classId:'c2', grade:'7세',  phone:'',              parentPhone:'010-3456-7890', birthDate:'2018-09-10', registeredDate:'2023-03-05', memo:'', active:true },
  { id:4,  name:'최아린', classId:'c3', grade:'1학년',phone:'',              parentPhone:'010-4567-8901', birthDate:'2017-01-20', registeredDate:'2022-02-06', memo:'피아노 특기', active:true },
  { id:5,  name:'정우진', classId:'c3', grade:'2학년',phone:'',              parentPhone:'010-5678-9012', birthDate:'2016-04-11', registeredDate:'2022-02-06', memo:'', active:true },
  { id:6,  name:'강하은', classId:'c3', grade:'3학년',phone:'010-6789-0123', parentPhone:'010-7890-1234', birthDate:'2015-07-30', registeredDate:'2021-03-07', memo:'찬양팀', active:true },
  { id:7,  name:'윤도현', classId:'c3', grade:'1학년',phone:'',              parentPhone:'010-8901-2345', birthDate:'2017-11-05', registeredDate:'2023-01-08', memo:'', active:true },
  { id:8,  name:'임채원', classId:'c4', grade:'4학년',phone:'010-9012-3456', parentPhone:'010-0123-4567', birthDate:'2014-02-28', registeredDate:'2020-03-01', memo:'독서를 좋아함', active:true },
  { id:9,  name:'한소희', classId:'c4', grade:'5학년',phone:'010-1122-3344', parentPhone:'010-2233-4455', birthDate:'2013-08-17', registeredDate:'2020-03-01', memo:'', active:true },
  { id:10, name:'오준서', classId:'c4', grade:'6학년',phone:'010-3344-5566', parentPhone:'010-4455-6677', birthDate:'2012-12-03', registeredDate:'2019-03-03', memo:'반장', active:true },
  { id:11, name:'신예린', classId:'c4', grade:'4학년',phone:'010-5566-7788', parentPhone:'010-6677-8899', birthDate:'2014-05-19', registeredDate:'2021-01-10', memo:'', active:true },
  { id:12, name:'배지훈', classId:'c5', grade:'중1',  phone:'010-7788-9900', parentPhone:'010-8899-0011', birthDate:'2011-07-08', registeredDate:'2023-03-05', memo:'축구 좋아함', active:true },
  { id:13, name:'조수아', classId:'c5', grade:'중2',  phone:'010-9900-1122', parentPhone:'010-0011-2233', birthDate:'2010-03-24', registeredDate:'2022-03-06', memo:'찬양팀 드럼', active:true },
  { id:14, name:'류민서', classId:'c5', grade:'중3',  phone:'010-1122-3344', parentPhone:'010-2233-4455', birthDate:'2009-10-12', registeredDate:'2021-03-07', memo:'', active:true },
  { id:15, name:'나현우', classId:'c5', grade:'중1',  phone:'010-3344-5566', parentPhone:'010-4455-6677', birthDate:'2011-01-29', registeredDate:'2023-01-08', memo:'', active:true },
  { id:16, name:'마은지', classId:'c6', grade:'고1',  phone:'010-5566-7788', parentPhone:'010-6677-8899', birthDate:'2008-06-14', registeredDate:'2022-03-06', memo:'예배 준비 봉사', active:true },
  { id:17, name:'서태양', classId:'c6', grade:'고2',  phone:'010-7788-9900', parentPhone:'010-8899-0011', birthDate:'2007-09-05', registeredDate:'2021-03-07', memo:'', active:true },
  { id:18, name:'권나영', classId:'c6', grade:'고3',  phone:'010-9900-1122', parentPhone:'010-0011-2233', birthDate:'2006-04-20', registeredDate:'2020-03-01', memo:'수험생', active:true },
  { id:19, name:'문지원', classId:'c6', grade:'고1',  phone:'010-1234-5670', parentPhone:'010-2345-6780', birthDate:'2008-11-30', registeredDate:'2023-03-05', memo:'', active:true },
  { id:20, name:'이준혁', classId:'c7', grade:'대학생',phone:'010-2222-3333',parentPhone:'', birthDate:'2003-05-12', registeredDate:'2022-03-06', memo:'', active:true },
  { id:21, name:'박수연', classId:'c7', grade:'청년', phone:'010-3333-4444', parentPhone:'', birthDate:'2001-08-25', registeredDate:'2021-01-10', memo:'찬양팀', active:true },
];

const INITIAL_TEACHERS = [
  { id:1, name:'이지은', classId:'c2', phone:'010-1111-2222', email:'jieun@church.com',   memo:'10년 경력' },
  { id:2, name:'박성민', classId:'c3', phone:'010-2222-3333', email:'sungmin@church.com', memo:'' },
  { id:3, name:'김하늘', classId:'c4', phone:'010-3333-4444', email:'haneul@church.com',  memo:'음악 전공' },
  { id:4, name:'정다운', classId:'c5', phone:'010-4444-5555', email:'dawoon@church.com',  memo:'' },
  { id:5, name:'최예진', classId:'c6', phone:'010-5555-6666', email:'yejin@church.com',   memo:'청년부 연계' },
  { id:6, name:'홍민서', classId:'c7', phone:'010-6666-7777', email:'minseo@church.com',  memo:'' },
];

const INITIAL_MEETINGS = [
  { id:1, title:'2026년 6월 교사 회의록',    date:'2026-06-01', uploader:'이지은', category:'회의록',   content:'· 여름성경학교 준비 논의\n· 출석률 개선 방안\n· 7월 행사 계획' },
  { id:2, title:'2026년 상반기 교육 계획서',  date:'2026-01-05', uploader:'박성민', category:'교육자료', content:'상반기 교육 목표 및 주별 커리큘럼' },
  { id:3, title:'여름성경학교 안내문',         date:'2026-05-20', uploader:'김하늘', category:'공지',     content:'일정: 8월 3일~5일\n장소: 교회 교육관\n주제: 하나님의 사랑' },
  { id:4, title:'5월 교사 회의록',            date:'2026-05-04', uploader:'정다운', category:'회의록',   content:'· 어린이날 행사 결산\n· 6월 일정 공유' },
];

const INITIAL_PHOTOS = [
  { id:1, album:'2026 어린이날 행사', sectionId:'s2', date:'2026-05-05', caption:'어린이날 기념 사진', src:'' },
  { id:2, album:'2026 부활절 예배',   sectionId:'all',date:'2026-04-20', caption:'부활절 연합 예배',    src:'' },
  { id:3, album:'2026 부활절 예배',   sectionId:'all',date:'2026-04-20', caption:'달걀 꾸미기 활동',    src:'' },
  { id:4, album:'영유치부 봄 소풍',   sectionId:'s1', date:'2026-04-10', caption:'봄 소풍 단체 사진',   src:'' },
];

const INITIAL_PRAYERS = [
  { id:1, title:'여름성경학교를 위해', content:'이번 여름성경학교가 은혜롭게 진행되도록 기도해주세요.', author:'이지은', date:'2026-06-10', answered:false },
  { id:2, title:'수험생 권나영 자매', content:'고3 권나영 자매가 수능을 준비하며 지치지 않도록 기도 부탁드립니다.', author:'최예진', date:'2026-06-15', answered:false },
  { id:3, title:'결석 학생들을 위해', content:'꾸준히 나오지 못하는 아이들이 돌아올 수 있도록 중보기도 해주세요.', author:'박성민', date:'2026-06-01', answered:false },
];

function generateSampleAttendance(classes) {
  const records = {};
  const now = new Date();
  for (let w = 0; w < 12; w++) {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay() - w * 7);
    const ds = d.toISOString().split('T')[0];
    records[ds] = {};
    INITIAL_STUDENTS.forEach(s => {
      const r = Math.random();
      records[ds][s.id] = r > 0.15 ? '출석' : r > 0.08 ? '결석' : r > 0.04 ? '조퇴' : '공결';
    });
  }
  return records;
}

// ── localStorage 훅 (기기 전용 — 세션 등) ──────────────────
function useLS(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : (typeof init==='function'?init():init); }
    catch { return typeof init==='function'?init():init; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

// ── Supabase로 동기화되는 공유 데이터 훅 ────────────────────
function useSharedLS(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : (typeof init==='function'?init():init); }
    catch { return typeof init==='function'?init():init; }
  });
  const remoteReady = useRef(false);

  useEffect(() => {
    let alive = true;
    fetchSharedState(key).then(remote => {
      if (!alive) return;
      if (remote !== null) { setVal(remote); }
      else { pushSharedState(key, val); }
      remoteReady.current = true;
    });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
    if (!remoteReady.current) return;
    const t = setTimeout(() => pushSharedState(key, val), 500);
    return () => clearTimeout(t);
  }, [key, val]);

  return [val, setVal];
}

// ── 유틸 ────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split('T')[0];
const fmt = d => d ? d.replace(/-/g,'.') : '';
function getDaysUntilBirthday(bd) {
  if (!bd) return null;
  const now = new Date(); const [,m,day] = bd.split('-').map(Number);
  const next = new Date(now.getFullYear(), m-1, day);
  if (next < now) next.setFullYear(now.getFullYear()+1);
  const diff = Math.ceil((next-now)/86400000);
  return diff===365?0:diff;
}
const getWeekRange = () => { const today = new Date(); today.setHours(0,0,0,0); const sun = new Date(today); sun.setDate(today.getDate()-today.getDay()); const sat = new Date(sun); sat.setDate(sun.getDate()+6); return {sun,sat}; };
const isThisWeek = bd => {
  if (!bd) return false;
  const {sun,sat} = getWeekRange();
  const [,m,day] = bd.split('-').map(Number);
  return [sun.getFullYear(),sat.getFullYear()].some(y=>{ const c=new Date(y,m-1,day); return c>=sun&&c<=sat; });
};
const getWeekDiff = bd => {
  if (!bd) return null;
  const {sun,sat} = getWeekRange();
  const [,m,day] = bd.split('-').map(Number);
  const today = new Date(); today.setHours(0,0,0,0);
  for (const y of [sun.getFullYear(),sat.getFullYear()]) { const c=new Date(y,m-1,day); if (c>=sun&&c<=sat) return Math.round((c-today)/86400000); }
  return null;
};
const fmtWeekDiff = d => d===0?'오늘!🥳':d>0?`D-${d}`:`${-d}일 전`;
const isThisMonth = bd => { if (!bd) return false; return parseInt(bd.split('-')[1])===new Date().getMonth()+1; };
const getAge = bd => { if (!bd) return ''; return new Date().getFullYear()-parseInt(bd.split('-')[0])+'세'; };
const getBirthMMDD = bd => { if (!bd) return ''; const [,m,d]=bd.split('-'); return `${m}월 ${d}일`; };
const nextId = arr => arr.length ? Math.max(...arr.map(x=>x.id))+1 : 1;

// ── 아이콘 ───────────────────────────────────────────────
const PATHS = {
  home:     "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  users:    "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  check:    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  chart:    "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  cake:     "M21 15a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h4l2-3 2 3h6a2 2 0 012 2v8z",
  teacher:  "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  doc:      "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  photo:    "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  pray:     "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  plus:     "M12 4v16m8-8H4",
  x:        "M6 18L18 6M6 6l12 12",
  search:   "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  edit:     "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  trash:    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  back:     "M15 19l-7-7 7-7",
  menu:     "M4 6h16M4 12h16M4 18h16",
  key:      "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
  lock:     "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
};
const Icon = ({ name, size=20, cls='' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} className={cls}>
    {(PATHS[name]||'').split(' M').map((p,i) => <path key={i} d={i===0?p:'M'+p} />)}
  </svg>
);

// ── 공통 UI ──────────────────────────────────────────────
const Card = ({ children, cls='' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${cls}`}>{children}</div>
);
const Badge = ({ text, color='sky' }) => {
  const m = { sky:'bg-sky-100 text-sky-700', green:'bg-green-100 text-green-700', red:'bg-red-100 text-red-700', yellow:'bg-yellow-100 text-yellow-700', purple:'bg-purple-100 text-purple-700', blue:'bg-blue-100 text-blue-700', orange:'bg-orange-100 text-orange-700', rose:'bg-rose-100 text-rose-700', amber:'bg-amber-100 text-amber-700', violet:'bg-violet-100 text-violet-700' };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m[color]||m.sky}`}>{text}</span>;
};
const Btn = ({ children, onClick, variant='primary', size='md', cls='', disabled=false }) => {
  const sz = { sm:'px-3 py-1.5 text-xs', md:'px-4 py-2 text-sm', lg:'px-5 py-2.5 text-base' };
  const vr = { primary:'bg-sky-500 hover:bg-sky-600 text-white shadow-sm', secondary:'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200', danger:'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200', ghost:'hover:bg-gray-100 text-gray-600', success:'bg-green-500 hover:bg-green-600 text-white' };
  return <button onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-1.5 rounded-xl font-medium transition-all active:scale-95 ${sz[size]} ${vr[variant]} ${disabled?'opacity-50 cursor-not-allowed':'cursor-pointer'} ${cls}`}>{children}</button>;
};
const Inp = ({ label, value, onChange, type='text', placeholder='', required=false, cls='' }) => (
  <div className={`flex flex-col gap-1 ${cls}`}>
    {label && <label className="text-sm font-medium text-gray-700">{label}{required&&<span className="text-red-500 ml-0.5">*</span>}</label>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all outline-none" />
  </div>
);
const Sel = ({ label, value, onChange, options }) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)}
      className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-sky-400 bg-white outline-none">
      {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
    </select>
  </div>
);
const Modal = ({ title, onClose, children, wide=false }) => (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div className={`bg-white w-full ${wide?'sm:max-w-2xl':'sm:max-w-md'} rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-3xl sm:rounded-t-2xl">
        <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><Icon name="x" size={18}/></button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

// ── 차트 ────────────────────────────────────────────────
const BarChart = ({ data, height=160 }) => {
  const max = Math.max(...data.map(d=>d.value), 1);
  return (
    <div style={{height}}>
      <svg viewBox={`0 0 ${data.length*60} ${height}`} className="w-full h-full">
        {data.map((d,i)=>{
          const bh=(d.value/max)*(height-40), x=i*60+8, y=height-32-bh;
          return <g key={i}>
            <rect x={x} y={y} width={44} height={bh} rx={6} fill={d.color||'#38bdf8'} opacity={0.85}/>
            <text x={x+22} y={height-18} textAnchor="middle" fontSize="10" fill="#64748b">{d.label}</text>
            <text x={x+22} y={y-4}       textAnchor="middle" fontSize="10" fill="#0369a1" fontWeight="600">{d.value}</text>
          </g>;
        })}
      </svg>
    </div>
  );
};
const LineChart = ({ data, height=160 }) => {
  if (!data.length) return null;
  const W=480, H=height-30;
  const pts = data.map((d,i)=>({ ...d, x:20+(i/Math.max(data.length-1,1))*(W-40), y:10+(1-d.value/100)*(H-20) }));
  const path = pts.map((p,i)=>`${i===0?'M':'L'}${p.x},${p.y}`).join(' ');
  const area = `${path} L${pts[pts.length-1].x},${H} L${pts[0].x},${H} Z`;
  return (
    <div style={{height}}>
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full h-full">
        <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3"/><stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02"/></linearGradient></defs>
        <path d={area} fill="url(#lg)"/>
        <path d={path} fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
        {pts.map((p,i)=>(
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="white" stroke="#0ea5e9" strokeWidth="2"/>
            <text x={p.x} y={H+20} textAnchor="middle" fontSize="10" fill="#94a3b8">{p.label}</text>
            <text x={p.x} y={p.y-8} textAnchor="middle" fontSize="10" fill="#0369a1" fontWeight="600">{p.value}%</text>
          </g>
        ))}
      </svg>
    </div>
  );
};

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
                <span className="text-xs text-pink-500">{fmtWeekDiff(getWeekDiff(s.birthDate))}</span>
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
  const weekBdays = active.filter(s=>isThisWeek(s.birthDate)).sort((a,b)=>getWeekDiff(a.birthDate)-getWeekDiff(b.birthDate));
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
                  <p className="text-xs text-gray-400">{fmtWeekDiff(getWeekDiff(s.birthDate))}</p>
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

// ── 생일 ─────────────────────────────────────────────────
const BirthdayPage = ({ students, classes }) => {
  const active = students.filter(s=>s.active&&s.birthDate);
  const getClassName = id => classes.find(c=>c.id===id)?.name||'';
  const thisWeek = active.filter(s=>isThisWeek(s.birthDate)).sort((a,b)=>getWeekDiff(a.birthDate)-getWeekDiff(b.birthDate));
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
                  <div className={`text-2xl font-bold ${getWeekDiff(s.birthDate)===0?'text-pink-500':'text-gray-600'}`}>
                    {fmtWeekDiff(getWeekDiff(s.birthDate))}
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
          <button onClick={e=>{e.stopPropagation();if(confirm('이 사진을 삭제할까요?')){setPhotos(prev=>prev.filter(x=>x.id!==lightbox.id));setLightbox(null);}}} className="mt-4 px-5 py-2.5 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600 transition-all">🗑 삭제</button>
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
      const json = decodeURIComponent(atob(b64).split('').map(c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join(''));
      return JSON.parse(json);
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

  const [homeContent, setHomeContent] = useSharedLS('ch_home', DEFAULT_HOME);
  const [sections,    setSections]    = useSharedLS('ch_sections',  DEFAULT_SECTIONS);
  const [classes,     setClasses]     = useSharedLS('ch_classes',   DEFAULT_CLASSES);
  const [students,    setStudents]    = useSharedLS('ch_students',  INITIAL_STUDENTS);
  const [teachers,    setTeachers]    = useSharedLS('ch_teachers',  INITIAL_TEACHERS);
  const [attendance,  setAttendance]  = useSharedLS('ch_attendance', ()=>generateSampleAttendance(DEFAULT_CLASSES));
  const [meetings,    setMeetings]    = useSharedLS('ch_meetings',  INITIAL_MEETINGS);
  const [photos,      setPhotos]      = useSharedLS('ch_photos',    INITIAL_PHOTOS);
  const [prayers,     setPrayers]     = useSharedLS('ch_prayers',   INITIAL_PRAYERS);

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
        <LoginPage homeContent={homeContent} onLogin={user=>{ setAuthUser(user); logLogin({ name: user.name, email: user.email || '', provider: user.sub==='guest'?'guest':'google' }); }}/>
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

export default App;
