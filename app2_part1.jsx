const { useState, useEffect, useRef, useMemo } = React;

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
  churchName: '○○교회 교회학교',
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

// ── localStorage 훅 ──────────────────────────────────────
function useLS(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : (typeof init==='function'?init():init); }
    catch { return typeof init==='function'?init():init; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
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
const isThisWeek = bd => { const d=getDaysUntilBirthday(bd); return d!==null&&d<=7; };
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
