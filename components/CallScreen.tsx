import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Chat, GenerateContentResponse } from '@google/genai';
import { CompanyProfile, CallState, ChatMessage } from '../types';
import { VOICE_MODEL_ID, TEXT_MODEL_ID } from '../constants';
import { encode, decode, decodeAudioData } from '../services/audioUtils';
import { Icon } from './Icon';

interface CallScreenProps {
  profile: CompanyProfile;
  onEndCall: () => void;
  initialMode?: 'voice' | 'text';
}

interface Toast {
  id: number;
  message: string;
  type: 'error' | 'info' | 'success';
}

const CallScreen: React.FC<CallScreenProps> = ({ profile, onEndCall, initialMode = 'voice' }) => {
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    isConnecting: true,
    isProcessingKnowledge: false,
    transcription: [],
    error: null,
    isTextMode: initialMode === 'text',
    textChatHistory: [],
    isBotTyping: false,
  });
  
  const [userSpeech, setUserSpeech] = useState("");
  const [botSpeech, setBotSpeech] = useState("");
  const [micLevel, setMicLevel] = useState(0); 
  const [currentTextInput, setCurrentTextInput] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const chatSessionRef = useRef<Chat | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const chatHistoryEndRef = useRef<HTMLDivElement>(null);
  const connectionTimeoutRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const themeColor = profile.themeColor || '#020d2b';

  const addLog = useCallback((msg: string) => {
    console.log(`[CallScreen] ${msg}`);
    setDebugLogs(prev => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev].slice(0, 50));
  }, []);

  const addToast = useCallback((message: string, type: 'error' | 'info' | 'success' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  useEffect(() => {
    if (chatHistoryEndRef.current) {
      chatHistoryEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [callState.textChatHistory]);

  const getSystemInstruction = useMemo(() => {
    return `
      זהות: אתה נציג שירות וירטואלי של חברת "${profile.name}".
      שפה: עברית בלבד (Hebrew Only). חל איסור מוחלט להשתמש באנגלית.
      
      ידע חברה:
      ${profile.knowledgeBase || "אין ידע מוגדר."}
      ${profile.websiteUrl ? `אתר החברה: ${profile.websiteUrl}` : ''}
      
      הנחיות ואיסורים:
      ${profile.instructions}
      
      טון דיבור: ${profile.tone}.
      
      כללי התנהגות:
      1. דבר אך ורק בעברית טבעית.
      2. ציית לכל איסור דיבור המופיע בהנחיות.
      3. היה פרואקטיבי - אם המשתמש שותק, שאל איך ניתן לעזור.
    `;
  }, [profile]);

  const disconnectLiveSession = useCallback(() => {
    addLog("Disconnecting live session...");
    if (connectionTimeoutRef.current) {
      window.clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    sessionPromiseRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch(e) {}
      audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      try { outputAudioContextRef.current.close(); } catch(e) {}
      outputAudioContextRef.current = null;
    }
    setUserSpeech("");
    setBotSpeech("");
    setMicLevel(0);
    setCallState(prev => ({ ...prev, isActive: false, isConnecting: false }));
  }, [addLog]);

  const connectLiveSession = useCallback(async () => {
    addLog("Initializing voice connection...");
    setCallState(prev => ({ ...prev, isConnecting: true, isTextMode: false, error: null }));
    
    try {
      if (!process.env.API_KEY) throw new Error("API Key is missing");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (audioCtx.state === 'suspended') await audioCtx.resume();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      const micSource = audioCtx.createMediaStreamSource(stream);
      micSource.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMicLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setMicLevel(average);
        if (streamRef.current) requestAnimationFrame(updateMicLevel);
      };
      updateMicLevel();

      const sessionPromise = ai.live.connect({
        model: VOICE_MODEL_ID,
        callbacks: {
          onopen: () => {
            if (connectionTimeoutRef.current) window.clearTimeout(connectionTimeoutRef.current);
            addLog("Voice connection opened.");
            setCallState(prev => ({ ...prev, isConnecting: false, isActive: true }));
            const scriptProcessor = audioCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (sessionPromiseRef.current) {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
                sessionPromiseRef.current.then(session => {
                  session.sendRealtimeInput({ 
                    media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' } 
                  });
                });
              }
            };
            micSource.connect(scriptProcessor);
            scriptProcessor.connect(audioCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) setUserSpeech(message.serverContent.inputTranscription.text);
            if (message.serverContent?.outputTranscription) setBotSpeech(prev => prev + message.serverContent?.outputTranscription?.text);
            if (message.serverContent?.turnComplete) {
              setCallState(prev => ({ ...prev, transcription: [...prev.transcription, `משתמש: ${userSpeech}`, `נציג: ${botSpeech}`] }));
              setUserSpeech(""); setBotSpeech("");
            }
            const modelTurnParts = message.serverContent?.modelTurn?.parts;
            if (modelTurnParts && modelTurnParts.length > 0 && outputAudioContextRef.current) {
              for (const part of modelTurnParts) {
                if (part.inlineData?.data) {
                  const ctx = outputAudioContextRef.current;
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                  const audioBuffer = await decodeAudioData(decode(part.inlineData.data), ctx, 24000, 1);
                  const source = ctx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(ctx.destination);
                  source.addEventListener('ended', () => sourcesRef.current.delete(source));
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  sourcesRef.current.add(source);
                }
              }
            }
          },
          onerror: (e) => setCallState(prev => ({ ...prev, error: 'שגיאת תקשורת עם שרת ה-AI.', isConnecting: false })),
          onclose: () => setCallState(prev => ({ ...prev, isActive: false, isConnecting: false }))
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: profile.voice } } },
          systemInstruction: getSystemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });
      sessionPromiseRef.current = sessionPromise;
      connectionTimeoutRef.current = window.setTimeout(() => {
        if (!callState.isActive && callState.isConnecting) {
          setCallState(prev => ({ ...prev, error: "פסק זמן בחיבור הקולי.", isConnecting: false }));
          disconnectLiveSession();
        }
      }, 20000);
    } catch (err: any) {
      setCallState(prev => ({ ...prev, error: err.message, isConnecting: false }));
      disconnectLiveSession();
    }
  }, [profile, getSystemInstruction, disconnectLiveSession, addLog]);

  const disconnectTextChatSession = useCallback(() => {
    chatSessionRef.current = null;
    setCallState(prev => ({ ...prev, isActive: false, isConnecting: false, textChatHistory: [], isBotTyping: false }));
    setCurrentTextInput("");
  }, []);

  const connectTextChatSession = useCallback(async () => {
    setCallState(prev => ({ ...prev, isConnecting: true, isTextMode: true, error: null }));
    try {
      if (!process.env.API_KEY) throw new Error("API Key is missing");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      chatSessionRef.current = ai.chats.create({
        model: TEXT_MODEL_ID,
        config: { systemInstruction: getSystemInstruction },
      });
      setCallState(prev => ({ ...prev, isConnecting: false, isActive: true }));
    } catch (err: any) {
      setCallState(prev => ({ ...prev, error: err.message, isConnecting: false }));
    }
  }, [getSystemInstruction]);

  const toggleInputMode = useCallback(() => {
    if (callState.isTextMode) {
      disconnectTextChatSession();
      connectLiveSession();
    } else {
      disconnectLiveSession();
      connectTextChatSession();
    }
  }, [callState.isTextMode, disconnectLiveSession, connectLiveSession, disconnectTextChatSession, connectTextChatSession]);

  const handleSendText = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentTextInput.trim() || !chatSessionRef.current) return;
    const userMsg = currentTextInput.trim();
    setCurrentTextInput("");
    setCallState(prev => ({ ...prev, textChatHistory: [...prev.textChatHistory, { sender: 'user', text: userMsg }], isBotTyping: true }));
    try {
      const stream = await chatSessionRef.current.sendMessageStream({ message: userMsg });
      setCallState(prev => ({ ...prev, textChatHistory: [...prev.textChatHistory, { sender: 'bot', text: "" }] }));
      let fullBotResponse = "";
      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullBotResponse += c.text;
          setCallState(prev => {
            const newHistory = [...prev.textChatHistory];
            newHistory[newHistory.length - 1] = { sender: 'bot', text: fullBotResponse };
            return { ...prev, textChatHistory: newHistory };
          });
        }
      }
    } catch (err: any) {
      addLog(`Text chat error: ${err.message}`);
      addToast("שגיאה בשליחת ההודעה.", "error");
    } finally {
      setCallState(prev => ({ ...prev, isBotTyping: false }));
    }
  }, [currentTextInput, addLog, addToast]);

  useEffect(() => {
    if (initialMode === 'text') connectTextChatSession();
    else connectLiveSession();
    return () => { disconnectLiveSession(); disconnectTextChatSession(); };
  }, [connectLiveSession, disconnectLiveSession, disconnectTextChatSession, connectTextChatSession, initialMode]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col text-white select-none overflow-hidden transition-colors duration-1000" style={{ backgroundColor: themeColor }}>
      <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
      
      {/* Header */}
      <div className="p-8 flex flex-row justify-between items-start relative z-10 animate-fade-scale">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { disconnectLiveSession(); disconnectTextChatSession(); onEndCall(); }} 
            className="bg-[#ff4d4d] hover:bg-red-600 w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-2xl active:scale-90"
          >
            <svg className="w-7 h-7 text-white stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button 
            onClick={toggleInputMode}
            className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg active:scale-95 ${
              callState.isTextMode ? 'bg-white/20' : 'bg-white/10'
            } hover:bg-white/30`}
          >
            {callState.isTextMode ? 'מעבר לדיבור קולי' : 'מעבר להקלדה'}
          </button>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div className="flex flex-col items-end">
            <h2 className="text-2xl font-black tracking-tight">{profile.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${callState.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">נציג חי בעברית</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-6 z-10">
        {callState.isConnecting ? (
          <div className="flex flex-col items-center gap-8 animate-pulse">
            <div className="w-20 h-20 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
            <p className="text-xl font-bold opacity-60">מייצר חיבור מאובטח...</p>
          </div>
        ) : callState.error ? (
          <div className="text-center p-10 bg-black/30 backdrop-blur-3xl rounded-[3rem] border border-white/10 max-w-sm animate-elastic">
            <p className="text-red-300 font-bold mb-8 text-lg">{callState.error}</p>
            <button 
              onClick={callState.isTextMode ? connectTextChatSession : connectLiveSession} 
              className="bg-white text-gray-900 px-10 py-4 rounded-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all"
            >
              נסה שוב
            </button>
          </div>
        ) : callState.isTextMode ? (
          <div className="w-full max-w-2xl h-full flex flex-col py-4 animate-fade-scale">
            <div className="flex-1 overflow-y-auto px-4 space-y-4 custom-scrollbar dark-scrollbar mb-6 pb-4">
              {callState.textChatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-5 rounded-[2rem] max-w-[85%] shadow-xl text-lg leading-relaxed ${
                    msg.sender === 'user' ? 'bg-blue-600 rounded-br-none msg-user' : 'bg-white/10 backdrop-blur-md border border-white/20 rounded-bl-none msg-bot'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {callState.isBotTyping && (
                <div className="flex justify-start">
                  <div className="p-5 rounded-[2rem] rounded-bl-none bg-white/10 backdrop-blur-md border border-white/20 flex gap-2 items-center msg-bot">
                    <div className="typing-dot bg-white"></div>
                    <div className="typing-dot bg-white"></div>
                    <div className="typing-dot bg-white"></div>
                  </div>
                </div>
              )}
              <div ref={chatHistoryEndRef} />
            </div>
            <form onSubmit={handleSendText} className="flex gap-2 p-2 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl focus-within:border-white/30 transition-all duration-300">
              <input 
                autoFocus
                type="text"
                value={currentTextInput}
                onChange={e => setCurrentTextInput(e.target.value)}
                placeholder="הקלד כאן הודעה..."
                className="flex-1 bg-transparent px-8 py-5 outline-none text-white text-xl placeholder:text-white/30"
              />
              <button 
                type="submit" 
                disabled={!currentTextInput.trim() || callState.isBotTyping} 
                className="bg-white text-gray-900 px-10 rounded-[2rem] font-black text-lg transition-all shadow-xl hover:bg-gray-100 active:scale-95 disabled:opacity-20 disabled:scale-100"
              >
                שלח
              </button>
            </form>
          </div>
        ) : (
          <div className="w-full max-w-xl text-center flex flex-col items-center animate-elastic">
            <div className="mb-16 flex gap-1.5 items-end h-24">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-2 bg-blue-400 rounded-full transition-all duration-100 shadow-[0_0_15px_rgba(96,165,250,0.5)]"
                  style={{ height: `${Math.max(10, micLevel * (0.4 + Math.random() * 0.8))}%` }}
                ></div>
              ))}
            </div>

            <div className="bg-white/5 backdrop-blur-3xl rounded-[4rem] p-12 border border-white/10 w-full shadow-2xl relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
               <div className="min-h-[160px] flex flex-col justify-center relative z-10">
                 {userSpeech && <p className="text-white/40 text-lg mb-6 font-medium animate-fade-scale italic">שמעתי: "{userSpeech}"</p>}
                 <p className="text-4xl font-black leading-tight tracking-tight">
                   {botSpeech || (micLevel > 25 ? "אני מקשיב..." : "נא לדבר...")}
                 </p>
               </div>
            </div>
            
            <div className="mt-12 opacity-40 text-sm font-bold animate-pulse">
               השיחה מוקלטת לצרכי שיפור השירות
            </div>
          </div>
        )}
      </div>

      {/* Transcription drawer for voice mode */}
      {!callState.isTextMode && (
        <div className="h-1/4 bg-black/30 backdrop-blur-md border-t border-white/5 overflow-y-auto p-8 z-10 custom-scrollbar dark-scrollbar">
          <div className="max-w-2xl mx-auto space-y-4">
             {callState.transcription.length === 0 && <p className="text-center text-white/20 italic font-medium">התמליל יופיע כאן במהלך השיחה...</p>}
             {callState.transcription.map((line, i) => (
               <div key={i} className="text-sm opacity-60 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors animate-fade-scale">
                 {line}
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CallScreen;