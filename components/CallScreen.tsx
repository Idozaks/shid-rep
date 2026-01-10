
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
  const [micLevel, setMicLevel] = useState(0); // For visual feedback
  const [currentTextInput, setCurrentTextInput] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

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
                    media: { 
                      data: encode(new Uint8Array(int16.buffer)), 
                      mimeType: 'audio/pcm;rate=16000' 
                    } 
                  });
                });
              }
            };
            micSource.connect(scriptProcessor);
            scriptProcessor.connect(audioCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setUserSpeech(message.serverContent.inputTranscription.text);
            }
            if (message.serverContent?.outputTranscription) {
              setBotSpeech(prev => prev + message.serverContent?.outputTranscription?.text);
            }
            if (message.serverContent?.turnComplete) {
              setCallState(prev => ({ 
                ...prev, 
                transcription: [...prev.transcription, `משתמש: ${userSpeech}`, `נציג: ${botSpeech}`] 
              }));
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

    setCallState(prev => ({
      ...prev,
      textChatHistory: [...prev.textChatHistory, { sender: 'user', text: userMsg }],
      isBotTyping: true,
    }));

    try {
      const stream = await chatSessionRef.current.sendMessageStream({ message: userMsg });
      
      setCallState(prev => ({
        ...prev,
        textChatHistory: [...prev.textChatHistory, { sender: 'bot', text: "" }]
      }));

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
    if (initialMode === 'text') {
      connectTextChatSession();
    } else {
      connectLiveSession();
    }
    return () => { disconnectLiveSession(); disconnectTextChatSession(); };
  }, [connectLiveSession, disconnectLiveSession, disconnectTextChatSession, connectTextChatSession, initialMode]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col text-white select-none overflow-hidden" style={{ backgroundColor: themeColor }}>
      <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
      
      <div className="p-8 flex flex-row justify-between items-start relative z-10">
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
              callState.isTextMode ? 'bg-blue-600' : 'bg-white/10'
            }`}
          >
            {callState.isTextMode ? 'מעבר לדיבור' : 'מעבר להקלדה'}
          </button>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div className="flex flex-col items-end">
            <h2 className="text-2xl font-black">{profile.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${callState.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <p className="text-white/60 text-[10px] font-bold">נציג חי בעברית</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative px-6 z-10">
        {callState.isConnecting ? (
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
            <p className="text-lg font-bold opacity-80">מתחבר...</p>
          </div>
        ) : callState.error ? (
          <div className="text-center p-8 bg-red-500/10 rounded-3xl border border-red-500/20 max-w-sm">
            <p className="text-red-300 font-bold mb-6">{callState.error}</p>
            <button onClick={callState.isTextMode ? connectTextChatSession : connectLiveSession} className="bg-white text-gray-900 px-8 py-3 rounded-xl font-bold">נסה שוב</button>
          </div>
        ) : callState.isTextMode ? (
          <div className="w-full max-w-2xl h-full flex flex-col py-4">
            <div className="flex-1 overflow-y-auto px-2 space-y-4 custom-scrollbar mb-4">
              {callState.textChatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-2xl max-w-[85%] shadow-md ${msg.sender === 'user' ? 'bg-blue-600 rounded-br-none' : 'bg-white/10 border border-white/20 rounded-bl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {callState.isBotTyping && (
                <div className="flex justify-start">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 animate-pulse text-sm opacity-60">
                    הנציג כותב...
                  </div>
                </div>
              )}
              <div ref={chatHistoryEndRef} />
            </div>
            <form onSubmit={handleSendText} className="flex gap-2 p-2 bg-white/5 rounded-3xl border border-white/10">
              <input 
                autoFocus
                type="text"
                value={currentTextInput}
                onChange={e => setCurrentTextInput(e.target.value)}
                placeholder="הקלד כאן..."
                className="flex-1 bg-transparent px-6 py-4 outline-none text-white text-lg"
              />
              <button type="submit" disabled={!currentTextInput.trim() || callState.isBotTyping} className="bg-white text-gray-900 px-8 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50">שלח</button>
            </form>
          </div>
        ) : (
          <div className="w-full max-w-xl text-center flex flex-col items-center">
            <div className="mb-12 flex gap-1 items-end h-16">
              {[...Array(15)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-1.5 bg-blue-400 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(10, micLevel * (0.5 + Math.random()))}%` }}
                ></div>
              ))}
            </div>

            <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/10 w-full shadow-2xl">
               <div className="min-h-[150px] flex flex-col justify-center">
                 {userSpeech && <p className="text-white/40 text-sm mb-4">שמעתי: "{userSpeech}"</p>}
                 <p className="text-3xl font-black leading-tight">
                   {botSpeech || (micLevel > 20 ? "אני מקשיב..." : "נא לדבר...")}
                 </p>
               </div>
            </div>
          </div>
        )}
      </div>

      {!callState.isTextMode && (
        <div className="h-1/4 bg-black/20 border-t border-white/5 overflow-y-auto p-8 z-10">
          <div className="max-w-2xl mx-auto space-y-3">
             {callState.transcription.map((line, i) => (
               <div key={i} className="text-sm opacity-60 bg-white/5 p-3 rounded-xl">{line}</div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CallScreen;
