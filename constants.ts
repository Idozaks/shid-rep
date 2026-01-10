
import { CompanyProfile, VoiceName, JourneyStep } from './types';

export const VOICE_MODEL_ID = 'gemini-2.5-flash-native-audio-preview-12-2025';
export const TEXT_MODEL_ID = 'gemini-3-flash-preview';

const SHIDURIT_STEPS: JourneyStep[] = [
  { field: 'firstName', question: 'שלום, הגעת לשידורית. מה שמך הפרטי?', type: 'text' },
  { field: 'companyName', question: 'נשמח לדעת מה שם העסק שלך?', type: 'text' },
  { field: 'phone', question: 'מה מספר הטלפון לחזרה?', type: 'tel' },
  { field: 'needs', question: 'באיזה סוג מענה העסק שלך זקוק לעזרה?', type: 'select', options: ['מענה 24/7', 'מזכירות רפואית', 'גיבוי למשרד', 'אחר'] },
  { field: 'issue', question: 'אשמח לשמוע קצת יותר על הצרכים שלכם:', type: 'textarea' },
  { field: 'summary', question: 'הנה הפרטים. תרצה להתנסות בשיחה קולית עם נציג ה-AI שלנו?', type: 'summary' }
];

const AVIA_STEPS: JourneyStep[] = [
  { field: 'firstName', question: 'שלום, הגעת למוקד ההודעות של אביה. מה שמך הפרטי?', type: 'text' },
  { field: 'lastName', question: 'תודה, ומה שם המשפחה?', type: 'text' },
  { field: 'phone', question: 'מה מספר הטלפון לחזרה?', type: 'tel' },
  { field: 'settlement', question: 'באיזה יישוב מדובר?', type: 'text' },
  { field: 'inquiryType', question: 'מה סוג הפנייה שלך?', type: 'select', options: ['מכירות (לקוח חדש)', 'שירות לקוחות', 'מקרה דחוף/חירום'] },
  { field: 'issue', question: 'אשמח לקבל עוד כמה פרטים על הפנייה:', type: 'textarea' },
  { field: 'summary', question: 'תודה. יועצי האחסנה יצרו עימך קשר בהקדם. האם תרצה לדבר עם נציג קולי כעת?', type: 'summary' }
];

const ROFIM_STEPS: JourneyStep[] = [
  { field: 'firstName', question: 'שלום, הגעת למוקד רופאים. מה שמך הפרטי?', type: 'text' },
  { field: 'doctorName', question: 'לאיזה רופא תרצה לקבוע תור?', type: 'text' },
  { field: 'reason', question: 'מה סיבת הפנייה?', type: 'select', options: ['זימון תור', 'ביטול תור', 'בירור דחוף'] },
  { field: 'summary', question: 'תודה. ההודעה תועבר למרפאה. תרצה לדבר עם נציג אנושי כעת?', type: 'summary' }
];

export const DEFAULT_PROFILES: CompanyProfile[] = [
  {
    id: 'shidurit-main',
    name: 'שידורית - מענה אנושי לעסקים',
    industry: 'שירותי תקשורת',
    websiteUrl: 'https://www.shidurit-ltd.co.il/',
    themeColor: '#f5821f',
    iconName: 'headset',
    voice: VoiceName.ZEPHYR,
    tone: 'ייצוגי ואדיב',
    hasJourney: true,
    isExample: false, // מופיע כנציג פעיל
    journeySteps: SHIDURIT_STEPS,
    knowledgeBase: 'שידורית היא החברה המובילה בישראל למתן שירותי מענה אנושי לעסקים 24/7. השירות כולל ניהול תורים, מוקדי הודעות, ותמיכה טכנית.',
    instructions: 'המטרה היא לגרום לבעל העסק להשאיר פרטים לייעוץ עסקי. הדגש את הזמינות המלאה של שידורית.'
  },
  {
    id: 'avia-storage',
    name: 'מוקד ההודעות של אביה (AVIA)',
    industry: 'פתרונות אחסון',
    websiteUrl: 'https://www.avia2000.co.il/',
    themeColor: '#0033cc',
    iconName: 'storage',
    voice: VoiceName.KORE,
    tone: 'שירותי ורגוע',
    hasJourney: true,
    isExample: true, // תבנית
    journeySteps: AVIA_STEPS,
    knowledgeBase: 'אביה מספקת פתרונות אחסון מתקדמים ברחבי הארץ.',
    instructions: 'זהה אם הפונה הוא לקוח חדש או קיים. במקרה חירום, הנחה להשתמש באינטרקום.'
  },
  {
    id: 'medical-center',
    name: 'מוקד רופאים (Rofim)',
    industry: 'מזכירות רפואית',
    themeColor: '#0d9488',
    iconName: 'medical',
    voice: VoiceName.KORE,
    tone: 'סבלני ואמפתי',
    hasJourney: true,
    isExample: true, // תבנית
    journeySteps: ROFIM_STEPS,
    knowledgeBase: 'מוקד רופאים מספק שירותי מזכירות רפואית וניהול יומנים.',
    instructions: 'היה אמפתי וסבלני. במקרה חירום רפואי, הנחה לחייג 101.'
  },
  {
    id: 'real-estate-office',
    name: 'סוכנות נדל"ן רימקס',
    industry: 'נדל"ן',
    themeColor: '#dc2626',
    iconName: 'real-estate',
    voice: VoiceName.PUCK,
    tone: 'מכירתי ואנרגטי',
    hasJourney: false,
    isExample: true,
    knowledgeBase: 'סוכנות נדל"ן מובילה המתמחה במכירה והשכרה של נכסי יוקרה.',
    instructions: 'נסה להבין אם הפונה מעוניין לקנות או למכור נכס, וקבע פגישת ייעוץ.'
  },
  {
    id: 'fitness-gym',
    name: 'מועדון הכושר ספייס',
    industry: 'בריאות וכושר',
    themeColor: '#1e293b',
    iconName: 'default',
    voice: VoiceName.ZEPHYR,
    tone: 'נמרץ ומניע לפעולה',
    hasJourney: false,
    isExample: true,
    knowledgeBase: 'רשת מועדוני כושר בפריסה ארצית עם חוגים, בריכות ומכשור מתקדם.',
    instructions: 'הצע למתעניינים אימון ניסיון חינם והסבר על המבצעים הנוכחיים.'
  },
  {
    id: 'xfiber-tech',
    name: 'תמיכה טכנית X Fiber',
    industry: 'אינטרנט וסיבים',
    themeColor: '#9333ea',
    iconName: 'headset',
    voice: VoiceName.FENRIR,
    tone: 'טכני ומדויק',
    hasJourney: true,
    isExample: true,
    knowledgeBase: 'תמיכה בסיבים אופטיים במהירויות של עד 2.5GB.',
    instructions: 'סייע בפתרון תקלות גלישה וסנכרון ראוטר.'
  }
];
