
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xl z-[200] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] w-full max-w-4xl max-h-[98vh] sm:max-h-[95vh] overflow-hidden flex flex-col animate-elastic">
        <div className="px-5 py-5 sm:px-10 sm:py-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white shadow-2xl" style={{ backgroundColor: formData.themeColor }}>
              <Icon name={formData.iconName} className="w-5 h-5 sm:w-7 sm:h-7" color="#fff" />
            </div>
            <div>
              <h2 className="text-lg sm:text-3xl font-black text-gray-900 tracking-tight leading-none">הגדרות נציג</h2>
              <p className="text-gray-400 text-[10px] sm:text-sm font-bold mt-1 uppercase tracking-widest">עצב את בינת ה-AI שלך</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-300 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-xl active:scale-90">
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-10 overflow-y-auto flex-1 space-y-8 sm:space-y-12 custom-scrollbar">
          {/* Brand & Theme */}
          <section className="space-y-6 sm:space-y-8 animate-fade-scale stagger-1">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-4 sm:h-6 bg-blue-600 rounded-full"></div>
               <h3 className="text-lg sm:text-xl font-black text-gray-900">זהות עסקית</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
              <div className="group">
                <label className="block text-xs font-black text-gray-500 mb-2">שם החברה</label>
                <input 
                  type="text"
                  required
                  placeholder="למשל: שידורית"
                  className="w-full px-4 py-3 sm:px-6 sm:py-5 bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-base sm:text-lg"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 mb-2">תעשייה</label>
                <input 
                  type="text"
                  placeholder="למשל: נדל״ן"
                  className="w-full px-4 py-3 sm:px-6 sm:py-5 bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all font-bold text-base sm:text-lg"
                  value={formData.industry}
                  onChange={e => setFormData({ ...formData, industry: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
              <div>
                <label className="block text-xs font-black text-gray-500 mb-2">באנר (URL)</label>
                <input 
                  type="url"
                  placeholder="https://..."
                  className="w-full px-4 py-3 sm:px-6 sm:py-5 bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all dir-ltr text-left font-medium text-sm"
                  value={formData.bannerUrl}
                  onChange={e => setFormData({ ...formData, bannerUrl: e.target.value })}
                />
              </div>
              <div>
                 <label className="block text-xs font-black text-gray-500 mb-2">אייקון</label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`p-2 sm:p-3 rounded-lg sm:rounded-2xl border-2 transition-all active:scale-90 ${formData.iconName === icon ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}
                      onClick={() => setFormData({ ...formData, iconName: icon })}
                    >
                      <Icon name={icon} className="w-5 h-5 sm:w-6 sm:h-6" color={formData.iconName === icon ? '#2563eb' : '#94a3b8'} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-500 mb-3">צבע מותג</label>
              <div className="flex flex-wrap gap-2.5">
                {['#f5821f', '#0033cc', '#1e293b', '#2563eb', '#0d9488', '#dc2626'].map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-[1rem] border-4 transition-all ${formData.themeColor === color ? 'border-gray-900 scale-105' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, themeColor: color })}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Persona */}
          <section className="space-y-6 sm:space-y-8 animate-fade-scale stagger-2">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-4 sm:h-6 bg-purple-600 rounded-full"></div>
               <h3 className="text-lg sm:text-xl font-black text-gray-900">אישיות והנחיות</h3>
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 mb-2">הוראות התנהגות (System Instructions)</label>
              <textarea 
                rows={4}
                className="w-full px-4 py-4 sm:px-6 sm:py-6 bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-[2rem] focus:ring-4 focus:ring-purple-100 focus:border-purple-500 focus:bg-white outline-none resize-none transition-all leading-relaxed font-medium text-base sm:text-lg"
                placeholder="הנחיות לנציג..."
                value={formData.instructions}
                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
              <div>
                <label className="block text-xs font-black text-gray-500 mb-2">טון דיבור</label>
                <input 
                  type="text"
                  className="w-full px-4 py-3 sm:px-6 sm:py-5 bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 focus:bg-white outline-none transition-all font-bold text-base sm:text-lg"
                  value={formData.tone}
                  onChange={e => setFormData({ ...formData, tone: e.target.value })}
                  placeholder="אדיב, נמרץ..."
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 mb-2">קול המערכת</label>
                <select 
                  className="w-full px-4 py-3 sm:px-6 sm:py-5 bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl outline-none transition-all font-black text-base sm:text-lg appearance-none cursor-pointer"
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
          <section className="space-y-6 sm:space-y-8 animate-fade-scale stagger-3 pb-8">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-4 sm:h-6 bg-green-600 rounded-full"></div>
               <h3 className="text-lg sm:text-xl font-black text-gray-900">ידע ולמידה</h3>
            </div>
            
            <div>
              <label className="block text-xs font-black text-gray-500 mb-2 flex items-center gap-2">אתר חברה</label>
              <input 
                type="url"
                placeholder="https://..."
                className="w-full px-4 py-3 sm:px-6 sm:py-5 bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-2xl outline-none transition-all dir-ltr text-left font-medium text-base"
                value={formData.websiteUrl}
                onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-black text-gray-500">בסיס ידע משלים</label>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg font-black text-[10px] border-2 border-green-100 transition-all flex items-center gap-1 active:scale-95"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                  PDF/DOCX
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple hidden />
              </div>

              <textarea 
                rows={3}
                className="w-full px-4 py-4 sm:px-6 sm:py-6 bg-gray-50 border-2 border-gray-100 rounded-xl sm:rounded-[2rem] outline-none resize-none transition-all leading-relaxed font-medium text-base sm:text-lg"
                placeholder="הוסף מידע נוסף..."
                value={formData.knowledgeBase}
                onChange={e => setFormData({ ...formData, knowledgeBase: e.target.value })}
              />
            </div>
          </section>
        </form>

        <div className="px-5 py-5 sm:px-10 sm:py-10 border-t border-gray-100 bg-gray-50/80 flex justify-end gap-3 sm:gap-5 shrink-0">
          <button type="button" onClick={onCancel} className="px-6 py-3 sm:px-10 sm:py-5 text-gray-500 rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg transition-all active:scale-95">ביטול</button>
          <button 
            type="submit" 
            onClick={handleSubmit} 
            className="px-8 py-3 sm:px-16 sm:py-5 text-white rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg shadow-xl transition-all active:scale-95 hover:brightness-110"
            style={{ backgroundColor: formData.themeColor }}
          >
            שמור והפעל
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;
