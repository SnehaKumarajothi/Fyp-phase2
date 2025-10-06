import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, FileText, CheckCircle2 } from "lucide-react";

interface Scheme {
  id: string;
  name: string;
  nameTa: string;
  description: string;
  descriptionTa: string;
  eligibility: string[];
  maxAmount: string;
  interestRate: string;
  questions: Array<{ key: string; label: string; labelEn: string }>;
}

interface SchemeRecommendationsProps {
  schemes: Scheme[];
  language: string;
  onSelectScheme: (scheme: Scheme) => void;
  onVoiceDescription: (text: string) => void;
}

export const SchemeRecommendations = ({
  schemes,
  language,
  onSelectScheme,
  onVoiceDescription,
}: SchemeRecommendationsProps) => {
  // TODO: Integrate with RAG Agent
  // This is where you'll connect to your RAG agent
  // Agent should: 1) Receive user data + situation description
  //               2) Query relevant loan schemes from database
  //               3) Filter based on eligibility (age, community, income)
  //               4) Return ranked list of matching schemes

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-kiosk-header mb-2">
          {language === "ta" ? "பரிந்துரைக்கப்பட்ட திட்டங்கள்" : "Recommended Schemes"}
        </h2>
        <p className="text-muted-foreground">
          {language === "ta" 
            ? "உங்கள் நிலைமைக்கு பொருந்தும் திட்டங்கள்"
            : "Schemes matching your situation"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {schemes.map((scheme) => (
          <Card key={scheme.id} className="p-6 hover:shadow-card transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-kiosk-header mb-2">
                  {language === "ta" ? scheme.nameTa : scheme.name}
                </h3>
                <p className="text-muted-foreground">
                  {language === "ta" ? scheme.descriptionTa : scheme.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onVoiceDescription(
                  language === "ta" ? scheme.descriptionTa : scheme.description
                )}
                className="ml-4"
              >
                <Volume2 className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-sm text-muted-foreground">
                  {language === "ta" ? "அதிகபட்ச தொகை" : "Max Amount"}
                </span>
                <p className="font-semibold">{scheme.maxAmount}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">
                  {language === "ta" ? "வட்டி விகிதம்" : "Interest Rate"}
                </span>
                <p className="font-semibold">{scheme.interestRate}</p>
              </div>
            </div>

            <div className="mb-4">
              <span className="text-sm font-medium mb-2 block">
                {language === "ta" ? "தகுதி" : "Eligibility"}
              </span>
              <div className="flex flex-wrap gap-2">
                {scheme.eligibility.map((item, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {item}
                  </Badge>
                ))}
              </div>
            </div>

            <Button
              onClick={() => onSelectScheme(scheme)}
              className="w-full bg-primary hover:bg-primary/90"
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
