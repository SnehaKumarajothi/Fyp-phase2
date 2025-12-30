import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, Landmark, Wallet } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
type Language = "ta" | "en";
export default function Home() {
  const navigate = useNavigate();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("ta");
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLanguage === "ta" ? "ta-IN" : "en-IN";
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* HEADER */}
      <header className="bg-kiosk-header text-white shadow-kiosk">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Mic className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {selectedLanguage === "ta" ? "ஸ்மார்ட் வங்கி உதவியாளர்" : "Smart Banking Assistant"}
              </h1>
              <p className="text-white/80">
                {selectedLanguage === "ta" ? "தகவல் & சேவைகள்" : "Information & Services"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge className="bg-white/20 text-white border-white/30">
              {selectedLanguage === "ta" ? "தமிழ்" : "English"}
            </Badge>
            <LanguageSelector selectedLanguage={selectedLanguage} onLanguageChange={(lang: string) => { if (lang === "ta" || lang === "en") setSelectedLanguage(lang as Language); }} />
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-center min-h-[calc(100vh-120px)]">
        <Card className="bg-kiosk-surface shadow-card border-0 w-full max-w-3xl p-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-kiosk-header">
              {selectedLanguage === "ta"
                ? "எப்படி உதவலாம்?"
                : "How can we help you?"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {selectedLanguage === "ta"
                ? "தொடர ஒரு விருப்பத்தைத் தேர்வு செய்யவும்"
                : "Select an option to continue"}
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Scheme Recommendation */}
            <Button
              className="h-32 text-xl flex flex-col gap-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg"
              onClick={() => {
                speak("திட்ட பரிந்துரை தொடங்கப்படுகிறது");
                navigate("/scheme");
              }}
            >
              <Landmark className="w-10 h-10" />
              <span>
                {selectedLanguage === "ta"
                  ? "அரசு & வங்கி திட்டங்கள்"
                  : "Schemes & Welfare"}
              </span>
            </Button>

            {/* Banking Operations */}
            <Button
              className="h-32 text-xl flex flex-col gap-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg"
              onClick={() => {
                speak("வங்கி தகவல் சேவைகள்");
                navigate("/banking");
              }}
            >
              <Wallet className="w-10 h-10" />
              <span>
                {selectedLanguage === "ta"
                  ? "வங்கி தகவல் சேவைகள்"
                  : "Banking Services"}
              </span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
