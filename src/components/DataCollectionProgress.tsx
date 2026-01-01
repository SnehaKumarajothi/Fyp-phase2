/*import { Check, Circle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Step {
  key: string;
  label: string;
  labelEn: string;
}

interface DataCollectionProgressProps {
  steps: Step[];
  currentStep: number;
  userData: Record<string, any>;
  language: string;
}

export const DataCollectionProgress = ({
  steps,
  currentStep,
  userData,
  language,
}: DataCollectionProgressProps) => {
  const getStepStatus = (index: number) => {
    if (index < currentStep) return "completed";
    if (index === currentStep) return "current";
    return "pending";
  };

  const getStepIcon = (index: number, step: Step) => {
    const status = getStepStatus(index);
    
    switch (status) {
      case "completed":
        return <Check className="w-4 h-4 text-success" />;
      case "current":
        return <AlertCircle className="w-4 h-4 text-primary animate-pulse" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Overview *//*}
      <div className="text-center">
        <div className="text-3xl font-bold text-primary mb-2">
          {Object.keys(userData).length}/{steps.length}
        </div>
        <p className="text-sm text-muted-foreground">
          {language === "ta" ? "பூர்த்தி செய்யப்பட்ட படிகள்" : "Steps Completed"}
        </p>
      </div>

      {/* Progress Bar *//*}
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${(Object.keys(userData).length / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps List *//*}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const hasData = userData[step.key];
          
          return (
            <Card 
              key={step.key}
              className={cn(
                "p-4 transition-all duration-300 border",
                status === "current" && "border-primary bg-primary/5 shadow-kiosk",
                status === "completed" && "border-success bg-success/5",
                status === "pending" && "border-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  status === "current" && "bg-primary/10",
                  status === "completed" && "bg-success/10",
                  status === "pending" && "bg-muted"
                )}>
                  {getStepIcon(index, step)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {language === "ta" ? step.label : step.labelEn}
                    </span>
                    {status === "completed" && (
                      <Badge variant="secondary" className="bg-success/20 text-success text-xs">
                        {language === "ta" ? "முடிந்தது" : "Done"}
                      </Badge>
                    )}
                    {status === "current" && (
                      <Badge variant="default" className="text-xs animate-pulse">
                        {language === "ta" ? "நடப்பு" : "Current"}
                      </Badge>
                    )}
                  </div>
                  
                  {hasData && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {userData[step.key].toString().substring(0, 30)}
                      {userData[step.key].toString().length > 30 ? "..." : ""}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Collected Data Summary *//*}
      {Object.keys(userData).length > 0 && (
        <Card className="p-4 bg-muted/30">
          <h4 className="text-sm font-semibold mb-3 text-kiosk-header">
            {language === "ta" ? "சேகரிக்கப்பட்ட தகவல்கள்" : "Collected Data"}
          </h4>
          <div className="space-y-2 text-xs">
            {Object.entries(userData).map(([key, value]) => {
              const step = steps.find(s => s.key === key);
              return (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {step ? (language === "ta" ? step.label : step.labelEn) : key}:
                  </span>
                  <span className="font-medium max-w-[120px] truncate">
                    {value?.toString() || ""}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Next Step Indicator *//*}
      {currentStep < steps.length && (
        <div className="text-center p-4 bg-gradient-primary/10 rounded-lg border border-primary/20">
          <p className="text-sm text-primary font-medium">
            {language === "ta" ? "அடுத்த படி" : "Next Step"}
          </p>
          <p className="text-sm text-kiosk-header mt-1">
            {language === "ta" 
              ? steps[currentStep]?.label 
              : steps[currentStep]?.labelEn
            }
          </p>
        </div>
      )}
    </div>
  );
};*/

import React from 'react';
import { Check, Circle, AlertCircle } from "lucide-react";

// Assuming UI component imports resolve from './ui/'
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
// Assuming cn is correctly available
const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');


// --- Type Definitions (Matching Index.tsx) ---
type Language = "ta" | "en";
interface Step { key: string; label: string; labelEn: string; }
interface DataCollectionProgressProps {
  steps: Step[];
  currentStep: number;
  userData: Record<string, string>;
  language: Language;
}
// --- End Type Definitions ---


export const DataCollectionProgress: React.FC<DataCollectionProgressProps> = ({
  steps,
  currentStep,
  userData,
  language,
}) => {
  const getStepStatus = (index: number) => {
    if (index < currentStep) return "completed";
    if (index === currentStep) return "current";
    return "pending";
  };

  const getStepIcon = (index: number, step: Step) => {
    const status = getStepStatus(index);
    switch (status) {
      case "completed": return <Check className="w-4 h-4 text-success" />;
      case "current": return <AlertCircle className="w-4 h-4 text-primary animate-pulse" />;
      default: return <Circle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const completedSteps = Object.values(userData).filter(v => v).length;

  return (
    <div className="space-y-4">
      {/* Progress Overview */}
      <div className="text-center">
        <div className="text-3xl font-bold text-primary mb-2">
          {completedSteps}/{steps.length}
        </div>
        <p className="text-sm text-muted-foreground">
          {language === "ta" ? "பூர்த்தி செய்யப்பட்ட படிகள்" : "Steps Completed"}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${(completedSteps / steps.length) * 100}%` }}
        />
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step: Step, index: number) => {
          const status = getStepStatus(index);
          const hasData = userData[step.key];
          
          return (
            <Card 
              key={step.key}
              className={cn(
                "p-4 transition-all duration-300 border",
                status === "current" && "border-primary bg-primary/5 shadow-kiosk",
                status === "completed" && "border-success bg-success/5",
                status === "pending" && "border-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  status === "current" && "bg-primary/10",
                  status === "completed" && "bg-success/10",
                  status === "pending" && "bg-muted"
                )}>
                  {getStepIcon(index, step)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {language === "ta" ? step.label : step.labelEn}
                    </span>
                    {status === "completed" && (
                      <Badge className="bg-success/20 text-success text-xs">
                        {language === "ta" ? "முடிந்தது" : "Done"}
                      </Badge>
                    )}
                    {status === "current" && (
                      <Badge className="text-xs animate-pulse">
                        {language === "ta" ? "நடப்பு" : "Current"}
                      </Badge>
                    )}
                  </div>
                  
                  {hasData && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {userData[step.key]?.toString().substring(0, 30)}
                      {userData[step.key]?.toString().length > 30 ? "..." : ""}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      {/* Collected Data Summary */}
      {Object.keys(userData).length > 0 && (
        <Card className="p-4 bg-muted/30">
          <h4 className="text-sm font-semibold mb-3 text-kiosk-header">
            {language === "ta" ? "சேகரிக்கப்பட்ட தகவல்கள்" : "Collected Data"}
          </h4>
          <div className="space-y-2 text-xs">
            {Object.entries(userData).map(([key, value]) => {
              const step = steps.find(s => s.key === key);
              return (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {step ? (language === "ta" ? step.label : step.labelEn) : key}:
                  </span>
                  <span className="font-medium max-w-[120px] truncate">
                    {value?.toString() || ""}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};