
import React, { useState, useMemo } from "react";
// Assuming the build system resolves these component imports relative to src/
import VoiceInterface from "../components/VoiceInterface";
import { useIsMobile } from "../hooks/use-mobile";
import { DataCollectionProgress } from "../components/DataCollectionProgress";
import { LanguageSelector } from "../components/LanguageSelector";
import { SchemeRecommendations } from "../components/SchemeRecommendations";
import { SchemeQuestions } from "../components/SchemeQuestions";
import { ApplicationForm } from "../components/ApplicationForm";

// Assuming UI components are correctly available
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Mic, Keyboard, Settings, Volume2, ArrowLeft } from 'lucide-react';
import { getMatchingSchemes } from "@/data/schemeMatcher";
// Mock/Type Definitions (To avoid internal import issues)
type Language = "ta" | "en";
type AppStage = "data-collection" | "schemes" | "scheme-questions" | "application-form" | "success";
interface Step { key: string; label: string; labelEn: string; }

interface AgentState {
    user_id: string | null;
    next_step_index: number;
    llm_response_ta: string;
    [key: string]: string | number | null | undefined; 
}
interface Scheme {
    id: string; name: string; nameTa: string; description: string; descriptionTa: string;
    eligibility: string[]; maxAmount: string; interestRate: string; keywords: string[];
    formKey: string; questions: Step[]; fullText?: string;
}

const useToast = () => ({
    toast: ({ title, description, duration, variant }: { title?: any; description?: any; duration?: any; variant?: any }) => {
        console.log(`${variant ? `[${variant}] ` : ''}[TOAST] ${title}: ${description}`);
    }
});
const API_BASE_URL = 'http://localhost:5001';

const INITIAL_AGENT_STATE: AgentState = {
    user_id: null,
    next_step_index: 0,
    llm_response_ta: "தொடங்க மைக்ரோஃபோனை அழுத்தவும்.",
    name: null, age: null, address: null, earning: null, community: null, situation: null,
};

const SchemeVoice: React.FC = () => {
    const isMobileDebug = useIsMobile();
    const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 0);
    React.useEffect(() => {
        const onResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    const { toast } = useToast();
    const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
    const [textInput, setTextInput] = useState("");
    const [stage, setStage] = useState<AppStage>("data-collection");
    const [isListening, setIsListening] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<Language>("ta");
    const [agentState, setAgentState] = useState<AgentState>(INITIAL_AGENT_STATE);
    const [currentTranscript, setCurrentTranscript] = useState("");
    const [recommendedSchemes, setRecommendedSchemes] = useState<Scheme[]>([]);
    const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
    const [schemeAnswers, setSchemeAnswers] = useState<Record<string, string>>({});
    const [applicationCounter, setApplicationCounter] = useState<number>(
        parseInt(localStorage.getItem("applicationNumber") || "0") + 1
    );

    const steps: Step[] = [
        { key: "name", label: "பெயர்", labelEn: "Name" },
        { key: "age", label: "வயது", labelEn: "Age" },
        { key: "address", label: "முகவரி", labelEn: "Address" },
        { key: "earning", label: "ஆண்டு வருமானம்", labelEn: "Yearly Earning" },
        { key: "community", label: "சமூகம்", labelEn: "Community" },
        { key: "situation", label: "நிலைமை விளக்கம்", labelEn: "Situation Description" },
    ];

    const userData: Record<string, string> = useMemo(() => ({
        name: String(agentState.name || ""),
        age: String(agentState.age || ""),
        address: String(agentState.address || ""),
        yearlyEarning: String(agentState.earning || ""),
        community: String(agentState.community || ""),
        situation: String(agentState.situation || ""),
    }), [agentState]);

    const handleDataCollectionComplete = async (finalData: Record<string, string>) => {
        /*toast({
            title: selectedLanguage === "ta" ? "சேகரிப்பு முடிந்தது..." : "Data Collection Complete...",
            description: selectedLanguage === "ta" ? "திட்டப் பொருத்தத்திற்காக தரவு அனுப்பப்படுகிறது." : "Sending data for scheme matching.",
            duration: 5000,
        });

        try {
            const response = await fetch(`${API_BASE_URL}/submit_and_match`, {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collected_data: finalData, user_id: agentState.user_id })
            });
            const result = await response.json();
            if (response.ok && result.status === 'success') {
                setRecommendedSchemes(result.schemes);
                setStage("schemes");
                toast({
                    title: selectedLanguage === "ta" ? "திட்டங்கள் கண்டறியப்பட்டன" : "Schemes Found",
                    description: selectedLanguage === "ta" ? "உங்கள் நிலைக்கு பொருந்தும் திட்டங்கள் காண்பிக்கப்படும்." : "Matching schemes are being displayed.",
                    duration: 3000,
                });
            } else if (response.status === 404) {
                toast({
                    title: selectedLanguage === "ta" ? "திட்டங்கள் இல்லை" : "No Schemes Found",
                    description: selectedLanguage === "ta" ? "உங்கள் நிலைக்கு பொருந்தும் திட்டங்கள் எதுவும் இல்லை." : "No schemes matched your profile and situation.",
                    duration: 5000,
                });
            } else {
                throw new Error(result.message || "Unknown server error.");
            }
        } catch (error) {
            console.error("Scheme Match Error:", error);
            toast({
                title: selectedLanguage === "ta" ? "பிழை ஏற்பட்டது" : "Error Occurred",
                description: selectedLanguage === "ta" ? `சேவையகத்தில் திட்டப் பொருத்தத்தில் பிழை ஏற்பட்டது.` : `Failed to match schemes on server: ${(error as Error).message}`,
                variant: 'destructive',
                duration: 5000
            });
        }*/
       if (!finalData.situation || finalData.situation.trim().length < 5) {
            console.error("Situation missing:", finalData);
            return;
        }

        const { situation, ...restUserData } = finalData;
        
        // Normalize the data structure - ensure age is a number, community is lowercase
        const normalizedUserData = {
            ...restUserData,
            age: String(restUserData.age || ""),
            community: (restUserData.community || "").toLowerCase(),
        };
        
        console.log("[DATA COLLECTION COMPLETE] Final data:", finalData);
        console.log("[DATA COLLECTION COMPLETE] Normalized user data:", normalizedUserData);
        console.log("[DATA COLLECTION COMPLETE] Situation:", situation);

        const matchedSchemes = getMatchingSchemes(
            normalizedUserData,
            situation
        );
        
        console.log("[DATA COLLECTION COMPLETE] Matched schemes count:", matchedSchemes.length);
        console.log("[DATA COLLECTION COMPLETE] Matched schemes:", matchedSchemes);
        
        setRecommendedSchemes(matchedSchemes);
        setStage("schemes");
    };

    const handleBack = () => {
        if (stage === "schemes") {
            setStage("data-collection");
            setAgentState(INITIAL_AGENT_STATE);
        } else if (stage === "scheme-questions") {
            setStage("schemes");
            setSelectedScheme(null);
        } else if (stage === "application-form") {
            setStage("scheme-questions");
            setSchemeAnswers({});
        }
    };

    const handleVoiceDescription = (text: string) => {
        toast({ title: selectedLanguage === "ta" ? "குரல் விளக்கம்" : "Voice Description", description: text, duration: 2000 });
    };

    /*const handleStepComplete = (stepKey: string, value: string) => {
        setAgentState(prev => {
            const updated = { ...prev, [stepKey]: value } as AgentState;
            const nextIdx = (prev.next_step_index || 0) + 1;
            updated.next_step_index = nextIdx;
            if (nextIdx >= steps.length) {
                const finalData = {
                    name: String(updated.name || ""),
                    age: String(updated.age || ""),
                    address: String(updated.address || ""),
                    yearlyEarning: String(updated.earning || ""),
                    community: String(updated.community || ""),
                    situation: String(updated.situation || ""),
                };
                setTimeout(() => handleDataCollectionComplete(finalData), 0);
            }
            return updated;
        });
    };*/
    const handleTextSubmit = () => {
    if (!textInput.trim()) return;

    const stepKey = steps[agentState.next_step_index].key;
    const currentStep = steps[agentState.next_step_index];

    handleStepComplete(currentStep.key, textInput, "text");

    setTextInput("");
    };

    type InputSource = "voice" | "text";

    const handleStepComplete = (
    stepKey: string,
    value: string,
    source: InputSource = "voice"
    ) => {
    setAgentState(prev => {
        const updated = {
        ...prev,
        [stepKey]: value,
        last_input_source: source, // optional but useful
        } as AgentState;

        const nextIdx = (prev.next_step_index || 0) + 1;
        updated.next_step_index = nextIdx;

        if (nextIdx >= steps.length) {
        const finalData = {
            name: String(updated.name || ""),
            age: String(updated.age || ""),
            address: String(updated.address || ""),
            yearlyEarning: String(updated.earning || ""),
            community: String(updated.community || ""),
            situation: String(updated.situation || ""),
        };

        setTimeout(() => handleDataCollectionComplete(finalData), 0);
        }

        return updated;
    });
    };
    return (
        <div className="min-h-screen bg-gradient-surface">
            <header className="bg-kiosk-header text-white shadow-kiosk">
                <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <Button onClick={() => window.location.href="/"}>Home</Button>
                        {stage !== "data-collection" && (
                            <Button variant="ghost" size="icon" onClick={handleBack} className="text-white hover:bg-white/20">
                                <ArrowLeft className="w-6 h-6" />
                            </Button>
                        )}
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Mic className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">தகவல் சேகர்ப்பு முகவர்</h1>
                            <p className="text-white/80">Data Collection Agent</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">{selectedLanguage === "ta" ? "தமிழ்" : "English"}</Badge>
                        <LanguageSelector selectedLanguage={selectedLanguage} onLanguageChange={(lang: string) => { if (lang === "ta" || lang === "en") setSelectedLanguage(lang as Language); }} />
                    </div>
                </div>
            </header>
            <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-screen-xl">
                {stage === "data-collection" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <Card className="h-full bg-kiosk-surface shadow-card border-0">
                                <div className="py-4 px-6">
                                    <h2 className="text-xl font-semibold mb-6 text-kiosk-header">{selectedLanguage === "ta" ? "முன்னேற்றம்" : "Progress"}</h2>
                                    <DataCollectionProgress steps={steps} currentStep={agentState.next_step_index} userData={userData} language={selectedLanguage} />
                                </div>
                            </Card>
                        </div>
                        <div className="lg:col-span-2">
                            <Card className="h-full bg-kiosk-surface shadow-card border-0">
                                <div className="py-4 px-6 sm:p-8 flex flex-col flex-1">
                                    {/* ✅ CURRENT QUESTION */}
                                    {steps[agentState.next_step_index] && (
                                        <p className="mb-4 text-xl font-semibold text-center text-kiosk-header">
                                        {selectedLanguage === "ta"
                                            ? steps[agentState.next_step_index].label
                                            : steps[agentState.next_step_index].labelEn}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-semibold text-kiosk-header">{selectedLanguage === "ta" ? "குரல் உரையாடல்" : "Voice Interaction"}</h2>
                                        <div className="flex items-center gap-2"><Volume2 className="w-5 h-5 text-muted-foreground" /><Settings className="w-5 h-5 text-muted-foreground" /></div>
                                    </div>
                                    <div className="mb-6 flex justify-center gap-2">
                                        <Button
                                            onClick={() => setInputMode("voice")}
                                            variant={inputMode === "voice" ? "default" : "outline"}
                                            className="gap-2"
                                        >
                                            <Mic className="w-4 h-4" />
                                            {selectedLanguage === "ta" ? "குரல்" : "Voice"}
                                        </Button>

                                        <Button
                                            onClick={() => setInputMode("text")}
                                            variant={inputMode === "text" ? "default" : "outline"}
                                            className="gap-2"
                                        >
                                            <Keyboard className="w-4 h-4" />
                                            {selectedLanguage === "ta" ? "உரை" : "Text"}
                                        </Button>
                                        </div>
                                    {inputMode === "voice" ? (
                                    <VoiceInterface
                                        isListening={isListening}
                                        onListeningChange={setIsListening}
                                        currentStep={agentState.next_step_index}
                                        onStepComplete={handleStepComplete}
                                        onDataCollectionComplete={handleDataCollectionComplete}
                                        language={selectedLanguage}
                                        steps={steps}
                                        transcript={currentTranscript}
                                        onTranscriptChange={setCurrentTranscript}
                                        collectedData={userData}
                                    />
                                    ) : (
                                    <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto">
                                        <Card className="p-4 bg-muted/50">
                                        <Input
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value)}
                                            placeholder={
                                            selectedLanguage === "ta"
                                                ? "உங்கள் பதிலை இங்கே தட்டச்சு செய்யவும்..."
                                                : "Type your answer here..."
                                            }
                                            className="text-lg"
                                            onKeyDown={(e) => {
                                            if (e.key === "Enter") handleTextSubmit();
                                            }}
                                        />

                                        <Button
                                            onClick={handleTextSubmit}
                                            className="mt-4 w-full bg-success hover:bg-success/90"
                                            disabled={!textInput.trim()}
                                        >
                                            {selectedLanguage === "ta" ? "சமர்ப்பிக்கவும்" : "Submit"}
                                        </Button>
                                        </Card>
                                    </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                )}
                {stage === "schemes" && (
                    <Card className="bg-kiosk-surface shadow-card border-0 p-8">
                        <SchemeRecommendations schemes={recommendedSchemes} language={selectedLanguage} onSelectScheme={(scheme: any) => { setSelectedScheme(scheme); setTimeout(() => setStage("scheme-questions"), 0); }} />
                    </Card>
                )}
                {stage === "scheme-questions" && (
                    selectedScheme ? (
                        <SchemeQuestions
                        schemeName={selectedLanguage === "ta" ? selectedScheme.nameTa : selectedScheme.name}
                        questions={selectedScheme.questions}
                        language={selectedLanguage}
                        onComplete={(answers) => {
                            setSchemeAnswers(answers);
                            setStage("application-form");
                        }}
                        />
                    ) : (
                        <div className="text-center text-muted-foreground">
                        Loading scheme questions…
                        </div>
                    )
                )}

                {stage === "application-form" && selectedScheme && (
                    <Card className="bg-kiosk-surface shadow-card border-0 p-8">
                        <ApplicationForm
                        applicationNumber={applicationCounter}
                        schemeName={selectedScheme.name}
                        schemeNameTa={selectedScheme.nameTa}
                        formKey={selectedScheme.formKey}
                        formFields={{
                            ...userData,       // from agent
                            ...schemeAnswers,  // from scheme questions
                        }}
                        language={selectedLanguage}
                        onSubmit={() => {
                            setApplicationCounter((prev) => prev + 1);

                            toast({
                            title: selectedLanguage === "ta" ? "வெற்றி!" : "Success!",
                            description:
                                selectedLanguage === "ta"
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
                            {selectedLanguage === "ta"
                            ? "விண்ணப்பம் சமர்ப்பிக்கப்பட்டது!"
                            : "Application Submitted!"}
                        </h2>

                        <p className="text-muted-foreground text-lg">
                            {selectedLanguage === "ta"
                            ? "உங்கள் விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது. விரைவில் உங்களை தொடர்பு கொள்வோம்."
                            : "Your application has been submitted successfully. We will contact you soon."}
                        </p>

                        <Button
                            size="lg"
                            className="mt-8"
                            onClick={() => {
                            setStage("data-collection");
                            setAgentState(INITIAL_AGENT_STATE);
                            setSelectedScheme(null);
                            setSchemeAnswers({});
                            setCurrentTranscript("");
                            setInputMode("voice");
                            }}
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

export default SchemeVoice;