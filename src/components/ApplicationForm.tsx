import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Printer, Download } from "lucide-react";

interface FormField {
  key: string;
  label: string;
  labelTa: string;
  value: string;
  editable: boolean;
}

interface ApplicationFormProps {
  applicationNumber: number;
  schemeName: string;
  schemeNameTa: string;
  formFields: FormField[];
  language: string;
  onSubmit: () => void;
}

export const ApplicationForm = ({
  applicationNumber,
  schemeName,
  schemeNameTa,
  formFields,
  language,
  onSubmit,
}: ApplicationFormProps) => {
  const [accountNumber, setAccountNumber] = useState("");

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: Generate PDF with form data
    console.log("Generating PDF...");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-8 bg-gradient-primary text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {language === "ta" ? schemeNameTa : schemeName}
            </h2>
            <p className="text-white/90">
              {language === "ta" ? "விண்ணப்ப படிவம்" : "Application Form"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/80">
              {language === "ta" ? "விண்ணப்ப எண்" : "Application No."}
            </div>
            <Badge variant="secondary" className="text-lg font-bold bg-white text-primary">
              {String(applicationNumber).padStart(6, '0')}
            </Badge>
          </div>
        </div>
      </Card>

      <Card className="p-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-6 h-6 text-success" />
            <h3 className="text-xl font-semibold text-kiosk-header">
              {language === "ta" 
                ? "உங்கள் விவரங்கள் சேகரிக்கப்பட்டுள்ளன"
                : "Your Details Have Been Collected"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {formFields.map((field) => (
              <div key={field.key}>
                <Label className="text-sm font-medium mb-2 block">
                  {language === "ta" ? field.labelTa : field.label}
                </Label>
                <Input
                  value={field.value}
                  disabled={!field.editable}
                  className="text-lg"
                  readOnly={!field.editable}
                />
              </div>
            ))}

            <div>
              <Label className="text-sm font-medium mb-2 block text-destructive">
                {language === "ta" ? "வங்கி கணக்கு எண் *" : "Bank Account Number *"}
              </Label>
              <Input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={language === "ta" ? "உங்கள் கணக்கு எண்ணை உள்ளிடவும்" : "Enter your account number"}
                className="text-lg border-destructive"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Printer className="w-4 h-4 mr-2" />
              {language === "ta" ? "அச்சிடுக" : "Print"}
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              {language === "ta" ? "பதிவிறக்கு" : "Download"}
            </Button>
            <Button
              onClick={onSubmit}
              disabled={!accountNumber.trim()}
              className="flex-1 bg-success hover:bg-success/90"
              size="lg"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {language === "ta" ? "சமர்ப்பிக்கவும்" : "Submit Application"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
