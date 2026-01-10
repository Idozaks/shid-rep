
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Chat, GenerateContentResponse } from '@google/genai';
import { CompanyProfile, CallState, ChatMessage } from '../types';
import { VOICE_MODEL_ID, TEXT_MODEL_ID } from '../constants';
import { encode, decode, decodeAudioData } from '../services/audioUtils';

interface CallScreenProps {
  profile: CompanyProfile;
  onEndCall: () => void;
  initialMode?: 'voice' | 'text';
  hasContext?: boolean;
}

const CallScreen: React.FC<CallScreenProps> = ({ profile, onEndCall, initialMode = 'voice', hasContext = false }) => {
  const [isTextMode, setIsTextMode] = useState(initialMode === 'text');
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Unified history for both modes
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);
  
  // Real-time voice UI states
  const [userSpeech, setUserSpeech] = useState("");
  const [botSpeech, setBotSpeech] = useState("");
  const [micLevel, setMicLevel] = useState(0); 
  const [currentTextInput, setCurrentTextInput] = useState("");

  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const chatSessionRef = useRef<Chat | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const chatHistoryEndRef = useRef<HTMLDivElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const hasTriggeredInitialRef = useRef(false);

  const themeColor = profile.themeColor || '#020d2b';

  useEffect(() => {
    chatHistoryEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isBotTyping]);

  const getSystemInstruction = useMemo(() => {
    let historyContext = "";
    if (history.length > 0) {
      historyContext = "\n\nהיסטוריית השיחה עד כה (להקשר בלבד):\n" + 
        history.map(m => `${m.sender === 'user' ? 'לקוח' : 'נציג'}: ${m.text}`).join('\n');
    }

    return `
      זהות: אתה נציג שירות וירטואלי של חברת "${profile.name}".
      שפה: עברית בלבד (Hebrew Only).
      
      ידע חברה:
      ${profile.knowledgeBase || "אין ידע מוגדר."}
      ${profile.websiteUrl ? `אתר החברה: ${profile.websiteUrl}` : ''}
      
      הנחיות:
      ${profile.instructions}
      
      טון: ${profile.tone}.
      
      כללים קריטיים ובלתי ניתנים לערעור:
      1. עליך תמיד להיות הראשון שפותח את השיחה! אל תחכה למשתמש.
      2. אם יש לך פרטי הקשר מהטופס (Context), פתח בפנייה אישית בשם המשתמש.
      3. הצג את עצמך כנציג של ${profile.name} ושאל איך תוכל לעזור.
      4. דבר אך ורק בעברית טבעית וזורמת.
      ${historyContext}
    `;
  }, [profile, history]);

  const handleSendText = useCallback(async (textOverride?: string) => {
    const userMsg = textOverride || currentTextInput.trim();
    if (!userMsg || !chatSessionRef.current) return;
    
    // Only show user message in history if it's not our internal "start" trigger
    if (!textOverride) {
      setCurrentTextInput("");
      setHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    }
    
    setIsBotTyping(true);

    try {
      const stream = await chatSessionRef.current.sendMessageStream({ message: userMsg });
      let fullBotResponse = "";
      
      // Add empty bot message to history that will be filled
      setHistory(prev => [...prev, { sender: 'bot', text: "" }]);

      for await (const chunk of stream) {
        const c = chunk as GenerateContentResponse;
        if (c.text) {
          fullBotResponse += c.text;
          setHistory(prev => {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = { sender: 'bot', text: fullBotResponse };
            return newHistory;
          });
        }
      }
    } catch (err: any) {
      setError('שגיאה בתקשורת עם השרת.');
    } finally {
      setIsBotTyping(false);
    }
  }, [currentTextInput, chatSessionRef]);

  const disconnectSessions = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close().catch(() => {});
      outputAudioContextRef.current = null;
    }
    sessionPromiseRef.current = null;
    chatSessionRef.current = null;
    setIsActive(false);
  }, []);

  const connectLiveSession = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      audioCtx.createMediaStreamSource(stream).connect(analyser);

      const updateMicLevel = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        setMicLevel(dataArray.reduce((a, b) => a + b) / dataArray.length);
        if (streamRef.current) requestAnimationFrame(updateMicLevel);
      };
      updateMicLevel();

      const sessionPromise = ai.live.connect({
        model: VOICE_MODEL_ID,
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            
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
            audioCtx.createMediaStreamSource(stream).connect(scriptProcessor);
            scriptProcessor.connect(audioCtx.destination);

            // ALWAYS nudge the bot to start the call if this is the very beginning
            if (history.length === 0) {
              sessionPromise.then(session => {
                // Send 200ms of silence to trigger the model's first proactive turn
                const silence = new Int16Array(3200).fill(0);
                session.sendRealtimeInput({ 
                  media: { data: encode(new Uint8Array(silence.buffer)), mimeType: 'audio/pcm;rate=16000' } 
                });
              });
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setUserSpeech(message.serverContent.inputTranscription.text);
            }
            if (message.serverContent?.outputTranscription) {
              setBotSpeech(prev => prev + message.serverContent?.outputTranscription?.text);
            }
            if (message.serverContent?.turnComplete) {
              const uText = userSpeech;
              const bText = botSpeech;
              // Only add to history if there's actual content
              if (uText || bText) {
                setHistory(prev => [
                  ...prev, 
                  ...(uText ? [{ sender: 'user' as const, text: uText }] : []), 
                  ...(bText ? [{ sender: 'bot' as const, text: bText }] : [])
                ]);
              }
              setUserSpeech(""); 
              setBotSpeech("");
            }

            const modelTurnParts = message.serverContent?.modelTurn?.parts;
            if (modelTurnParts && outputAudioContextRef.current) {
              for (const part of modelTurnParts) {
                if (part.inlineData?.data) {
                  const ctx = outputAudioContextRef.current;
                  nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                  const audioBuffer = await decodeAudioData(decode(part.inlineData.data), ctx, 24000, 1);
                  const source = ctx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(ctx.destination);
                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                }
              }
            }
          },
          onerror: () => setError('שגיאה בחיבור הקולי.'),
          onclose: () => setIsActive(false)
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
    } catch (err) {
      setError('לא ניתן לגשת למיקרופון.');
    }
  }, [profile, getSystemInstruction, userSpeech, botSpeech, history.length]);

  const connectTextChatSession = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Map history for the Chat API
      const chatHistory = history.map(h => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }]
      }));

      chatSessionRef.current = ai.chats.create({
        model: TEXT_MODEL_ID,
        config: { systemInstruction: getSystemInstruction },
        history: chatHistory
      });
      setIsConnecting(false);
      setIsActive(true);

      // If starting fresh, trigger the bot greeting immediately
      if (history.length === 0) {
        handleSendText("שלום, הצג את עצמך כנציג של החברה והתחל את השיחה. אם יש לך פרטי משתמש, השתמש בהם.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [getSystemInstruction, history, handleSendText]);

  useEffect(() => {
    if (isTextMode) connectTextChatSession();
    else connectLiveSession();
    return () => disconnectSessions();
  }, [isTextMode]);

  const toggleMode = () => {
    disconnectSessions();
    setIsTextMode(!isTextMode);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col text-white overflow-hidden transition-all duration-700" style={{ backgroundColor: themeColor }}>
      {/* Dynamic Background Effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 -left-1/4 w-full h-full bg-white/5 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-0 -right-1/4 w-full h-full bg-white/5 blur-[120px] rounded-full animate-pulse stagger-2"></div>
      </div>

      {/* Header */}
      <div className="p-4 sm:p-8 flex justify-between items-center relative z-10 animate-fade-scale">
        <div className="flex items-center gap-4">
          <button onClick={onEndCall} className="bg-red-500 hover:bg-red-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl active:scale-90 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <button onClick={toggleMode} className="bg-white/10 px-6 py-3 rounded-2xl font-black text-sm hover:bg-white/20 transition-all shadow-lg active:scale-95">
            {isTextMode ? 'מעבר לקול' : 'מעבר להקלדה'}
          </button>
        </div>
        <div className="text-right">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">{profile.name}</h2>
          <div className="flex items-center gap-1.5 justify-end">
             <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
             <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest">נציג פעיל</span>
          </div>
        </div>
      </div>

      {/* Main UI */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4 z-10 min-h-0">
        {isConnecting ? (
          <div className="animate-pulse flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            <p className="font-black text-xl opacity-60">מתחבר לנציג...</p>
          </div>
        ) : error ? (
          <div className="text-center p-8 bg-black/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 max-w-sm animate-elastic shadow-2xl">
            <p className="text-red-300 font-bold mb-6 text-lg">{error}</p>
            <button onClick={() => isTextMode ? connectTextChatSession() : connectLiveSession()} className="bg-white text-gray-900 px-10 py-4 rounded-2xl font-black shadow-2xl active:scale-95 transition-all">נסה שוב</button>
          </div>
        ) : isTextMode ? (
          <div className="w-full max-w-2xl h-full flex flex-col py-4 animate-fade-scale">
            <div className="flex-1 overflow-y-auto px-4 space-y-4 custom-scrollbar mb-4 pb-4">
              {history.map((msg, i) => (
                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 sm:p-5 rounded-2xl max-w-[85%] shadow-xl text-lg ${msg.sender === 'user' ? 'bg-blue-600 rounded-br-none msg-user' : 'bg-white/10 border border-white/20 rounded-bl-none msg-bot'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isBotTyping && (
                <div className="flex justify-start">
                   <div className="p-4 bg-white/5 rounded-2xl rounded-bl-none flex gap-2 items-center shadow-lg"><div className="typing-dot bg-white"></div><div className="typing-dot bg-white"></div><div className="typing-dot bg-white"></div></div>
                </div>
              )}
              <div ref={chatHistoryEndRef} />
            </div>
            <form onSubmit={e => { e.preventDefault(); handleSendText(); }} className="flex gap-2 p-2 bg-white/5 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl focus-within:bg-white/10 transition-all">
              <input value={currentTextInput} onChange={e => setCurrentTextInput(e.target.value)} placeholder="הקלד כאן..." className="flex-1 bg-transparent px-6 py-4 outline-none text-white text-lg placeholder:text-white/30" />
              <button type="submit" disabled={!currentTextInput.trim() || isBotTyping} className="bg-white text-gray-900 px-8 rounded-[1.8rem] font-black hover:bg-gray-100 disabled:opacity-20 transition-all active:scale-95 shadow-xl">שלח</button>
            </form>
          </div>
        ) : (
          <div className="w-full max-w-xl text-center space-y-12 animate-fade-scale">
            <div className="flex gap-1.5 items-end h-24 justify-center">
              {[...Array(20)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-2 bg-blue-400 rounded-full transition-all duration-100 shadow-[0_0_15px_rgba(96,165,250,0.4)]" 
                  style={{ height: `${10 + Math.random() * micLevel}%` }}
                ></div>
              ))}
            </div>
            <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 sm:p-14 border border-white/10 shadow-2xl min-h-[220px] flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
              {userSpeech && <p className="text-white/40 text-xl mb-6 italic animate-fade-scale">שמעתי: "{userSpeech}"</p>}
              <p className="text-3xl sm:text-4xl font-black leading-tight tracking-tight">
                {botSpeech || (micLevel > 15 ? "אני מקשיב..." : "נא לדבר...")}
              </p>
            </div>
            <div className="opacity-40 text-sm font-bold animate-pulse tracking-wide">נציג ה-AI מוכן לשירותך</div>
          </div>
        )}
      </div>

      {/* Transcription drawer for voice mode (Unified History) */}
      {!isTextMode && (
        <div className="h-40 bg-black/30 backdrop-blur-xl p-6 overflow-y-auto custom-scrollbar border-t border-white/5 shrink-0">
          <div className="max-w-2xl mx-auto space-y-3">
            {history.length === 0 && <p className="text-center opacity-20 italic">השיחה תופיע כאן ברגע שתתחיל...</p>}
            {history.map((h, i) => (
              <div key={i} className={`text-sm p-3 rounded-xl border border-white/5 ${h.sender === 'user' ? 'bg-blue-900/20 text-blue-100' : 'bg-white/5 text-white/80'}`}>
                <strong className="font-black ml-2">{h.sender === 'user' ? 'לקוח:' : 'נציג:'}</strong>
                {h.text}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CallScreen;
