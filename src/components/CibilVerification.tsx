import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileUp, CheckCircle, AlertCircle, Home } from "lucide-react";

type Language = "ta" | "en";

interface CibilVerificationProps {
    language: Language;
    onVerified: () => void;
}

const API_BASE_URL = "http://localhost:5070";

export function CibilVerification({
    language,
    onVerified,
}: CibilVerificationProps) {
    const [cibilFile, setCibilFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        score?: number;
        classification?: string;
        is_eligible?: boolean;
        message?: string;
    } | null>(null);

    const handleUpload = async () => {
        if (!cibilFile) return;

        setLoading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("cibil_file", cibilFile);

        try {
            const res = await fetch(`${API_BASE_URL}/verify_cibil`, {
                method: "POST",
                body: formData,
            });
            const data = await res.json();

            if (res.ok) {
                setResult({
                    success: true,
                    score: data.score,
                    classification: data.classification,
                    is_eligible: data.is_eligible, // Ensure backend returns this
                });

                if (data.is_eligible) {
                    setTimeout(() => {
                        onVerified();
                    }, 2000);
                }

            } else {
                setResult({
                    success: false,
                    message: data.message || "Error verifying CIBIL score",
                });
            }
        } catch (error) {
            console.error("CIBIL verification error:", error);
            setResult({
                success: false,
                message: "Network error. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    const title = language === "ta" ? "சிபில் ஸ்கோர் சரிபார்ப்பு" : "CIBIL Score Verification";
    const subtitle =
        language === "ta"
            ? "உங்கள் கடன் தகுதியைச் சரிபார்க்க உங்கள் சிபில் ஸ்கோர் அறிக்கையைப் பதிவேற்றவும்."
            : "Please upload your CIBIL score report to verify your credit eligibility.";

    return (
        <Card className="bg-kiosk-surface shadow-card border-0 p-6 sm:p-8 max-w-2xl mx-auto">
            <div className="space-y-6 text-center">
                <h2 className="text-2xl font-bold text-kiosk-header">{title}</h2>
                <p className="text-muted-foreground">{subtitle}</p>

                <div className="space-y-4">
                    <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-xl bg-gray-50/50">
                        <FileUp className="w-12 h-12 text-muted-foreground" />
                        <div className="text-center">
                            <p className="text-sm font-medium">
                                {language === "ta" ? "PDF கோப்பை இங்கே இடவும் හෝ கிளிக் செய்யவும்" : "Drag and drop or click to upload PDF"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">Accepts .pdf only</p>
                        </div>

                        <Input
                            type="file"
                            accept="application/pdf"
                            className="max-w-xs"
                            onChange={(e) => setCibilFile(e.target.files?.[0] || null)}
                        />
                        {cibilFile && (
                            <p className="text-sm text-blue-600 font-medium">{cibilFile.name}</p>
                        )}
                    </div>

                    {!result?.is_eligible && (
                        <Button
                            onClick={handleUpload}
                            disabled={!cibilFile || loading}
                            className="w-full sm:w-auto min-w-[200px]"
                        >
                            {loading
                                ? language === "ta"
                                    ? "சரிபார்க்கிறது..."
                                    : "Verifying..."
                                : language === "ta"
                                    ? "சரிபார்க்கவும்"
                                    : "Verify Score"}
                        </Button>
                    )}
                </div>

                {result && (
                    <div className={`p-4 rounded-lg border ${result.success ? "bg-blue-50 border-blue-100" : "bg-red-50 border-red-100"}`}>
                        {result.success ? (
                            <div className="space-y-3">
                                <p className="font-semibold text-lg">
                                    {language === "ta" ? "சிபில் ஸ்கோர்:" : "CIBIL Score:"} <span className="text-blue-700 text-2xl">{result.score}</span>
                                </p>
                                <p className="text-sm text-gray-600">
                                    {language === "ta" ? "வகைப்பாடு:" : "Classification:"} <strong>{result.classification}</strong>
                                </p>

                                {result.is_eligible ? (
                                    <div className="flex items-center justify-center gap-2 text-green-600 font-bold mt-2">
                                        <CheckCircle className="w-5 h-5" />
                                        {language === "ta" ? "நீங்கள் தகுதி பெற்றுள்ளீர்கள்!" : "You are eligible!"}
                                    </div>
                                ) : (
                                    <div className="space-y-3 mt-2">
                                        <div className="flex items-center justify-center gap-2 text-red-600 font-bold">
                                            <AlertCircle className="w-5 h-5" />
                                            {language === "ta" ? "மன்னிக்கவும், உங்கள் சிபில் ஸ்கோர் குறைவாக உள்ளது." : "Sorry, your CIBIL score is too low."}
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => window.location.href = "/"}
                                            className="mt-2"
                                        >
                                            <Home className="w-4 h-4 mr-2" />
                                            {language === "ta" ? "முகப்பு பக்கத்திற்கு செல்லவும்" : "Go to Home"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-red-600">{result.message}</p>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
}
