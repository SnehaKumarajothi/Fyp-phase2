import React from 'react';
// Assuming UI component imports resolve from './ui/'
import { Button } from "./ui/button";
import { Languages } from "lucide-react";


// --- Type Definitions (Matching Index.tsx) ---
type Language = "ta" | "en";
interface LanguageSelectorProps {
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
}
// --- End Type Definitions ---


export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
}) => {
  const languages: { code: Language, name: string, nameEn: string }[] = [
    { code: "ta", name: "தமிழ்", nameEn: "Tamil" },
    { code: "en", name: "English", nameEn: "English" },
  ];
  
  const currentLanguage = languages.find(lang => lang.code === selectedLanguage);
  
  return (
    <div className="relative">
      {/* The Button acts as a trigger to the actual dropdown menu (which we are mocking here) */}
      <Button
        variant="outline"
        size="sm"
        className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
        // Mocked functionality: Clicking the button simply cycles language or uses a simplified UI element
        onClick={() => {
            // Cycle through languages for demonstration
            const currentIndex = languages.findIndex(l => l.code === selectedLanguage);
            const nextIndex = (currentIndex + 1) % languages.length;
            onLanguageChange(languages[nextIndex].code);
        }} 
      >
        <Languages className="w-4 h-4 mr-2" />
        {currentLanguage?.nameEn || "Select Language"}
      </Button>
    </div>
  );
};