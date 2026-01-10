import React, { useState, useEffect } from 'react';
import { CompanyProfile, TicketData, JourneyStep } from '../types';

interface TicketJourneyProps {
  profile: CompanyProfile;
  onComplete: (data: TicketData, startCall: boolean) => void;
  onCancel: () => void;
}

const TicketJourney: React.FC<TicketJourneyProps> = ({ profile, onComplete, onCancel }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<TicketData>({});
  const [isExiting, setIsExiting] = useState(false);

  const steps: JourneyStep[] = profile.journeySteps || [
    { field: 'firstName', question: 'מה שמך הפרטי?', type: 'text' },
    { field: 'phone', question: 'מה מספר הטלפון?', type: 'tel' },
    { field: 'issue', question: 'איך נוכל לעזור?', type: 'textarea' },
    { field: 'summary', question: 'תודה. האם תרצה לדבר עם נציג?', type: 'summary' }
  ];

  const currentStep = steps[step];

  const handleNext = (val: string) => {
    setData(prev => ({ ...prev, [currentStep.field]: val }));
    setStep(prev => prev + 1);
  };

  const renderInput = () => {
    const inputAnimationClass = "animate-elastic stagger-2";
    
    if (currentStep.type === 'text' || currentStep.type === 'tel') {
      return (
        <form onSubmit={(e) => { 
            e.preventDefault(); 
            const inputElement = (e.target as any).input;
            const val = inputElement.value; 
            if (val) {
              handleNext(val);
              inputElement.value = ''; 
            }
          }} className={`mt-8 flex flex-col gap-4 ${inputAnimationClass}`}>
          <input 
            autoFocus
            name="input"
            type={currentStep.type}
            className="w-full bg-white/10 border-2 border-white/20 rounded-[2rem] px-8 py-5 text-2xl outline-none focus:border-white/60 transition-all text-white placeholder:text-white/20 shadow-2xl"
            placeholder="הקלד כאן..."
          />
          <button type="submit" className="bg-white text-gray-900 py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-gray-100 hover:scale-[1.02] active:scale-95 transition-all">
            המשך לשלב הבא
          </button>
        </form>
      );
    }
    if (currentStep.type === 'textarea') {
      return (
        <form onSubmit={(e) => { 
            e.preventDefault(); 
            const inputElement = (e.target as any).input;
            const val = inputElement.value; 
            if (val) {
              handleNext(val);
              inputElement.value = '';
            }
          }} className={`mt-8 flex flex-col gap-4 ${inputAnimationClass}`}>
          <textarea 
            autoFocus
            name="input"
            rows={4}
            className="w-full bg-white/10 border-2 border-white/20 rounded-[2rem] px-8 py-6 text-2xl outline-none focus:border-white/60 transition-all resize-none text-white placeholder:text-white/20 shadow-2xl"
            placeholder="ספר לנו קצת יותר..."
          />
          <button type="submit" className="bg-white text-gray-900 py-5 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-gray-100 hover:scale-[1.02] active:scale-95 transition-all">
            סיימתי, בוא נמשיך
          </button>
        </form>
      );
    }
    if (currentStep.type === 'select') {
      return (
        <div className={`mt-8 grid grid-cols-1 gap-4 ${inputAnimationClass}`}>
          {currentStep.options?.map((opt, i) => (
            <button 
              key={opt}
              onClick={() => handleNext(opt)}
              className="bg-white/10 hover:bg-white/20 border-2 border-white/10 rounded-[1.5rem] py-6 text-2xl font-black transition-all text-center text-white shadow-lg active:scale-95 hover:border-white/40"
              style={{ animationDelay: `${0.2 + i * 0.05}s` }}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }
    if (currentStep.type === 'summary') {
      return (
        <div className="mt-10 space-y-8 animate-fade-scale stagger-2">
          <div className="bg-white/95 backdrop-blur-xl rounded-[3rem] overflow-hidden shadow-2xl border border-white/20">
            <div className="p-8 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
               <h4 className="text-xl font-black text-gray-900">סיכום הפרטים שלך</h4>
               <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </div>
            <div className="p-2">
              <table className="w-full text-right border-collapse">
                <tbody>
                  {steps.filter(s => s.type !== 'summary').map((s, idx) => (
                    <tr key={s.field} className={`group transition-colors ${idx % 2 === 0 ? 'bg-blue-50/30' : 'bg-white'} hover:bg-blue-100/50`}>
                      <td className="p-5 font-bold text-blue-900 border-l border-gray-100 w-1/3 text-sm">{s.question.replace('?', '').split('.').pop()}</td>
                      <td className="p-5 text-gray-800 text-base font-medium">{data[s.field] || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex flex-col gap-4">
             <button 
               onClick={() => onComplete(data, true)}
               className="w-full bg-green-500 hover:bg-green-600 text-white py-6 rounded-[2rem] font-black text-2xl shadow-2xl transition-all flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95"
             >
               <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
               שלח פנייה והתחל שיחה קולית
             </button>
             <button 
               onClick={() => onComplete(data, false)}
               className="w-full bg-white/10 hover:bg-white/20 text-white py-5 rounded-[2rem] font-bold text-lg border border-white/10 transition-all active:scale-[0.98]"
             >
               שלח פנייה בלבד
             </button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`fixed inset-0 z-[150] text-white flex flex-col p-8 md:p-12 overflow-y-auto transition-all duration-700 ${isExiting ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`} style={{ backgroundColor: profile.themeColor || '#0000aa' }}>
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="flex justify-between items-center mb-16 animate-fade-scale">
           <button 
             onClick={() => { setIsExiting(true); setTimeout(onCancel, 400); }} 
             className="bg-white/10 p-4 rounded-2xl hover:bg-white/20 transition-all active:scale-90"
           >
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
           <div className="text-right">
             <h2 className="text-3xl font-black tracking-tight">{profile.name}</h2>
             <p className="text-white/60 text-sm font-bold uppercase tracking-widest mt-1">פתיחת קריאה חכמה</p>
           </div>
        </div>

        <div key={step} className="space-y-6">
          <div className="bg-white/10 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/20 shadow-2xl animate-elastic">
            <h3 className="text-4xl font-black leading-tight tracking-tight">{currentStep.question}</h3>
          </div>
          {renderInput()}
        </div>

        <div className="mt-20 flex justify-center gap-3">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-700 ease-out-expo ${i <= step ? 'w-16 bg-white' : 'w-4 bg-white/20'}`}
              style={{ transitionDelay: `${i * 0.1}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TicketJourney;