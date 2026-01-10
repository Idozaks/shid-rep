import React, { useState, useRef } from 'react';
import { CompanyProfile, VoiceName, KnowledgeFile } from '../types';
import { Icon } from './Icon';

interface ProfileEditorProps {
  profile: CompanyProfile;
  onSave: (profile: CompanyProfile) => void;
  onCancel: () => void;
}

const AVAILABLE_ICONS = ['default', 'storage', 'parking', 'headset', 'medical', 'real-estate'];

const ProfileEditor: React.FC<ProfileEditorProps> = ({ profile, onSave, onCancel }) => {
  const [formData, setFormData] = useState<CompanyProfile>({
    ...profile,
    files: profile.files || [],
    websiteUrl: profile.websiteUrl || '',
    bannerUrl: profile.bannerUrl || '',
    themeColor: profile.themeColor || '#2563eb',
    iconName: profile.iconName || 'default'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = (event.target?.result as string).split(',')[1];
        const newFile: KnowledgeFile = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          mimeType: file.type,
          data: base64Data
        };
        setFormData(prev => ({
          ...prev,
          files: [...(prev.files || []), newFile]
        }));
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (id: string) => {
    setFormData(prev => ({
      ...prev,
      files: (prev.files || []).filter(f => f.id !== id)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col animate-elastic">
        <div className="px-10 py-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl transition-transform duration-500 hover:rotate-6" style={{ backgroundColor: formData.themeColor }}>
              <Icon name={formData.iconName} className="w-7 h-7" color="#fff" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none">הגדרות נציג חברה</h2>
              <p className="text-gray-400 text-sm font-bold mt-2 uppercase tracking-widest">עצב והגדר את בינת ה-AI שלך</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-300 hover:text-red-500 transition-all p-3 hover:bg-red-50 rounded-2xl active:scale-90">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 overflow-y-auto flex-1 space-y-12 custom-scrollbar">
          {/* Brand & Theme */}
          <section className="space-y-8 animate-fade-scale stagger-1">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
               <h3 className="text-xl font-black text-gray-900">זהות חזותית ופרטי עסק</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group">
                <label className="block text-sm font-black text-gray-500 mb-3 group-focus-within:text-blue-600 transition-colors">שם החברה</label>
                <input 
                  type="text"
                  required
                  placeholder="למשל: שידורית בע״מ"
                  className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-lg"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-500 mb-3">תעשייה</label>
                <input 
                  type="text"
                  placeholder="למשל: נדל״ן, בריאות, טכנולוגיה"
                  className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-lg"
                  value={formData.industry}
                  onChange={e => setFormData({ ...formData, industry: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-black text-gray-500 mb-3">קישור לתמונת באנר (URL)</label>
                <input 
                  type="url"
                  placeholder="https://example.com/logo.png"
                  className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all dir-ltr text-left font-medium"
                  value={formData.bannerUrl}
                  onChange={e => setFormData({ ...formData, bannerUrl: e.target.value })}
                />
              </div>
              <div>
                 <label className="block text-sm font-black text-gray-500 mb-3">אייקון מייצג</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`p-3.5 rounded-2xl border-2 transition-all active:scale-90 ${formData.iconName === icon ? 'border-blue-600 bg-blue-50 shadow-lg' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                      onClick={() => setFormData({ ...formData, iconName: icon })}
                    >
                      <Icon name={icon} className="w-6 h-6" color={formData.iconName === icon ? '#2563eb' : '#94a3b8'} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-gray-500 mb-4">צבע מותג</label>
              <div className="flex flex-wrap gap-4">
                {['#f5821f', '#0033cc', '#1e293b', '#2563eb', '#0d9488', '#dc2626'].map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-12 h-12 rounded-[1rem] border-4 transition-all shadow-md hover:scale-110 active:rotate-12 ${formData.themeColor === color ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, themeColor: color })}
                  />
                ))}
                <div className="relative group">
                  <input 
                    type="color"
                    className="w-12 h-12 border-0 p-0 bg-transparent rounded-[1rem] cursor-pointer shadow-md hover:scale-110 transition-transform"
                    value={formData.themeColor}
                    onChange={e => setFormData({ ...formData, themeColor: e.target.value })}
                  />
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">בחירה חופשית</div>
                </div>
              </div>
            </div>
          </section>

          {/* Persona */}
          <section className="space-y-8 animate-fade-scale stagger-2">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-6 bg-purple-600 rounded-full"></div>
               <h3 className="text-xl font-black text-gray-900">אישיות והנחיות דיבור</h3>
            </div>
            <div>
              <label className="block text-sm font-black text-gray-500 mb-3">הוראות התנהגות ונהלים (System Instructions)</label>
              <textarea 
                rows={6}
                className="w-full px-6 py-6 bg-gray-50 border-2 border-gray-100 rounded-[2rem] focus:ring-4 focus:ring-purple-100 focus:border-purple-500 focus:bg-white outline-none resize-none transition-all leading-relaxed font-medium text-lg"
                placeholder="למשל: תמיד תפתח ב-'שלום', היה סבלני במיוחד לקשישים, במקרה חירום הנחה לחייג 100..."
                value={formData.instructions}
                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-black text-gray-500 mb-3">טון דיבור</label>
                <input 
                  type="text"
                  className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 focus:bg-white outline-none transition-all font-bold text-lg"
                  value={formData.tone}
                  onChange={e => setFormData({ ...formData, tone: e.target.value })}
                  placeholder="למשל: סמכותי, אמפתי, נמרץ"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-500 mb-3">קול המערכת</label>
                <select 
                  className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 focus:bg-white outline-none transition-all font-black text-lg appearance-none cursor-pointer"
                  value={formData.voice}
                  onChange={e => setFormData({ ...formData, voice: e.target.value as VoiceName })}
                >
                  {Object.values(VoiceName).map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Website URL */}
          <section className="space-y-8 animate-fade-scale stagger-3">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-6 bg-green-600 rounded-full"></div>
               <h3 className="text-xl font-black text-gray-900">מקורות ידע ולמידה</h3>
            </div>
            
            <div className="group">
              <label className="block text-sm font-black text-gray-500 mb-3 flex items-center gap-2 group-focus-within:text-green-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9h18" /></svg>
                כתובת אתר ללמידה אוטומטית
              </label>
              <input 
                type="url"
                placeholder="https://www.your-business.co.il"
                className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-green-100 focus:border-green-500 focus:bg-white outline-none transition-all dir-ltr text-left font-medium text-lg"
                value={formData.websiteUrl}
                onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
              />
            </div>

            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-black text-gray-500">מסמכים ובסיס ידע משלים</label>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-green-50 text-green-700 rounded-xl font-black text-xs border-2 border-green-100 hover:bg-green-100 hover:border-green-300 transition-all flex items-center gap-2 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                  העלה קבצי PDF/DOCX
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple hidden />
              </div>

              <textarea 
                rows={4}
                className="w-full px-6 py-6 bg-gray-50 border-2 border-gray-100 rounded-[2rem] focus:ring-4 focus:ring-green-100 focus:border-green-500 focus:bg-white outline-none resize-none transition-all leading-relaxed font-medium text-lg"
                placeholder="הוסף כאן מידע נוסף, נהלים פנימיים או תשובות לשאלות נפוצות..."
                value={formData.knowledgeBase}
                onChange={e => setFormData({ ...formData, knowledgeBase: e.target.value })}
              />

              {formData.files && formData.files.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  {formData.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-5 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] group hover:border-green-300 hover:bg-white transition-all animate-fade-scale">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md group-hover:bg-green-50 transition-colors">
                          <svg className="w-6 h-6 text-gray-400 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <div className="min-w-0">
                          <span className="block text-xs font-black text-gray-900 truncate">{file.name}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">{file.mimeType.split('/')[1]}</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeFile(file.id)} className="text-gray-300 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-xl">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </form>

        <div className="px-10 py-10 border-t border-gray-100 bg-gray-50/80 flex justify-end gap-5">
          <button type="button" onClick={onCancel} className="px-10 py-5 text-gray-500 hover:bg-gray-200 rounded-2xl font-black text-lg transition-all active:scale-95">ביטול</button>
          <button 
            type="submit" 
            onClick={handleSubmit} 
            className="px-16 py-5 text-white rounded-2xl font-black text-lg shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] transition-all active:scale-95 hover:brightness-110"
            style={{ backgroundColor: formData.themeColor, boxShadow: `0 15px 35px -10px ${formData.themeColor}80` }}
          >
            שמור והפעל נציג חכם
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;