import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

const languages = [
  { code: "ta", name: "தமிழ்", nameEn: "Tamil" },
  { code: "en", name: "English", nameEn: "English" },
  { code: "hi", name: "हिंदी", nameEn: "Hindi" },
  { code: "te", name: "తెలుగు", nameEn: "Telugu" },
  { code: "kn", name: "ಕನ್ನಡ", nameEn: "Kannada" },
  { code: "ml", name: "മലയാളം", nameEn: "Malayalam" },
];

export const LanguageSelector = ({
  selectedLanguage,
  onLanguageChange,
}: LanguageSelectorProps) => {
  const currentLanguage = languages.find(lang => lang.code === selectedLanguage);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
        >
          <Languages className="w-4 h-4 mr-2" />
          {currentLanguage?.nameEn || "Select Language"}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-kiosk-surface border shadow-card"
      >
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => onLanguageChange(language.code)}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              selectedLanguage === language.code && "bg-primary/10 text-primary"
            )}
          >
            <div className="flex flex-col">
              <span className="font-medium">{language.name}</span>
              <span className="text-xs text-muted-foreground">
                {language.nameEn}
              </span>
            </div>
            {selectedLanguage === language.code && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};