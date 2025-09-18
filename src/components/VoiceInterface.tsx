import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Volume2, RotateCcw, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceInterfaceProps {
  isListening: boolean;
  onListeningChange: (listening: boolean) => void;
  currentStep: number;
  onStepComplete: (step: string, data: string) => void;
  language: string;
  steps: Array<{ key: string; label: string; labelEn: string }>;
  transcript: string;
  onTranscriptChange: (transcript: string) => void;
}

export const VoiceInterface = ({
  isListening,
  onListeningChange,
  currentStep,
  onStepComplete,
  language,
  steps,
  transcript,
  onTranscriptChange,
}: VoiceInterfaceProps) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResponse, setCurrentResponse] = useState("");

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  // Simulate audio level animation when listening
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isListening) {
      interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
    } else {
      setAudioLevel(0);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  const handleStartListening = () => {
    onListeningChange(true);
    // Simulate greeting or question in Tamil
    const questions = {
      ta: [
        "உங்கள் பெயரை சொல்லுங்கள்?",
        "உங்கள் வயதை சொல்லுங்கள்?", 
        "உங்கள் முகவரியை சொல்லுங்கள்?",
        "உங்கள் ஆண்டு வருமானத்தை சொல்லுங்கள்?",
        "உங்கள் சமூகத்தை குறிப்பிடுங்கள்?",
        "உங்கள் நிலைமையை விவரிக்கவும்?"
      ],
      en: [
        "Please tell me your name?",
        "Please tell me your age?",
        "Please provide your address?", 
        "Please specify your yearly earning?",
        "Please specify your community?",
        "Please describe your situation?"
      ]
    };

    // Simulate AI voice output
    setTimeout(() => {
      if (language === "ta") {
        setCurrentResponse(questions.ta[currentStep]);
      } else {
        setCurrentResponse(questions.en[currentStep]);
      }
    }, 500);
  };

  const handleStopListening = () => {
    onListeningChange(false);
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      // Simulate extracted data
      const mockResponse = `Response for ${currentStepData.key}`;
      onStepComplete(currentStepData.key, mockResponse);
      setCurrentResponse("");
      onTranscriptChange("");
    }, 2000);
  };

  const handleConfirmResponse = () => {
    if (transcript.trim()) {
      onStepComplete(currentStepData.key, transcript);
      setCurrentResponse("");
      onTranscriptChange("");
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Current Question Display */}
      <Card className="mb-6 bg-gradient-primary text-white border-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold">
              {currentStep + 1}
            </div>
            <h3 className="text-lg font-semibold">
              {language === "ta" ? "தற்போதைய கேள்வி" : "Current Question"}
            </h3>
          </div>
          <p className="text-xl font-medium">
            {language === "ta" ? currentStepData.label : currentStepData.labelEn}
          </p>
          {currentResponse && (
            <p className="mt-2 text-white/90 italic">
              "{currentResponse}"
            </p>
          )}
        </div>
      </Card>

      {/* Voice Visualization */}
      <div className="flex-1 flex items-center justify-center mb-6">
        <div className="relative">
          {/* Main voice button */}
          <Button
            onClick={isListening ? handleStopListening : handleStartListening}
            disabled={isProcessing}
            size="lg"
            className={cn(
              "w-32 h-32 rounded-full border-4 transition-all duration-300",
              isListening 
                ? "bg-voice-active hover:bg-voice-active border-voice-active shadow-voice animate-pulse" 
                : "bg-primary hover:bg-primary/90 border-primary shadow-kiosk",
              isProcessing && "bg-voice-processing border-voice-processing animate-spin"
            )}
          >
            {isProcessing ? (
              <RotateCcw className="w-8 h-8" />
            ) : isListening ? (
              <MicOff className="w-8 h-8" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </Button>

          {/* Audio level visualization */}
          {isListening && (
            <div className="absolute inset-0 -m-8">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-voice-active/30 animate-ping"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    transform: `scale(${1 + (audioLevel / 100) * (i + 1) * 0.1})`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status and Controls */}
      <div className="space-y-4">
        <div className="text-center">
          <Badge 
            variant={isListening ? "default" : "secondary"}
            className={isListening ? "bg-voice-active" : ""}
          >
            {isProcessing 
              ? (language === "ta" ? "செயலாக்குகிறது..." : "Processing...")
              : isListening 
                ? (language === "ta" ? "கேட்டுக் கொண்டிருக்கிறது..." : "Listening...")
                : (language === "ta" ? "மைக்ரோஃபோனை அழுத்தவும்" : "Press microphone to start")
            }
          </Badge>
        </div>

        {/* Live Transcript */}
        {(transcript || isListening) && (
          <Card className="bg-muted/50 border-dashed">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  {language === "ta" ? "நேரடி உரை" : "Live Transcript"}
                </span>
              </div>
              <p className="text-sm min-h-[20px]">
                {transcript || (isListening ? "..." : "")}
              </p>
              {transcript && !isProcessing && (
                <div className="mt-3 flex gap-2">
                  <Button 
                    onClick={handleConfirmResponse}
                    size="sm"
                    className="bg-success hover:bg-success/90"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {language === "ta" ? "உறுதிப்படுத்து" : "Confirm"}
                  </Button>
                  <Button 
                    onClick={() => onTranscriptChange("")}
                    size="sm"
                    variant="outline"
                  >
                    {language === "ta" ? "அழி" : "Clear"}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Instructions */}
        <div className="text-center text-sm text-muted-foreground">
          {isLastStep 
            ? (language === "ta" 
                ? "உங்கள் சூழ்நிலையை விரிவாக விவரிக்கவும்"
                : "Please describe your situation in detail")
            : (language === "ta"
                ? "கேள்விக்கு தெளிவாக பதிலளிக்கவும்"
                : "Please respond clearly to the question"
              )
          }
        </div>
      </div>
    </div>
  );
};