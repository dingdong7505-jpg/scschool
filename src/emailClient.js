import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export async function notifyTeacherRequest({ name, email }) {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('EmailJS 환경변수가 설정되지 않아 교사 승인 알림 메일을 보내지 않았습니다.');
    return;
  }
  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      name,
      email,
      title: '교사 승인 요청',
      message: `${name}(${email})님이 교회학교 홈페이지에 교사로 가입 신청했습니다.\n관리자 모드 → "교사 승인" 탭에서 승인해주세요.`,
    }, { publicKey: PUBLIC_KEY });
  } catch (e) {
    console.warn('교사 승인 알림 메일 발송 실패', e);
  }
}
