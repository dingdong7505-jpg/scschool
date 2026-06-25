const { useState, useEffect, useRef, useMemo } = React;

// ── 데이터 ──────────────────────────────────────────────
const DEFAULT_SITE = {
  churchName: '○○교회 교회학교',
  subtitle: '하나님의 사랑 안에서 함께 자라가는 아이들',
  heroVerse: '"마땅히 행할 길을 아이에게 가르치라 그리하면 늙어도 그것을 떠나지 아니하리라"',
  heroVerseRef: '잠언 22:6',
  announcement: '',
  adminPin: '1234',
  googleClientId: '',
  allowedEmails: [],
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
function useLS(key,init){
  const [v,setV]=useState(()=>{ try{const s=localStorage.getItem(key);return s?JSON.parse(s):(typeof init==='function'?init():init);}catch{return typeof init==='function'?init():init;} });
  useEffect(()=>{ try{localStorage.setItem(key,JSON.stringify(v));}catch{} },[key,v]);
  return [v,setV];
}
const todayStr=()=>new Date().toISOString().split('T')[0];
const fmt=d=>d?d.replace(/-/g,'.'):''  ;
function getDUB(bd){ if(!bd)return null; const now=new Date(),[,m,day]=bd.split('-').map(Number),next=new Date(now.getFullYear(),m-1,day); if(next<now)next.setFullYear(now.getFullYear()+1); const diff=Math.ceil((next-now)/86400000); return diff===365?0:diff; }
const isThisWeek=bd=>{ const d=getDUB(bd);return d!==null&&d<=7; };
const isThisMonth=bd=>{ if(!bd)return false;return parseInt(bd.split('-')[1])===new Date().getMonth()+1; };
const getAge=bd=>{ if(!bd)return '';return new Date().getFullYear()-parseInt(bd.split('-')[0])+'세'; };
const getBMMDD=bd=>{ if(!bd)return '';const[,m,d]=bd.split('-');return `${m}월 ${d}일`; };
const nextId=arr=>arr.length?Math.max(...arr.map(x=>x.id))+1:1;
const decodeJWT=token=>{ try{const b=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(b));}catch{return null;} };

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

