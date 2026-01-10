
import React, { useState, useEffect, useMemo } from 'react';
import { CompanyProfile, TicketData } from './types';
import { DEFAULT_PROFILES } from './constants';
import Dashboard from './components/Dashboard';
import CallScreen from './components/CallScreen';
import ProfileEditor from './components/ProfileEditor';
import TicketJourney from './components/TicketJourney';

const App: React.FC = () => {
  const [customProfiles, setCustomProfiles] = useState<CompanyProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<CompanyProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState<CompanyProfile | null>(null);
  const [activeJourney, setActiveJourney] = useState<CompanyProfile | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [contextData, setContextData] = useState<TicketData | null>(null);
  const [initialCallMode, setInitialCallMode] = useState<'voice' | 'text'>('voice');

  useEffect(() => {
    const saved = localStorage.getItem('shidurit_user_profiles');
    if (saved) {
      try {
        setCustomProfiles(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved profiles", e);
      }
    }
  }, []);

  const displayProfiles = useMemo(() => {
    const customIds = new Set(customProfiles.map(p => p.id));
    const filteredDefaults = DEFAULT_PROFILES.filter(p => !customIds.has(p.id));
    
    return [...filteredDefaults, ...customProfiles].sort((a, b) => {
      // Shidurit is always first
      if (a.id === 'shidurit-main') return -1;
      if (b.id === 'shidurit-main') return 1;
      // Active profiles before examples
      if (a.isExample === b.isExample) return 0;
      return a.isExample ? 1 : -1;
    });
  }, [customProfiles]);

  const saveCustomProfiles = (updated: CompanyProfile[]) => {
    setCustomProfiles(updated);
    localStorage.setItem('shidurit_user_profiles', JSON.stringify(updated));
  };

  const handleCreateProfile = () => {
    const newProfile: CompanyProfile = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'חברה חדשה',
      industry: '',
      knowledgeBase: '',
      instructions: '',
      tone: 'מקצועי',
      voice: DEFAULT_PROFILES[0].voice,
      files: [],
      isExample: false,
      themeColor: '#f5821f'
    };
    setEditingProfile(newProfile);
  };

  const handleSaveProfile = (profile: CompanyProfile) => {
    const profileToSave = { ...profile, isExample: false };
    const existsInCustom = customProfiles.find(p => p.id === profile.id);
    let updated;
    
    if (existsInCustom) {
      updated = customProfiles.map(p => p.id === profile.id ? profileToSave : p);
    } else {
      updated = [profileToSave, ...customProfiles];
    }
    
    saveCustomProfiles(updated);
    setEditingProfile(null);
  };

  const handleDeleteProfile = (id: string) => {
    const updated = customProfiles.filter(p => p.id !== id);
    saveCustomProfiles(updated);
  };

  const handleJourneyComplete = (data: TicketData, startCall: boolean) => {
    setContextData(data);
    const profile = activeJourney!;
    setActiveJourney(null);
    if (startCall) {
      setInitialCallMode('voice');
      setActiveProfile(profile);
      setIsCalling(true);
    }
  };

  const handleStartCall = (p: CompanyProfile) => {
    setInitialCallMode('voice');
    setActiveProfile(p);
    setIsCalling(true);
  };

  const handleStartChat = (p: CompanyProfile) => {
    setInitialCallMode('text');
    setActiveProfile(p);
    setIsCalling(true);
  };

  if (activeJourney) {
    return (
      <TicketJourney 
        profile={activeJourney}
        onCancel={() => setActiveJourney(null)}
        onComplete={handleJourneyComplete}
      />
    );
  }

  if (isCalling && activeProfile) {
    let enrichedInstructions = activeProfile.instructions;
    let hasContext = false;
    
    if (contextData) {
      hasContext = true;
      const details = Object.entries(contextData)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
      enrichedInstructions += `\n\nפרטים שנאספו מהטופס הדיגיטלי:\n${details}\n
      הנחיה קריטית: מכיוון שיש לך את פרטי המשתמש, עליך להיות זה שפותח את השיחה! 
      אל תחכה שהמשתמש ידבר. פנה אליו בשמו הפרטי, ציין שקיבלת את הפנייה שלו לגבי "${contextData.needs || contextData.issue || 'הנושא המבוקש'}" והצע עזרה מיידית.`;
    }

    const enrichedProfile = {
      ...activeProfile,
      instructions: enrichedInstructions
    };

    return (
      <CallScreen 
        profile={enrichedProfile} 
        initialMode={initialCallMode}
        hasContext={hasContext}
        onEndCall={() => {
          setIsCalling(false);
          setContextData(null);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-[60]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-[#f5821f] p-2 rounded-lg shadow-lg shadow-orange-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-black text-[#f5821f] tracking-tight">שידורית <span className="text-gray-800">AI</span></h1>
          </div>
          <button 
            onClick={handleCreateProfile}
            className="bg-[#f5821f] hover:bg-[#e67610] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
          >
            + הוסף חברה
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard 
          profiles={displayProfiles}
          onStartCall={handleStartCall}
          onStartChat={handleStartChat}
          onStartJourney={setActiveJourney}
          onEditProfile={setEditingProfile}
          onDeleteProfile={handleDeleteProfile}
        />
      </main>

      {editingProfile && (
        <ProfileEditor 
          profile={editingProfile}
          onSave={handleSaveProfile}
          onCancel={() => setEditingProfile(null)}
        />
      )}
    </div>
  );
};

export default App;
