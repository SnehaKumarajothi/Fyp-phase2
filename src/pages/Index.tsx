import { useState, useEffect } from "react";
import { VoiceInterface } from "@/components/VoiceInterface";
import { DataCollectionProgress } from "@/components/DataCollectionProgress";
import { LanguageSelector } from "@/components/LanguageSelector";
import { SchemeRecommendations } from "@/components/SchemeRecommendations";
import { SchemeQuestions } from "@/components/SchemeQuestions";
import { ApplicationForm } from "@/components/ApplicationForm";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic, Settings, Volume2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserData {
  name: string;
  age: string;
  address: string;
  yearlyEarning: string;
  community: string;
  situation: string;
}

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

type AppStage = "data-collection" | "schemes" | "scheme-questions" | "application-form" | "success";

const Index = () => {
  const { toast } = useToast();
  const [stage, setStage] = useState<AppStage>("data-collection");
  const [currentStep, setCurrentStep] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("ta");
  const [userData, setUserData] = useState<Partial<UserData>>({});
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [recommendedSchemes, setRecommendedSchemes] = useState<Scheme[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [schemeAnswers, setSchemeAnswers] = useState<Record<string, string>>({});
  const [applicationCounter, setApplicationCounter] = useState(1);

  const steps = [
    { key: "name", label: "பெயர்", labelEn: "Name" },
    { key: "age", label: "வயது", labelEn: "Age" },
    { key: "address", label: "முகவரி", labelEn: "Address" },
    { key: "yearlyEarning", label: "ஆண்டு வருமானம்", labelEn: "Yearly Earning" },
    { key: "community", label: "சமூகம்", labelEn: "Community" },
    { key: "situation", label: "நிலைமை விளக்கம்", labelEn: "Situation Description" },
  ];

  // Mock schemes data - Replace with RAG agent integration
  const mockSchemes: Scheme[] = [
    {
      id: "edu-loan-1",
      name: "Education Loan Scheme",
      nameTa: "கல்வி கடன் திட்டம்",
      description: "Low-interest education loan for higher studies up to 12 lakhs",
      descriptionTa: "12 லட்சம் வரை உயர் கல்விக்கான குறைந்த வட்டி கல்வி கடன்",
      eligibility: ["Age: 18-35", "Student", "Income < 8 LPA"],
      maxAmount: "₹12,00,000",
      interestRate: "4.5% p.a.",
      questions: [
        { key: "courseName", label: "பாடத்திட்டத்தின் பெயர்", labelEn: "Course Name" },
        { key: "instituteName", label: "நிறுவனத்தின் பெயர்", labelEn: "Institute Name" },
        { key: "courseDuration", label: "பாடத்திட்ட காலம்", labelEn: "Course Duration" },
        { key: "totalFees", label: "மொத்த கட்டணம்", labelEn: "Total Fees" },
      ]
    },
  ];

  // Generate JSON-RPC output when data collection is complete
  useEffect(() => {
    if (currentStep === steps.length && stage === "data-collection") {
      const jsonRpcOutput = {
        jsonrpc: "2.0",
        method: "user_data_collected",
        params: {
          basicDetails: {
            name: userData.name,
            age: userData.age,
            address: userData.address,
            yearlyEarning: userData.yearlyEarning,
            community: userData.community,
          },
          situationDescription: userData.situation,
        },
        id: Date.now(),
      };
      
      console.log("JSON-RPC Output (Basic Details):", jsonRpcOutput);
      
      // TODO: Pass to RAG Agent for scheme recommendations
      // This is where you'll integrate your RAG agent
      // The agent should receive the JSON-RPC message and return matching schemes
      
      setRecommendedSchemes(mockSchemes);
      setStage("schemes");
      
      toast({
        title: selectedLanguage === "ta" ? "தகவல் சேகரிப்பு முடிந்தது" : "Data Collection Complete",
        description: selectedLanguage === "ta" 
          ? "பொருத்தமான திட்டங்களைக் கண்டுபிடிக்கிறோம்..." 
          : "Finding matching schemes...",
      });
    }
  }, [currentStep, stage, userData, selectedLanguage, toast]);

  const handleVoiceDescription = (text: string) => {
    // TODO: Integrate TTS for voice description
    console.log("Playing voice description:", text);
    toast({
      title: selectedLanguage === "ta" ? "குரல் விளக்கம்" : "Voice Description",
      description: selectedLanguage === "ta" ? "விளக்கம் இயக்கப்படுகிறது..." : "Playing description...",
    });
  };

  const handleBack = () => {
    if (stage === "schemes") {
      setStage("data-collection");
      setCurrentStep(0);
      setUserData({});
    } else if (stage === "scheme-questions") {
      setStage("schemes");
      setSelectedScheme(null);
    } else if (stage === "application-form") {
      setStage("scheme-questions");
      setSchemeAnswers({});
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Header */}
      <header className="bg-kiosk-header text-white p-6 shadow-kiosk">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {stage !== "data-collection" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
            )}
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
        {stage === "data-collection" && (
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
                      } else {
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
        )}

        {stage === "schemes" && (
          <Card className="bg-kiosk-surface shadow-card border-0 p-8">
            <SchemeRecommendations
              schemes={recommendedSchemes}
              language={selectedLanguage}
              onSelectScheme={(scheme) => {
                setSelectedScheme(scheme);
                setStage("scheme-questions");
              }}
              onVoiceDescription={handleVoiceDescription}
            />
          </Card>
        )}

        {stage === "scheme-questions" && selectedScheme && (
          <Card className="bg-kiosk-surface shadow-card border-0 p-8">
            <SchemeQuestions
              schemeName={selectedLanguage === "ta" ? selectedScheme.nameTa : selectedScheme.name}
              questions={selectedScheme.questions}
              language={selectedLanguage}
              onComplete={(answers) => {
                setSchemeAnswers(answers);
                setStage("application-form");
              }}
            />
          </Card>
        )}

        {stage === "application-form" && selectedScheme && (
          <Card className="bg-kiosk-surface shadow-card border-0 p-8">
            <ApplicationForm
              applicationNumber={applicationCounter}
              schemeName={selectedScheme.name}
              schemeNameTa={selectedScheme.nameTa}
              formFields={[
                ...steps.slice(0, 5).map(step => ({
                  key: step.key,
                  label: step.label,
                  labelTa: step.label,
                  value: userData[step.key as keyof UserData] || "",
                  editable: false,
                })),
                ...selectedScheme.questions.map(q => ({
                  key: q.key,
                  label: q.label,
                  labelTa: q.label,
                  value: schemeAnswers[q.key] || "",
                  editable: false,
                }))
              ]}
              language={selectedLanguage}
              onSubmit={() => {
                setApplicationCounter(prev => prev + 1);
                toast({
                  title: selectedLanguage === "ta" ? "வெற்றி!" : "Success!",
                  description: selectedLanguage === "ta" 
                    ? "உங்கள் விண்ணப்பம் சமர்ப்பிக்கப்பட்டது"
                    : "Your application has been submitted",
                });
                setStage("success");
              }}
            />
          </Card>
        )}

        {stage === "success" && (
          <Card className="bg-kiosk-surface shadow-card border-0 p-12 text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                <Mic className="w-10 h-10 text-success" />
              </div>
              <h2 className="text-3xl font-bold text-kiosk-header">
                {selectedLanguage === "ta" ? "விண்ணப்பம் சமர்ப்பிக்கப்பட்டது!" : "Application Submitted!"}
              </h2>
              <p className="text-muted-foreground text-lg">
                {selectedLanguage === "ta" 
                  ? "உங்கள் விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது. விரைவில் உங்களை தொடர்பு கொள்வோம்."
                  : "Your application has been submitted successfully. We will contact you soon."}
              </p>
              <Button
                onClick={() => {
                  setStage("data-collection");
                  setCurrentStep(0);
                  setUserData({});
                  setSelectedScheme(null);
                  setSchemeAnswers({});
                }}
                size="lg"
                className="mt-8"
              >
                {selectedLanguage === "ta" ? "புதிய விண்ணப்பம்" : "New Application"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;