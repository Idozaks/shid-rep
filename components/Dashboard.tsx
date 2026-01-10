
import React from 'react';
import { CompanyProfile } from '../types';
import { Icon } from './Icon';

interface DashboardProps {
  profiles: CompanyProfile[];
  onStartCall: (profile: CompanyProfile) => void;
  onStartChat: (profile: CompanyProfile) => void;
  onStartJourney: (profile: CompanyProfile) => void;
  onEditProfile: (profile: CompanyProfile) => void;
  onDeleteProfile: (id: string) => void;
}

const ProfileCard: React.FC<{
  profile: CompanyProfile;
  onStartCall: (profile: CompanyProfile) => void;
  onStartChat: (profile: CompanyProfile) => void;
  onStartJourney: (profile: CompanyProfile) => void;
  onEditProfile: (profile: CompanyProfile) => void;
  onDeleteProfile: (id: string) => void;
  isExample?: boolean;
}> = ({ profile, onStartCall, onStartChat, onStartJourney, onEditProfile, onDeleteProfile, isExample }) => {
  const themeColor = profile.themeColor || (isExample ? '#64748b' : '#f5821f');
  
  return (
    <div className={`bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all border group overflow-hidden flex flex-col ${isExample ? 'border-gray-100 opacity-90' : 'border-orange-50'}`}>
      <div 
        className="h-40 p-6 flex flex-col justify-end relative overflow-hidden transition-colors"
        style={{ backgroundColor: themeColor }}
      >
        {profile.bannerUrl && (
          <div className="absolute inset-0 p-4 flex items-center justify-center">
            <img 
              src={profile.bannerUrl} 
              alt={`${profile.name} banner`} 
              className="w-full h-full object-contain"
            />
          </div>
        )}
        
        <div className={`absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
        
        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
          <Icon name={profile.iconName} className="w-40 h-40" color="#fff" />
        </div>
        
        <div className="relative z-10 flex justify-between items-end">
          <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-lg">
            <Icon name={profile.iconName} className="w-8 h-8" color="#fff" />
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => onEditProfile(profile)}
              className="p-2 bg-white/30 backdrop-blur-sm hover:bg-white/50 text-white rounded-xl transition-all shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {!isExample && (
              <button 
                onClick={() => onDeleteProfile(profile.id)}
                className="p-2 bg-white/30 backdrop-blur-sm hover:bg-red-500/50 text-white rounded-xl transition-all shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-4">
          <h3 className="text-xl font-black text-gray-900 leading-tight">{profile.name}</h3>
          <span className="inline-block px-2.5 py-1 mt-2 text-[10px] font-bold rounded-lg uppercase tracking-wider bg-gray-100 text-gray-600 border border-gray-200">
            {profile.industry || 'כללי'}
          </span>
        </div>
        
        <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed flex-1 italic">
          {profile.knowledgeBase || 'אין ידע מוגדר עבור חברה זו.'}
        </p>

        <div className="flex flex-col gap-2 mt-auto">
          {profile.hasJourney && (
            <button 
              onClick={() => onStartJourney(profile)}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl font-bold transition-all border-2 border-dashed text-blue-600 border-blue-100 hover:bg-blue-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              פתיחת קריאה חכמה
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => onStartChat(profile)}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black transition-all shadow-md hover:bg-gray-800 bg-gray-900 text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              צ'אט בלבד
            </button>
            <button 
              onClick={() => onStartCall(profile)}
              className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black transition-all shadow-xl text-white"
              style={{ backgroundColor: themeColor, boxShadow: `0 10px 20px -5px ${themeColor}40` }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              שיחה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ profiles, onStartCall, onStartChat, onStartJourney, onEditProfile, onDeleteProfile }) => {
  const activeProfiles = profiles.filter(p => !p.isExample);
  const exampleProfiles = profiles.filter(p => p.isExample);

  return (
    <div className="space-y-16 pb-20">
      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-[#f5821f] rounded-full"></div>
            <h2 className="text-2xl font-black text-gray-800">הנציגים הפעילים שלי</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeProfiles.map((profile) => (
            <ProfileCard 
              key={profile.id} 
              profile={profile} 
              onStartCall={onStartCall} 
              onStartChat={onStartChat}
              onStartJourney={onStartJourney}
              onEditProfile={onEditProfile} 
              onDeleteProfile={onDeleteProfile} 
            />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-8 bg-gray-400 rounded-full"></div>
          <h2 className="text-2xl font-black text-gray-500">תבניות מוכנות</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {exampleProfiles.map((profile) => (
            <ProfileCard 
              key={profile.id} 
              profile={profile} 
              onStartCall={onStartCall} 
              onStartChat={onStartChat}
              onStartJourney={onStartJourney}
              onEditProfile={onEditProfile} 
              onDeleteProfile={onDeleteProfile} 
              isExample
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
