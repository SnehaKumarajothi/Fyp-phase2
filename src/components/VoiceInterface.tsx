


import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from "react";
import { Mic, Volume2 } from 'lucide-react';

// small classnames helper (local fallback if projet doesn't expose one)
const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

// --- Type Definitions (Must match Index.tsx) ---
type Language = "ta" | "en";
interface Step { key: string; label: string; labelEn: string; }
// New prop contract matching Index.tsx template
interface VoiceInterfaceProps {
    isListening: boolean;
    onListeningChange: Dispatch<SetStateAction<boolean>>;
    currentStep: number;
    onStepComplete: (stepKey: string, value: string) => void;
    onDataCollectionComplete?: (finalData: Record<string, string>) => void;
    language: Language;
    steps: Step[];
    transcript: string;
    onTranscriptChange: Dispatch<SetStateAction<string>>;
}
/*interface VoiceInterfaceProps {
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;

  // 🔹 Optional for scheme questions
  onStepComplete?: (fieldKey: string, value: string) => void;

  // 🔹 Optional for data collection flow
  currentStep?: number;
  steps?: { key: string; label: string; labelEn: string }[];
  onDataCollectionComplete?: (data: Record<string, string>) => void;

  language: "ta" | "en";

  transcript: string;
  onTranscriptChange: (text: string) => void;
}*/

// --- End Type Definitions ---


const API_BASE_URL = 'http://localhost:5001';

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
    isListening,
    onListeningChange,
    currentStep,
    onStepComplete,
    onDataCollectionComplete,
    language,
    steps,
    transcript,
    onTranscriptChange,
}) => {
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const [agentText, setAgentText] = useState("சேவை தொடங்குகிறது...");
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState<number>(20);
    const [timerActive, setTimerActive] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const currentStepIndex = currentStep || 0;
    
    // Helper function (assuming /tts endpoint exists on the server)
    const tts_to_data_uri = (text: string, lang: Language) => {
        const encodedText = encodeURIComponent(text);
        // This endpoint MUST be implemented in the Flask server
        return `${API_BASE_URL}/tts?text=${encodedText}&lang=${lang}`; 
    };
    
    useEffect(() => {
        if (audioURL) {
            const audio = new Audio(audioURL);
            audio.play().catch(e => console.error("Audio playback failed:", e));
        }
    }, [audioURL]);

    // Initial load and sequential question logic
    // Initial load: fetch first agent prompt (optional)
    useEffect(() => {
        const loadInitialState = async () => {
            // Only fetch initial agent prompt when on first step
            if (currentStepIndex > 0) return;
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE_URL}/start_agent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ language })
                });
                const data = await res.json();
                if (data.agent_text) setAgentText(data.agent_text);
                if (data.audio_url) setAudioURL(data.audio_url);
            } catch (err) {
                console.error('Error starting agent:', err);
            } finally {
                setLoading(false);
            }
        };
        loadInitialState();
    }, [language, currentStepIndex]);


    // WAV encoding helper (PCM 16-bit mono, 16kHz)
    function encodeWAV(samples: Float32Array, inputSampleRate: number, outSampleRate: number) {
        let resampled = samples;
        if (inputSampleRate !== outSampleRate) {
            const ratio = inputSampleRate / outSampleRate;
            const newLength = Math.round(samples.length / ratio);
            resampled = new Float32Array(newLength);
            for (let i = 0; i < newLength; i++) {
                resampled[i] = samples[Math.round(i * ratio)] || 0;
            }
        }
        const buffer = new ArrayBuffer(44 + resampled.length * 2);
        const view = new DataView(buffer);
        function writeString(view: DataView, offset: number, str: string) {
            for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
        }
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + resampled.length * 2, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, outSampleRate, true);
        view.setUint32(28, outSampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, 'data');
        view.setUint32(40, resampled.length * 2, true);
        let offset = 44;
        for (let i = 0; i < resampled.length; i++, offset += 2) {
            let s = Math.max(-1, Math.min(1, resampled[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
        return buffer;
    }

    // Helper: Convert webm Blob to WAV Blob (mono, 16kHz, 16-bit PCM)
    const webmToWav = async (webmBlob: Blob): Promise<Blob> => {
        const arrayBuffer = await webmBlob.arrayBuffer();
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        const channelData = audioBuffer.getChannelData(0);
        const wavBuffer = encodeWAV(channelData, audioBuffer.sampleRate, 16000);
        return new Blob([wavBuffer], { type: 'audio/wav' });
    };


    const sendInteraction = async (audioBlob: Blob) => {
        setLoading(true);
        try {
            if (!audioBlob || audioBlob.size === 0) {
                setAgentText(language === 'ta' ? "ஒலி பதிவு செய்யப்படவில்லை. மீண்டும் முயற்சிக்கவும்." : "No audio recorded. Please try again.");
                return;
            }
            // Convert to WAV
            let wavBlob;
            try {
                wavBlob = await webmToWav(audioBlob);
            } catch (err) {
                setAgentText(language === 'ta' ? "WAV மாற்றம் தோல்வி. உலாவி ஆதரவு இல்லை." : "WAV conversion failed. Browser not supported.");
                return;
            }
            if (!wavBlob || wavBlob.size === 0) {
                setAgentText(language === 'ta' ? "WAV கோப்பு உருவாக்கப்படவில்லை." : "WAV file not created.");
                return;
            }
            const formData = new FormData();
            formData.append("file", wavBlob, "user_input.wav");
            formData.append("language", language);
            formData.append("step_index", String(currentStepIndex));
            formData.append("field_key", steps[currentStepIndex]?.key || "");

            const res = await fetch(`${API_BASE_URL}/agent_step`, { method: "POST", body: formData });
            if (!res.ok) {
                setAgentText(language === 'ta' ? "சேவையக பிழை. மீண்டும் முயற்சிக்கவும்." : `Server error (${res.status}). Please try again.`);
                return;
            }
            const data = await res.json();
            if (data.user_transcript_en) onTranscriptChange(data.user_transcript_en);
            if (data.agent_text) setAgentText(data.agent_text);
            if (data.audio_url) setAudioURL(data.audio_url);

            if (data.value_extracted && data.value_extracted !== 'Not Found' && data.field_key) {
                try {
                    onStepComplete(data.field_key, String(data.value_extracted));
                    // Play next agent prompt if available
                    if (data.agent_text) {
                        setTimeout(() => {
                            setAgentText(data.agent_text);
                            if (data.audio_url) {
                                setAudioURL(data.audio_url);
                            }
                        }, 500);
                    }
                } catch (e) {
                    console.warn('onStepComplete handler failed:', e);
                }
            } else if (data.value_extracted === 'Not Found') {
                setAgentText(language === 'ta' ? "மீண்டும் முயற்சிக்கவும்." : "Please try again.");
            }

            if (data.done) {
                if (typeof onDataCollectionComplete === 'function') {
                    onDataCollectionComplete(data.final_state || {});
                }
            }
        } catch (err) {
            console.error("Agent step failed:", err);
            setAgentText(language === 'ta' ? "பிழை. மீண்டும் முயற்சிக்கவும்." : "Error. Please try again.");
        } finally {
            setLoading(false);
            onListeningChange(false);
        }
    };
    const startListening = async () => {
        if (loading) return;
        try {
            onListeningChange(true);
            setTimer(20);
            setTimerActive(true);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Try webm/opus, fallback to default if not supported
            let options: MediaRecorderOptions | undefined = { mimeType: 'audio/webm;codecs=opus' };
            try {
                if (!(MediaRecorder as any).isTypeSupported || !(MediaRecorder as any).isTypeSupported(options.mimeType)) {
                    options = undefined;
                }
            } catch {
                options = undefined;
            }
            mediaRecorderRef.current = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
            audioChunksRef.current = [];
            mediaRecorderRef.current.ondataavailable = (e: BlobEvent) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mediaRecorderRef.current.onstop = () => {
                setTimerActive(false);
                if (timerRef.current) clearInterval(timerRef.current);
                // Only send if we have audio
                if (audioChunksRef.current.length === 0) {
                    setAgentText(language === 'ta' ? "ஒலி பதிவு செய்யப்படவில்லை." : "No audio recorded.");
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                sendInteraction(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };
            mediaRecorderRef.current.start(100);
            // Start countdown timer
            timerRef.current = setInterval(() => {
                setTimer((prev) => {
                    if (prev <= 1) {
                        stopListening();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } catch (err) {
            console.error("Microphone error:", err);
            setAgentText(language === 'ta' ? "மைக் பிழை." : "Mic error.");
            onListeningChange(false);
            setTimerActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const stopListening = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        setTimerActive(false);
        if (timerRef.current) clearInterval(timerRef.current);
    };
    
    // `steps` provides `label` and `labelEn` (not labelTa/labelEn) — use those keys to avoid undefined labels
    const currentStepLabel = steps[currentStepIndex]?.label || steps[currentStepIndex]?.labelEn || (language === 'ta' ? "தகவல் சேகரிப்பு" : "Data Collection");

    return (
        <div className="w-full flex flex-col items-center space-y-6 justify-center">
            {/* Constrain the inner content so it doesn't stretch the whole column */}
            <div className="w-full max-w-xl sm:max-w-2xl mx-auto">
                <div className="bg-blue-50 p-4 sm:p-6 rounded-xl w-full text-center border-2 border-blue-200 shadow-md">
                <p className="text-sm font-semibold text-blue-600 mb-1">
                   {language === 'ta' ? "கேள்வி: " : "Question: "} 
                   {currentStepLabel}
                </p>
                <p className="text-2xl font-bold text-gray-800">
                    {agentText}
                </p>
            </div>
            </div>
            
            {transcript && (
                <div className="text-center text-sm text-gray-600 w-full max-w-xl mx-auto p-2 bg-gray-50 rounded-lg">
                    {language === 'ta' ? "நீங்கள் சொன்னது: " : "You said: "}
                    <span className="font-mono text-xs">{transcript}</span>
                </div>
            )}

            <div className="mt-8 flex flex-col items-center">
                <button
                    onClick={isListening ? stopListening : startListening}
                    disabled={loading || currentStepIndex >= steps.length}
                    className={cn(
                        "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
                        loading && "bg-gray-400 cursor-not-allowed animate-pulse",
                        isListening && "bg-red-600 recording animate-pulse-red",
                        !isListening && !loading && "bg-blue-600 hover:bg-blue-700 shadow-xl"
                    )}
                >
                    {loading ? (
                        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                        <Mic className="w-8 h-8 text-white" />
                    )}
                </button>
                {isListening && timerActive && (
                    <div className="mt-2 text-center text-lg font-bold text-red-600">
                        {language === 'ta' ? `மிகவும் அதிகபட்சம்: ${timer} வினாடிகள்` : `Max: ${timer}s`}
                    </div>
                )}
                <p className="text-center text-sm mt-3 text-gray-500">
                    {isListening ? (language === 'ta' ? "பேசுகிறீர்கள்..." : "Listening...") : (loading ? (language === 'ta' ? "பகுப்பாய்வு..." : "Analyzing...") : (language === 'ta' ? "பேசத் தொடங்குங்கள்" : "Start Speaking"))}
                </p>
            </div>
        </div>
    );
};
export default VoiceInterface;
