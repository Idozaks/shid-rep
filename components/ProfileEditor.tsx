
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl" style={{ backgroundColor: formData.themeColor }}>
              <Icon name={formData.iconName} className="w-6 h-6" color="#fff" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">הגדרות נציג חברה</h2>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 overflow-y-auto flex-1 space-y-10">
          {/* Brand & Theme */}
          <section className="space-y-6">
            <h3 className="text-lg font-black text-blue-900 border-b pb-2">זהות חזותית ופרטי עסק</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">שם החברה</label>
                <input 
                  type="text"
                  required
                  placeholder="למשל: שידורית בע״מ"
                  className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">תעשייה</label>
                <input 
                  type="text"
                  placeholder="למשל: נדל״ן, בריאות, טכנולוגיה"
                  className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold"
                  value={formData.industry}
                  onChange={e => setFormData({ ...formData, industry: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">קישור לתמונת באנר (Banner URL)</label>
                <input 
                  type="url"
                  placeholder="https://example.com/image.png"
                  className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium dir-ltr text-left"
                  value={formData.bannerUrl}
                  onChange={e => setFormData({ ...formData, bannerUrl: e.target.value })}
                />
                <p className="text-[10px] text-gray-400 mt-1">התמונה שתופיע בחלק העליון של כרטיס החברה</p>
              </div>
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-3">אייקון מייצג</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      className={`p-2.5 rounded-xl border-2 transition-all ${formData.iconName === icon ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                      onClick={() => setFormData({ ...formData, iconName: icon })}
                    >
                      <Icon name={icon} className="w-5 h-5" color={formData.iconName === icon ? '#2563eb' : '#64748b'} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">צבע מותג</label>
                <div className="flex gap-3">
                  {['#f5821f', '#0033cc', '#1e293b', '#2563eb', '#0d9488', '#dc2626'].map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`w-10 h-10 rounded-xl border-4 transition-all ${formData.themeColor === color ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, themeColor: color })}
                    />
                  ))}
                  <input 
                    type="color"
                    className="w-10 h-10 border-0 p-0 bg-transparent rounded-xl cursor-pointer"
                    value={formData.themeColor}
                    onChange={e => setFormData({ ...formData, themeColor: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Website URL */}
          <section className="space-y-6">
            <h3 className="text-lg font-black text-blue-900 border-b pb-2">מקורות ידע</h3>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9h18" />
                </svg>
                כתובת אתר (URL) ללמידה אוטומטית
              </label>
              <input 
                type="url"
                placeholder="https://www.example.co.il"
                className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all dir-ltr text-left font-medium"
                value={formData.websiteUrl}
                onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold text-gray-700">בסיס ידע ומסמכים משלימים</label>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-black text-xs border border-blue-100 hover:bg-blue-100 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  העלה קבצים
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple hidden />
              </div>

              <textarea 
                rows={4}
                className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none resize-none transition-all leading-relaxed font-medium"
                placeholder="מידע טקסטואלי נוסף שאינו מופיע באתר או בקבצים..."
                value={formData.knowledgeBase}
                onChange={e => setFormData({ ...formData, knowledgeBase: e.target.value })}
              />

              {formData.files && formData.files.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {formData.files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl group hover:border-blue-300 transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        </div>
                        <span className="text-xs font-black text-gray-700 truncate">{file.name}</span>
                      </div>
                      <button type="button" onClick={() => removeFile(file.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Persona */}
          <section className="space-y-6">
            <h3 className="text-lg font-black text-blue-900 border-b pb-2">אישיות והנחיות דיבור</h3>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">הוראות התנהגות ונהלים (System Prompt)</label>
              <textarea 
                rows={6}
                className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none resize-none transition-all leading-relaxed font-medium"
                placeholder="למשל: תמיד תפתח ב-'שלום', אל תבטיח חזרה טלפונית, אם לקוח תקוע תתקשר לכונן..."
                value={formData.instructions}
                onChange={e => setFormData({ ...formData, instructions: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">טון דיבור</label>
                <input 
                  type="text"
                  className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold"
                  value={formData.tone}
                  onChange={e => setFormData({ ...formData, tone: e.target.value })}
                  placeholder="למשל: סמכותי, אמפתי, נמרץ"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">קול המערכת</label>
                <select 
                  className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all bg-white font-bold"
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
        </form>

        <div className="px-10 py-8 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-4">
          <button type="button" onClick={onCancel} className="px-8 py-4 text-gray-600 hover:bg-gray-200 rounded-2xl font-black transition-all">ביטול</button>
          <button 
            type="submit" 
            onClick={handleSubmit} 
            className="px-12 py-4 text-white rounded-2xl font-black shadow-2xl transition-all active:scale-95"
            style={{ backgroundColor: formData.themeColor, boxShadow: `0 15px 30px -10px ${formData.themeColor}60` }}
          >
            שמור והפעל נציג
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;
