import React, { useState, useRef } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Volume2, FileText, CheckCircle2 } from "lucide-react";

type Language = "ta" | "en";

interface Scheme {
  id: string;
  name: string;
  nameTa: string;
  description: string;
  descriptionTa: string;
  eligibility: string[];
  maxAmount: string;
  interestRate: string;
  keywords: string[];
  formKey: string;
  questions: any[];
  fullText?: string; // full scheme document text
}

interface SchemeRecommendationsProps {
  schemes: Scheme[];
  language: Language;
  onSelectScheme: (scheme: Scheme) => void;
}

export const SchemeRecommendations: React.FC<SchemeRecommendationsProps> = ({
  schemes,
  language,
  onSelectScheme,
}) => {
  const [activeSchemeId, setActiveSchemeId] = useState<string | null>(null);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const explainScheme = async (scheme: Scheme) => {
    if (!scheme.id) return;

    // stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setActiveSchemeId(scheme.id);

    // play cached audio
    if (audioCache[scheme.id]) {
      const audio = new Audio(audioCache[scheme.id]);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => setActiveSchemeId(null);
      return;
    }
    setActiveSchemeId(scheme.id);
    try {
      const res = await fetch("http://localhost:5070/scheme/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemeId: scheme.id,
          language,
        }),
      });

      const data = await res.json();
      const audioUrl = `http://localhost:5070${data.audio}`;

      setAudioCache((prev) => ({
        ...prev,
        [scheme.id]: audioUrl,
      }));

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => setActiveSchemeId(null);
    } catch (err) {
      console.error("Scheme explanation failed", err);
      setActiveSchemeId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">
          {language === "ta" ? "பரிந்துரைக்கப்பட்ட திட்டங்கள்" : "Recommended Schemes"}
        </h2>
        <p className="text-gray-500">
          {language === "ta"
            ? "உங்கள் நிலைமைக்கு பொருந்தும் திட்டங்கள்"
            : "Schemes matching your situation"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {schemes.map((scheme) => {
          const active = activeSchemeId === scheme.id;

          return (
            <Card
              key={scheme.id}
              className={`p-6 transition ${
                active ? "border-blue-500 bg-blue-50 shadow-lg" : "hover:shadow-lg"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    {language === "ta" ? scheme.nameTa : scheme.name}
                  </h3>
                  <p className="text-gray-500">
                    {language === "ta"
                      ? scheme.descriptionTa
                      : scheme.description}
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => explainScheme(scheme)}
                >
                  <Volume2
                    className={`w-5 h-5 ${
                      active ? "text-blue-600 animate-pulse" : ""
                    }`}
                  />
                </Button>
              </div>

              <div className="mb-4">
                <span className="text-sm font-medium">
                  {language === "ta" ? "தகுதி" : "Eligibility"}
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {scheme.eligibility.map((item, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-green-100 text-green-700 gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => onSelectScheme(scheme)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                {language === "ta" ? "விண்ணப்பிக்கவும்" : "Apply Now"}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};