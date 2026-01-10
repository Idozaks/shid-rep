
import { CompanyProfile, VoiceName, JourneyStep } from './types';

export const VOICE_MODEL_ID = 'gemini-2.5-flash-native-audio-preview-12-2025';
export const TEXT_MODEL_ID = 'gemini-3-flash-preview';

const XFIBER_STEPS: JourneyStep[] = [
  { field: 'firstName', question: 'שלום! נפתח יחד קריאת שירות ל-X Fiber. מה שמך הפרטי?', type: 'text' },
  { field: 'lastName', question: 'תודה, ומה שם המשפחה?', type: 'text' },
  { field: 'phone', question: 'מה מספר הטלפון לחזרה?', type: 'tel' },
  { field: 'settlement', question: 'באיזה יישוב אתה גר?', type: 'text' },
  { field: 'issue', question: 'תאר בקצרה את מהות הפנייה שלך:', type: 'textarea' },
  { field: 'lightStatus', question: 'האם דולקת נורה אדומה או כחולה בראוטר?', type: 'select', options: ['אדומה', 'כחולה', 'לא דולקת'] },
  { field: 'fiberDamaged', question: 'האם הסיב קרוע או שנגעו בו לאחרונה?', type: 'select', options: ['כן', 'לא'] },
  { field: 'summary', question: 'הנה הפרטים כפי שנקלטו. האם ברצונך לפתוח את הקריאה ולדבר עם נציג?', type: 'summary' }
];

const AVIA_STEPS: JourneyStep[] = [
  { field: 'firstName', question: 'שלום, הגעת למוקד ההודעות של אביה. מה שמך הפרטי?', type: 'text' },
  { field: 'lastName', question: 'תודה, ומה שם המשפחה?', type: 'text' },
  { field: 'phone', question: 'מה מספר הטלפון לחזרה?', type: 'tel' },
  { field: 'settlement', question: 'באיזה יישוב מדובר?', type: 'text' },
  { field: 'inquiryType', question: 'מה סוג הפנייה שלך?', type: 'select', options: ['מכירות (לקוח חדש)', 'שירות לקוחות', 'מקרה דחוף/חירום'] },
  { field: 'branch', question: 'באיזה סניף מדובר?', type: 'select', options: ['תל אביב', 'חולון', 'הראל', 'גלילות', 'מבשרת ציון', 'לא רלוונטי'] },
  { field: 'issue', question: 'אשמח לקבל עוד כמה פרטים על הפנייה:', type: 'textarea' },
  { field: 'summary', question: 'תודה. יועצי האחסנה יצרו עימך קשר בהקדם. האם תרצה לדבר עם נציג קולי כעת?', type: 'summary' }
];

export const DEFAULT_PROFILES: CompanyProfile[] = [
  {
    id: 'avia-storage-permanent',
    name: 'מוקד ההודעות של אביה (AVIA)',
    industry: 'פתרונות אחסון',
    websiteUrl: 'https://www.avia2000.co.il/',
    themeColor: '#0033cc',
    iconName: 'storage',
    voice: VoiceName.KORE,
    tone: 'שירותי ורגוע',
    hasJourney: true,
    journeySteps: AVIA_STEPS,
    knowledgeBase: 'אביה מספקת פתרונות אחסון מתקדמים ברחבי הארץ. שעות פעילות המשרד הן א\'-ה\' 08:00-16:00 ובימי שישי 08:00-12:30.',
    instructions: 'זהה אם הפונה הוא לקוח חדש או קיים. במקרה חירום (נעול בסניף), הנחה להשתמש באינטרקום.'
  },
  {
    id: 'xfiber-tech-support',
    name: 'תמיכה טכנית X Fiber',
    industry: 'אינטרנט וסיבים',
    themeColor: '#dc2626',
    iconName: 'headset',
    voice: VoiceName.ZEPHYR,
    tone: 'מקצועי וטכני',
    hasJourney: true,
    journeySteps: XFIBER_STEPS,
    knowledgeBase: 'X Fiber מספקת אינטרנט במהירות גבוהה על גבי תשתית סיבים אופטיים.',
    instructions: 'עזור למשתמשים בפתרון תקלות בראוטר (נורות אדומות/כחולות) ובדיקת תקינות הסיב.'
  }
];
