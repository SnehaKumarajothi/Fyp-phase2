import { useState } from "react";
import { VoiceInterface } from "./VoiceInterface";

interface Question {
  key: string;
  label: string;
  labelEn: string;
}

interface SchemeQuestionsProps {
  schemeName: string;
  questions: Question[];
  language: string;
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
