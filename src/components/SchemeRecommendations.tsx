import React from 'react';
// Assuming UI component imports resolve from './ui/'
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Volume2, FileText, CheckCircle2 } from "lucide-react";


// --- Type Definitions (Matching Index.tsx) ---
type Language = "ta" | "en";
interface Scheme {
    id: string; name: string; nameTa: string; description: string; descriptionTa: string;
    eligibility: string[]; maxAmount: string; interestRate: string; keywords: string[];
    formKey: string; questions: any[]; // Use any[] for questions to avoid deep import conflict
}
interface SchemeRecommendationsProps {
  schemes: Scheme[];
  language: Language;
  onSelectScheme: (scheme: Scheme) => void;
  onVoiceDescription: (text: string) => void;
}
// --- End Type Definitions ---


export const SchemeRecommendations: React.FC<SchemeRecommendationsProps> = ({
  schemes,
  language,
  onSelectScheme,
  onVoiceDescription,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {language === "ta" ? "பரிந்துரைக்கப்பட்ட திட்டங்கள்" : "Recommended Schemes"}
        </h2>
        <p className="text-gray-500">
          {language === "ta" ? "உங்கள் நிலைமைக்கு பொருந்தும் திட்டங்கள்" : "Schemes matching your situation"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {schemes.map((scheme: Scheme) => ( 
          <Card key={scheme.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {language === "ta" ? scheme.nameTa : scheme.name}
                </h3>
                <p className="text-gray-500">
                  {language === "ta" ? scheme.descriptionTa : scheme.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onVoiceDescription(language === "ta" ? scheme.descriptionTa : scheme.description)}
                className="ml-4"
              >
                <Volume2 className="w-5 h-5" />
              </Button>
            </div>

            {/* Eligibility Tags */}
            <div className="mb-4">
              <span className="text-sm font-medium mb-2 block text-gray-700">
                {language === "ta" ? "தகுதி" : "Eligibility"}
              </span>
              <div className="flex flex-wrap gap-2">
                {scheme.eligibility.map((item: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="gap-1 bg-green-100 text-green-700">
                    <CheckCircle2 className="w-3 h-3" />
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            <Button
              onClick={() => onSelectScheme(scheme)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-4"
              size="lg"
            >
              <FileText className="w-4 h-4 mr-2" />
              {language === "ta" ? "விண்ணப்பிக்கவும்" : "Apply Now"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};