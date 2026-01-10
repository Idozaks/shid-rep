
import React, { useState } from 'react';
import { CompanyProfile, TicketData, JourneyStep } from '../types';

interface TicketJourneyProps {
  profile: CompanyProfile;
  onComplete: (data: TicketData, startCall: boolean) => void;
  onCancel: () => void;
}

const TicketJourney: React.FC<TicketJourneyProps> = ({ profile, onComplete, onCancel }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<TicketData>({});

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
    if (currentStep.type === 'text' || currentStep.type === 'tel') {
      return (
        <form onSubmit={(e) => { 
            e.preventDefault(); 
            const inputElement = (e.target as any).input;
            const val = inputElement.value; 
            if (val) {
              handleNext(val);
              inputElement.value = ''; // Clear the input after submission
            }
          }} className="mt-6 flex flex-col gap-4">
          <input 
            autoFocus
            name="input"
            type={currentStep.type}
            className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-6 py-4 text-xl outline-none focus:border-white/60 transition-all text-white"
            placeholder="הקלד כאן..."
          />
          <button type="submit" className="bg-white text-blue-900 py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
            המשך
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
              inputElement.value = ''; // Clear the input after submission
            }
          }} className="mt-6 flex flex-col gap-4">
          <textarea 
            autoFocus
            name="input"
            rows={3}
            className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-6 py-4 text-xl outline-none focus:border-white/60 transition-all resize-none text-white"
            placeholder="הקלד כאן..."
          />
          <button type="submit" className="bg-white text-blue-900 py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
            המשך
          </button>
        </form>
      );
    }
    if (currentStep.type === 'select') {
      return (
        <div className="mt-6 grid grid-cols-1 gap-3">
          {currentStep.options?.map(opt => (
            <button 
              key={opt}
              onClick={() => handleNext(opt)}
              className="bg-white/10 hover:bg-white/20 border-2 border-white/10 rounded-2xl py-5 text-xl font-bold transition-all text-center text-white"
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }
    if (currentStep.type === 'summary') {
      return (
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-blue-200">
            <table className="w-full text-right border-collapse">
              <tbody>
                {steps.filter(s => s.type !== 'summary').map((s, idx) => (
                  <tr key={s.field} className={`border-b ${idx % 2 === 0 ? 'bg-pink-50/50' : 'bg-white'}`}>
                    <td className="p-4 font-bold text-blue-900 border-l w-1/3 text-sm">{s.question.replace('?', '').split('.').pop()}</td>
                    <td className="p-4 text-gray-800 text-sm">{data[s.field] || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3">
             <button 
               onClick={() => onComplete(data, true)}
               className="w-full bg-green-500 hover:bg-green-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl transition-all flex items-center justify-center gap-3"
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
               שלח פנייה והתחל שיחה
             </button>
             <button 
               onClick={() => onComplete(data, false)}
               className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-bold"
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
    <div className="fixed inset-0 z-[150] bg-blue-900 text-white flex flex-col p-8 md:p-12 overflow-y-auto" style={{ backgroundColor: profile.themeColor || '#0000aa' }}>
      <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center">
        <div className="flex justify-between items-center mb-12">
           <button onClick={onCancel} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
           <div className="text-right">
             <h2 className="text-2xl font-black">{profile.name}</h2>
             <p className="text-white/60 text-sm">פתיחת קריאה חכמה</p>
           </div>
        </div>

        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 shadow-2xl">
            <h3 className="text-2xl font-bold leading-tight">{currentStep.question}</h3>
          </div>
          {renderInput()}
        </div>

        <div className="mt-12 flex justify-center gap-2">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TicketJourney;
