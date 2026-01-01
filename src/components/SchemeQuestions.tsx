/*import React from 'react';
// Assuming UI component imports resolve from './ui/'
import { Button } from "./ui/button";


// --- Type Definitions (Matching Index.tsx) ---
type Language = "ta" | "en";
interface Step { key: string; label: string; labelEn: string; }
interface SchemeQuestionsProps {
  schemeName: string;
  questions: Step[];
  language: Language;
  onComplete: (answers: Record<string, string>) => void;
}
// --- End Type Definitions ---


export const SchemeQuestions: React.FC<SchemeQuestionsProps> = ({ 
    schemeName, 
    questions, 
    language, 
    onComplete 
}) => {
    
    // NOTE: In a real system, VoiceInterface (or a wrapper component) would be used here
    // to collect answers sequentially. Since this component is a mock endpoint for the
    // sake of the flow, we only provide a mock completion button.

    const mockCompletion = () => {
        // Simulate collecting answers for all required questions
        const mockAnswers: Record<string, string> = {};
        questions.forEach((q, index) => {
            mockAnswers[q.key] = `Mock Answer ${index + 1}`;
        });
        
        onComplete(mockAnswers);
    };

    return (
        <div className="p-8 text-center bg-gray-50 rounded-xl space-y-6">
            <div className="text-xl font-bold text-gray-800">
                {language === "ta" ? "கூடுதல் தகவலுக்கான கேள்விகள்" : "Additional Information Required"}
            </div>
            <p className="text-lg text-blue-600 font-semibold">{schemeName}</p>
            <p className="text-gray-600">
                {language === "ta"
                    ? `திட்டத்தை இறுதி செய்ய, ${questions.length} கூடுதல் கேள்விகளுக்குப் பதிலளிக்க வேண்டும்.`
                    : `To finalize the scheme, you must answer ${questions.length} additional questions.`}
            </p>

            <Button onClick={mockCompletion} className="mt-4 bg-green-600 hover:bg-green-700 text-white" size="lg">
                {language === "ta" ? "கேள்விகளுக்கு பதிலளிக்கத் தொடங்குங்கள்" : "Start Answering Questions (Mock)"}
            </Button>
        </div>
    );
};*/
import { useState } from "react";
import VoiceInterface  from "./VoiceInterface";
type Language = "ta"|"en";
interface Question {
  key: string;
  label: string;
  labelEn: string;
}

interface SchemeQuestionsProps {
  schemeName: string;
  questions: Question[];
  language: Language;
  onComplete: (answers: Record<string, string>) => void;
}

export const SchemeQuestions = ({
  schemeName,
  questions,
  language,
  onComplete,
}: SchemeQuestionsProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [transcript, setTranscript] = useState("");

  const handleStepComplete = (key: string, data: string) => {
    const newAnswers = { ...answers, [key]: data };
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(newAnswers);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-kiosk-header mb-2">
          {language === "ta" ? "கூடுதல் தகவல் தேவை" : "Additional Information Required"}
        </h2>
        <p className="text-muted-foreground">
          {schemeName}
        </p>
      </div>

      <VoiceInterface
        isListening={isListening}
        onListeningChange={setIsListening}
        currentStep={currentStep}
        onStepComplete={handleStepComplete}
        language={language}
        steps={questions}
        transcript={transcript}
        onTranscriptChange={setTranscript}
      />
    </div>
  );
};