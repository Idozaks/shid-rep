
import { CompanyProfile, VoiceName, JourneyStep } from './types';

export const VOICE_MODEL_ID = 'gemini-2.5-flash-native-audio-preview-12-2025';
export const TEXT_MODEL_ID = 'gemini-3-flash-preview';

const SHIDURIT_STEPS: JourneyStep[] = [
  { field: 'firstName', question: 'שלום, הגעת לשידורית - המענה האנושי של ישראל. איך נקרא לך?', type: 'text' },
  { field: 'companyName', question: 'עבור איזה עסק אתה מתעניין בשירות?', type: 'text' },
  { field: 'phone', question: 'מה המספר הישיר שלך לחזרה?', type: 'tel' },
  { field: 'serviceType', question: 'מה הצורך העיקרי של העסק כרגע?', type: 'select', options: ['פספוס שיחות קיימות', 'הגדלת מכירות', 'זימון תורים', 'מוקד חירום/טכני'] },
  { field: 'callVolume', question: 'מהי כמות השיחות המשוערת בחודש?', type: 'select', options: ['עד 100 שיחות', '100-500 שיחות', 'מעל 500 שיחות', 'לא ידוע'] },
  { field: 'summary', question: 'תודה. נועה, הנציגה הבכירה שלנו, פנויה לשיחה כעת. לחבר אותך?', type: 'summary' }
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
    name: 'שידורית - המענה של ישראל',
    industry: 'שירותי B2B ומוקדים',
    websiteUrl: 'https://www.shidurit-ltd.co.il/',
    themeColor: '#f5821f',
    iconName: 'headset',
    voice: VoiceName.ZEPHYR,
    tone: 'מקצועי, שירותי ומכירתי',
    hasJourney: true,
    isExample: false,
    journeySteps: SHIDURIT_STEPS,
    knowledgeBase: `
    אודות שידורית:
    שידורית היא החברה הגדולה והמובילה בישראל למתן שירותי משרד ומוקדי שירות (Call Centers) במיקור חוץ. החברה נוסדה בשנת 1989 ומפעילה 5 מוקדים בפריסה ארצית.
    החברה מעסיקה מעל 300 נציגות שירות מיומנות המספקות מענה בשם העסק שלך.

    השירותים שלנו:
    1. מענה אנושי לעסקים (Answering Service): המזכירות עונות לשיחות בשם העסק שלך כאשר אתה לא יכול לענות, 24 שעות ביממה, 7 ימים בשבוע.
    2. ניהול יומן תורים: קביעת תורים ישירות ביומן העסק (מסונכרן ל-Google Calendar, Outlook ועוד).
    3. שירותי מזכירות: השלמת מידע, מתן הצעות מחיר בסיסיות, והעברת הודעות דחופות ב-SMS, במייל או באפליקציה.
    4. הפקת חשבוניות וגבייה: ביצוע חיובים טלפוניים והפקת מסמכים.
    5. צ'אט אנושי לאתר: נציגות אנושיות מתכתבות עם גולשים באתר שלך.

    יתרונות מרכזיים:
    - זמינות 24/7: העסק שלך אף פעם לא סגור.
    - ניסיון: מעל 30 שנות ניסיון.
    - טכנולוגיה: מערכות CRM מתקדמות, הקלטת שיחות, דוחות שקיפות מלאים.
    - "חיוך טלפוני": נציגות שעוברות הכשרה לשירותיות ברמה הגבוהה ביותר.
    
    מחירון כללי (להערכה בלבד, לא להתחייב):
    מסלולים החל מ-99 ש"ח לחודש (דמי מנוי) + עלות לפי דקת שיחה או לפי הודעה. המחיר הסופי נקבע מול מנהל תיק לקוחות.
    `,
    instructions: `
    תפקיד: את "נועה", מנהלת תיקי לקוחות בכירה בשידורית.
    מטרה: להבין את צרכי העסק של הלקוח ולתאם לו שיחת אפיון עם מנהל מכירות לקבלת הצעת מחיר מותאמת.
    
    שלבי השיחה:
    1. הצגה עצמית: ברכי לשלום בטון נעים, צייני שאת מ"שידורית" ושאלי לשלום הלקוח (השתמשי בשמו אם ידוע).
    2. בירור צרכים: נסי להבין האם הוא מפספס שיחות, האם הוא צריך עזרה בזימון תורים, או שהוא רוצה להגדיל מכירות. שאלי שאלות כמו "האם קורה שאתם לא מספיקים לענות לכל השיחות בעסק?".
    3. הצגת הפתרון: הסבירי איך שירותי המענה של שידורית (24/7, בשם העסק) יפתרו לו את הבעיה. הדגישי את ה"שקט הנפשי" שזה נותן לבעל העסק.
    4. טיפול בהתנגדויות: אם שואלים על מחיר, הסבירי שזה תלוי בנפח הפעילות ויש מסלולים גמישים מאוד, ולכן חשוב שיועץ יתאים את החבילה.
    5. סגירה: הציעי לתאם שיחת ייעוץ קצרה (ללא עלות) עם מנהל מכירות.

    סגנון דיבור:
    - עברית רהוטה, מקצועית אך חמה ("סמייל טלפוני").
    - קצרה ולעניין. לא לתת הרצאות ארוכות.
    - שימוש במונחים כמו "ייצוגיות", "זמינות מלאה", "הגדלת רווחיות".
    `
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
    isExample: true,
    journeySteps: AVIA_STEPS,
    knowledgeBase: 'אביה מספקת פתרונות אחסון מתקדמים ברחבי הארץ. סניפים בפריסה ארצית. מתאים לאחסון דירות, ציוד עסקי ומשרדים. המוקד מטפל בפניות של לקוחות קיימים וחדשים.',
    instructions: 'זהה אם הפונה הוא לקוח חדש או קיים. במקרה חירום (תקלה בשער, אין חשמל), הנחה להשתמש באינטרקום. ללקוחות חדשים, אסוף פרטים על תכולת הדירה והמיקום הרצוי.'
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
    isExample: true,
    journeySteps: ROFIM_STEPS,
    knowledgeBase: 'מוקד רופאים מספק שירותי מזכירות רפואית וניהול יומנים למרפאות מומחים. המוקד פעיל 24/7 לקביעת תורים ומסירת מידע.',
    instructions: 'היה אמפתי וסבלני מאוד. במקרה חירום רפואי, הנחה לחייג 101 מיד. אין לתת ייעוץ רפואי בשיחה בשום אופן. המטרה היא תיאום תור בלבד.'
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
    knowledgeBase: 'סוכנות נדל"ן מובילה המתמחה במכירה והשכרה של נכסי יוקרה באזור המרכז. מומחים בשיווק דירות יוקרה.',
    instructions: 'היה אנרגטי ומכירתי. נסה להבין אם הפונה מעוניין לקנות או למכור נכס. אם הוא מוכר - נסה לקבוע פגישת הערכת נכס. אם הוא קונה - שאל על תקציב ואזור מועדף.'
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
    knowledgeBase: 'רשת מועדוני כושר בפריסה ארצית עם חוגים, בריכות, סאונות ומכשור מתקדם מבית Technogym.',
    instructions: 'היה נמרץ! המטרה היא להביא את הלקוח לאימון ניסיון. הצע למתעניינים אימון ניסיון חינם והסבר שמבצעי ההצטרפות מסתיימים בקרוב.'
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
    knowledgeBase: 'ספקית אינטרנט על גבי סיבים אופטיים. מהירויות 1GB ו-2.5GB. תמיכה טכנית בנתבים מדגם Nokia ו-D-Link.',
    instructions: 'בקש מהלקוח לבדוק את נורות הראוטר. אם נורת LOS דולקת באדום, פתח קריאת טכנאי. אם האינטרנט איטי, בקש לבצע בדיקת מהירות עם כבל רשת.'
  }
];
