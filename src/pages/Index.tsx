import { useState } from "react";
import { VoiceInterface } from "@/components/VoiceInterface";
import { DataCollectionProgress } from "@/components/DataCollectionProgress";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Settings, Volume2 } from "lucide-react";

interface UserData {
  name: string;
  age: string;
  address: string;
  yearlyEarning: string;
  community: string;
  situation: string;
}

const Index = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("ta");
  const [userData, setUserData] = useState<Partial<UserData>>({});
  const [currentTranscript, setCurrentTranscript] = useState("");

  const steps = [
    { key: "name", label: "பெயர்", labelEn: "Name" },
    { key: "age", label: "வயது", labelEn: "Age" },
    { key: "address", label: "முகவரி", labelEn: "Address" },
    { key: "yearlyEarning", label: "ஆண்டு வருமானம்", labelEn: "Yearly Earning" },
    { key: "community", label: "சமூகம்", labelEn: "Community" },
    { key: "situation", label: "நிலைமை விளக்கம்", labelEn: "Situation Description" },
  ];

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="bg-kiosk-header text-white p-6 shadow-kiosk">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">தகவல் சேகரிப்பு முகவர்</h1>
              <p className="text-white/80">Data Collection Agent</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
              {selectedLanguage === "ta" ? "தமிழ்" : "English"}
            </Badge>
            <LanguageSelector 
              selectedLanguage={selectedLanguage}
              onLanguageChange={setSelectedLanguage}
            />
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          
          {/* Progress Panel */}
          <div className="lg:col-span-1">
            <Card className="h-full bg-kiosk-surface shadow-card border-0">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6 text-kiosk-header">
                  {selectedLanguage === "ta" ? "முன்னேற்றம்" : "Progress"}
                </h2>
                <DataCollectionProgress 
                  steps={steps}
                  currentStep={currentStep}
                  userData={userData}
                  language={selectedLanguage}
                />
              </div>
            </Card>
          </div>

          {/* Main Voice Interface */}
          <div className="lg:col-span-2">
            <Card className="h-full bg-kiosk-surface shadow-card border-0">
              <div className="p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-semibold text-kiosk-header">
                    {selectedLanguage === "ta" ? "குரல் உரையாடல்" : "Voice Interaction"}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-5 h-5 text-muted-foreground" />
                    <Settings className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>

                <VoiceInterface
                  isListening={isListening}
                  onListeningChange={setIsListening}
                  currentStep={currentStep}
                  onStepComplete={(step, data) => {
                    setUserData(prev => ({ ...prev, [step]: data }));
                    if (currentStep < steps.length - 1) {
                      setCurrentStep(prev => prev + 1);
                    }
                  }}
                  language={selectedLanguage}
                  steps={steps}
                  transcript={currentTranscript}
                  onTranscriptChange={setCurrentTranscript}
                />
              </div>
            </Card>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-6">
          <Card className="bg-kiosk-surface shadow-card border-0">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full transition-colors ${
                  isListening ? "bg-voice-active shadow-voice" : "bg-voice-inactive"
                }`} />
                <span className="text-sm font-medium text-kiosk-header">
                  {selectedLanguage === "ta" 
                    ? (isListening ? "கேட்டுக் கொண்டிருக்கிறது..." : "செயலற்ற நிலை")
                    : (isListening ? "Listening..." : "Inactive")
                  }
                </span>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {selectedLanguage === "ta" 
                  ? `படி ${currentStep + 1} / ${steps.length}`
                  : `Step ${currentStep + 1} of ${steps.length}`
                }
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;