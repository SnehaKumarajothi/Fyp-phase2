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

/* working  version */
import { useState, useEffect } from "react";
import VoiceInterface  from "./VoiceInterface";
const API_BASE_URL = 'http://localhost:5001';
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
  const [textAnswer,setTextAnswer]=useState("");
  const [transcript, setTranscript] = useState("");
  const [agentText, setAgentText] = useState("");

  const submitTextAnswer = async () => {
    if (!textAnswer.trim()) return;
    
    // For scheme questions, validate the answer using the backend
    try {
      const response = await fetch(`${API_BASE_URL}/validate_scheme_field`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_key: questions[currentStep].key,
          field_label: language === 'ta' ? questions[currentStep].label : questions[currentStep].labelEn,
          value: textAnswer.trim(),
          language: language
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.is_valid) {
          handleStepComplete(questions[currentStep].key, textAnswer.trim());
          setTextAnswer("");
        } else {
          // Show error message
          setAgentText(data.agent_text || (language === 'ta' ? "மீண்டும் முயற்சிக்கவும்." : "Please try again."));
        }
      } else {
        // If validation endpoint doesn't exist, use basic validation
        const isValid = validateTextAnswer(questions[currentStep].key, textAnswer.trim());
        if (isValid) {
          handleStepComplete(questions[currentStep].key, textAnswer.trim());
          setTextAnswer("");
        } else {
          setAgentText(language === 'ta' ? "மீண்டும் முயற்சிக்கவும்." : "Please try again.");
        }
      }
    } catch (error) {
      // If validation fails, use basic validation
      console.error("Validation error:", error);
      const isValid = validateTextAnswer(questions[currentStep].key, textAnswer.trim());
      if (isValid) {
        handleStepComplete(questions[currentStep].key, textAnswer.trim());
        setTextAnswer("");
      } else {
        setAgentText(language === 'ta' ? "மீண்டும் முயற்சிக்கவும்." : "Please try again.");
      }
    }
  };
  
  const validateTextAnswer = (fieldKey: string, value: string): boolean => {
    if (!value || value.trim() === "") return false;
    
    // Basic validation similar to backend
    if (fieldKey === "farmSize" || fieldKey === "land_size") {
      return /\d+/.test(value);
    } else if (fieldKey === "annualIncome" || fieldKey === "loanAmount" || fieldKey === "loan_amount") {
      return /\d+/.test(value);
    }
    
    return value.length >= 1;
  };

  const handleStepComplete = (key: string, data: string) => {
    const newAnswers = { ...answers, [key]: data };
    setAnswers(newAnswers);

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
      // Clear transcript for next question
      setTranscript("");
    } else {
      onComplete(newAnswers);
    }
  };
  
  // Update agent text from VoiceInterface
  useEffect(() => {
    // This will be updated by VoiceInterface when it receives responses
  }, []);
  const currentQuestion =
  language === "ta"
    ? questions[currentStep]?.label
    : questions[currentStep]?.labelEn;
  
  // Update agent text when step changes
  useEffect(() => {
    if (questions[currentStep]) {
      const questionText = language === "ta" ? questions[currentStep]?.label : questions[currentStep]?.labelEn;
      setAgentText(questionText || "");
    }
  }, [currentStep, language, questions]);


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
      <div className="mb-6 text-center">
        <p className="text-xl font-semibold text-kiosk-header">
          {currentQuestion}
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
      {agentText && agentText !== currentQuestion && (
        <div className="mb-4 text-center">
          <p className="text-lg text-red-600">
            {agentText}
          </p>
        </div>
      )}
      
      <div className="mt-6 p-4 border rounded-lg bg-gray-50">
        <p className="text-sm font-medium mb-2">
          {language==="ta"
          ? "அல்லது இங்கே எழுதுங்கள்"
          : "Or type your answer here"}
        </p>
        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={2}
          value={textAnswer}
          onChange={(e)=>setTextAnswer(e.target.value)}
          placeholder={
            language==="ta"
            ? "உங்கள் பதிலை இங்கே உள்ளிடவும்..."
            : "Enter your answer here..."
          }
        />
        <button
          onClick={submitTextAnswer}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {language==="ta" ? "பதில்களை சமர்ப்பிக்கவும்" : "Submit Answer"}
        </button>
      </div>
    </div>
  );
};

/*IDEAL VERSION
import { useState } from "react";
import VoiceInterface from "./VoiceInterface";

type Language = "ta" | "en";

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
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [textAnswer, setTextAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const currentQuestion =
    language === "ta"
      ? questions[currentStep]?.label
      : questions[currentStep]?.labelEn;

  const handleStepComplete = (key: string, value: string) => {
    const updated = { ...answers, [key]: value };
    setAnswers(updated);

    if (currentStep < questions.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setTranscript("");
    } else {
      onComplete(updated);
    }
  };

  const submitTextAnswer = () => {
    if (!textAnswer.trim()) return;
    handleStepComplete(questions[currentStep].key, textAnswer.trim());
    setTextAnswer("");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* HEADER *//*}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-kiosk-header">
          {language === "ta" ? "கூடுதல் தகவல் தேவை" : "Additional Information Required"}
        </h2>
        <p className="text-muted-foreground mt-1">{schemeName}</p>
      </div>

      {/* QUESTION CARD *//*}
      <div className="rounded-xl border bg-blue-50 p-6 text-center shadow-sm">
        <p className="text-sm text-blue-600 mb-2">
          {language === "ta" ? "கேள்வி" : "Question"}
        </p>
        <p className="text-xl font-semibold text-kiosk-header">
          {currentQuestion}
        </p>
      </div>

      {/* VOICE INPUT *//*/*}
      <div className="rounded-xl border p-6">
        <VoiceInterface
          isListening={isListening}
          onListeningChange={setIsListening}
          onStepComplete={(value: string) =>
            handleStepComplete(questions[currentStep].key, value)
          }
          language={language}
          transcript={transcript}
          onTranscriptChange={setTranscript}
        />
      </div>

      {/* TEXT INPUT *//*}
      <div className="rounded-xl border bg-gray-50 p-4">
        <p className="text-sm font-medium mb-2">
          {language === "ta" ? "அல்லது இங்கே எழுதுங்கள்" : "Or type your answer"}
        </p>

        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={2}
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          placeholder={
            language === "ta"
              ? "உங்கள் பதிலை இங்கே உள்ளிடவும்..."
              : "Enter your answer here..."
          }
        />

        <button
          onClick={submitTextAnswer}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {language === "ta" ? "பதில் சமர்ப்பிக்கவும்" : "Submit Answer"}
        </button>
      </div>
    </div>
  );
};*/
