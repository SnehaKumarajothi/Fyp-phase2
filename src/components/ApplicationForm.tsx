/*import { useState } from "react";
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
};*/
/*import { FORM_REGISTRY } from "@/data/forms";
import { useState } from "react";
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Printer, Download } from "lucide-react";
interface ApplicationFormProps {
  applicationNumber: number;
  schemeName: string;
  schemeNameTa: string;
  formKey: string; // new prop
  formFields: Record<string, string>;
  language: string;
  onSubmit: () => void;
}

export const ApplicationForm = ({
  schemeName,
  schemeNameTa,
  formKey,
  formFields,
  language,
  onSubmit,
}: ApplicationFormProps) => {
  const [accountNumber, setAccountNumber] = useState("");
  const selectedForm = FORM_REGISTRY[formKey] || [];
  const[applicationNumber , setApplicationNumber] = useState(() => {
  const saved = localStorage.getItem("applicationNumber");
  return saved ? parseInt(saved) + 1 : 1;
});

useEffect(() => {
  localStorage.setItem("applicationNumber", applicationNumber.toString());
}, [applicationNumber])

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    console.log("Generating PDF...");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card *//*}
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
              {String(applicationNumber)}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Form Sections *//*}
      <Card className="p-8 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <CheckCircle2 className="w-6 h-6 text-success" />
          <h3 className="text-xl font-semibold text-kiosk-header">
            {language === "ta"
              ? "உங்கள் விவரங்கள் சேகரிக்கப்பட்டுள்ளன"
              : "Your Details Have Been Collected"}
          </h3>
        </div>

        {selectedForm.map((section: any) => (
          <div key={section.section}>
            <h3 className="text-lg font-semibold mb-4">{section.section}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {section.fields.map((field: any) => (
                <div key={field.key}>
                  <Label className="text-sm font-medium mb-2 block">
                    {language === "ta" ? field.labelTa : field.label}
                  </Label>
                  <Input
                    value={formFields[field.key] || ""}
                    readOnly={!field.editable}
                    className="text-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Bank Account Input *//*}
        <div>
          <Label className="text-sm font-medium mb-2 block text-destructive">
            {language === "ta" ? "வங்கி கணக்கு எண் *" : "Bank Account Number *"}
          </Label>
          <Input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder={
              language === "ta"
                ? "உங்கள் கணக்கு எண்ணை உள்ளிடவும்"
                : "Enter your account number"
            }
            className="text-lg border-destructive"
          />
        </div>

        {/* Action Buttons *//*}
        <div className="flex gap-4 mt-8">
          <Button onClick={handlePrint} variant="outline" className="flex-1" size="lg">
            <Printer className="w-4 h-4 mr-2" />
            {language === "ta" ? "அச்சிடுக" : "Print"}
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex-1" size="lg">
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
      </Card>
    </div>
  );
};*/

import React, { useState } from "react";

// Assuming UI component imports resolve from './ui/'
import { Card } from "./ui/card"; 
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { CheckCircle2, Printer, Download } from "lucide-react";

// Assuming FORM_REGISTRY is correctly imported (defined below in the data section)
import { FORM_REGISTRY } from "../data/forms/index";

// --- Local Type Definitions (Matching data and Index.tsx) ---
type Language = "ta" | "en";
interface FormField { key: string; label: string; labelTa: string; editable: boolean; }
interface FormSection { section: string; fields: FormField[]; }

interface ApplicationFormProps {
  applicationNumber: number;
  schemeName: string;
  schemeNameTa: string;
  formKey: string;
  formFields: Record<string, string>;
  language: Language;
  onSubmit: () => void;
}
// --- End Type Definitions ---


export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  applicationNumber,
  schemeName,
  schemeNameTa,
  formKey,
  formFields,
  language,
  onSubmit,
}) => {
  const [accountNumber, setAccountNumber] = useState("");
  const selectedForm: FormSection[] = FORM_REGISTRY[formKey] || [];
  
  const formattedAppNumber = String(applicationNumber).padStart(6, '0');
  
  const handlePrint = () => { window.print(); };
  const handleDownload = () => { console.log("Generating PDF..."); };


  return (
    <div className="max-w-4xl mx-auto space-y-3">
      {/* Header Card */}
      <Card className="p-8 bg-blue-800 text-white print:bg-white print:text-black">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1">
              {language === "ta" ? schemeNameTa : schemeName}
            </h2>
            <p className="text-white/90 print:text-gray-600">
              {language === "ta" ? "விண்ணப்ப படிவம்" : "Application Form"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/80 print:text-gray-600">
              {language === "ta" ? "விண்ணப்ப எண்" : "Application No."}
            </div>
            <Badge className="text-base font-bold bg-white text-blue-800">
              {formattedAppNumber}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Form Sections */}
      <Card className="p-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-800">
              {language === "ta"
                ? "உங்கள் விவரங்கள் சேகரிக்கப்பட்டுள்ளன"
                : "Your Details Have Been Collected"}
            </h3>
          </div>

          {selectedForm.map((section: FormSection, sectionIndex: number) => (
            <div key={section.section}>
              <h3 className="text-base font-semibold mb-4 text-gray-700">{section.section}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.fields.map((field: FormField, fieldIndex: number) => (
                  <div key={field.key}>
                    <Label className="text-sm font-medium mb-2 block">
                      {language === "ta" ? field.labelTa : field.label}
                    </Label>
                    <Input
                      value={formFields[field.key] || "N/A"}
                      readOnly={!field.editable}
                      className="text-base bg-gray-50 read-only:bg-gray-100"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Bank Account Input */}
          <div>
            <Label className="text-sm font-medium mb-2 block text-red-600">
              {language === "ta" ? "வங்கி கணக்கு எண் *" : "Bank Account Number *"}
            </Label>
            <Input
              value={accountNumber}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccountNumber(e.target.value)}
              placeholder={
                language === "ta" ? "உங்கள் கணக்கு எண்ணை உள்ளிடவும்" : "Enter your account number"
              }
              className="text-base border-red-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8 print:hidden">
            <Button onClick={handlePrint} variant="outline" className="flex-1" size="lg">
              <Printer className="w-4 h-4 mr-2" />{language === "ta" ? "அச்சிடுக" : "Print"}
            </Button>
            <Button onClick={handleDownload} variant="outline" className="flex-1" size="lg">
              <Download className="w-4 h-4 mr-2" />{language === "ta" ? "பதிவிறக்கு" : "Download"}
            </Button>
            <Button
              onClick={onSubmit}
              disabled={!accountNumber.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />{language === "ta" ? "சமர்ப்பிக்கவும்" : "Submit Application"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};