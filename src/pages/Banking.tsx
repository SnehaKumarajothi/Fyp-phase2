
/*Add Mock API to show current statistics such as:
- Balance Enquiry
- Transaction History limited to 5
- Account Type and Branch
- Loan Eligibility 
- Interest Rates
- KYC Status*/
/*import { useState } from "react";
import { Button } from "@/components/ui/button";

type Mode = "bank" | "education";
type Language = "ta" | "en";

let matchedSchemes: any[] = [];
let userData: any = {};
export default function Banking() {
  const [mode, setMode] = useState<Mode>("bank");
  const [language, setLanguage] = useState<Language>("ta");

  const t = {
    title: language === "ta" ? "வங்கி சேவைகள்" : "Banking Services",

    bank: {
      title: language === "ta" ? "வங்கியை அணுகவும்" : "Access Your Bank",
      note:
        language === "ta"
          ? "இந்த சேவைகள் வங்கியின் அதிகாரப்பூர்வ இணையதளத்தில் திறக்கப்படும்."
          : "These services open on the bank’s official website.",
    },

    schemes: {
      title:
        language === "ta"
          ? "உங்களுக்கு பரிந்துரைக்கப்பட்ட திட்டங்கள்"
          : "Recommended Schemes",
      empty:
        language === "ta"
          ? "முதலில் திட்ட பரிந்துரை செய்ய வேண்டும்"
          : "Please complete scheme recommendation first",
    },

    education: {
      title:
        language === "ta"
          ? "வங்கி தொடர்பான விளக்கம்"
          : "Banking Awareness",
    },
  };

  const redirectToBank = (bank: "SBI" | "HDFC") => {
    const urls = {
      SBI: "https://retail.onlinesbi.sbi/",
      HDFC: "https://netbanking.hdfcbank.com/",
    };
    window.open(urls[bank], "_blank");
  };

  return (
    <div className="p-6 space-y-8 max-w-screen-xl mx-auto">
      {/* TITLE + LANGUAGE *//*}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.title}</h1>
        <Button onClick={() => setLanguage(language === "ta" ? "en" : "ta")}>
          {language === "ta" ? "English" : "தமிழ்"}
        </Button>
      </div>

      {/* MODE SELECTOR *//*}
      <div className="flex gap-4">
        <Button onClick={() => setMode("bank")}>🏦 Bank</Button>
        <Button onClick={() => setMode("education")}>📘 Learn</Button>
      </div>

      {/* ================= MODE 1: BANK ================= *//*}
      {mode === "bank" && (
        <section className="border rounded-lg p-4">
          <h2 className="font-semibold mb-2">{t.bank.title}</h2>
          <p className="text-sm text-gray-600 mb-4">{t.bank.note}</p>

          <div className="flex gap-4">
            <Button onClick={() => redirectToBank("SBI")}>SBI</Button>
            <Button onClick={() => redirectToBank("HDFC")}>HDFC</Button>
          </div>
        </section>
      )}

      {/* ================= MODE 2: EDUCATION ================= *//*}
      {mode === "education" && (
        <section className="border rounded-lg p-4">
          <h2 className="font-semibold mb-3">{t.education.title}</h2>
          <ul className="space-y-2 text-sm">
            <li>
              {language === "ta"
                ? "KYC என்பது உங்கள் அடையாளத்தை உறுதிப்படுத்தும் நடைமுறை."
                : "KYC verifies your identity."}
            </li>
            <li>
              {language === "ta"
                ? "வட்டி என்பது சேமிப்பில் கிடைக்கும் கூடுதல் தொகை."
                : "Interest is extra money earned on savings."}
            </li>
            <li>
              {language === "ta"
                ? "கடன் பெற வருமானம் மற்றும் KYC அவசியம்."
                : "Income and KYC affect loan eligibility."}
            </li>
          </ul>
        </section>
      )}
    </div>
  );
}*/

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2 } from "lucide-react";
type Mode = "bank" | "education";
type Language = "ta" | "en";

const EXPLAIN_CARDS = [
  {
    id: "kyc",
    titleTa: "KYC என்றால் என்ன?",
    titleEn: "What is KYC?",
    topicPrompt: "Explain what KYC is in very simple terms without financial jargon.",
  },
  {
    id: "interest",
    titleTa: "வட்டி என்றால் என்ன?",
    titleEn: "What is Interest?",
    topicPrompt: "Explain what bank interest means in very simple terms.",
  },
  {
    id: "loan",
    titleTa: "கடன் தகுதி என்றால் என்ன?",
    titleEn: "What is Loan Eligibility?",
    topicPrompt: "Explain loan eligibility in simple language for common people.",
  },
   {
    id: "bank-account",
    titleTa: "வங்கி கணக்கு என்றால் என்ன?",
    titleEn: "What is a Bank Account?",
    topicPrompt:
      "Explain what a bank account is and why people need it, using simple everyday examples.",
  },

  {
    id: "savings-account",
    titleTa: "சேமிப்பு கணக்கு என்றால் என்ன?",
    titleEn: "What is a Savings Account?",
    topicPrompt:
      "Explain what a savings account is and how it helps people save money safely.",
  },

  {
    id: "balance-check",
    titleTa: "இருப்பு தொகையை எப்படித் தெரிந்து கொள்வது?",
    titleEn: "How to Check Account Balance?",
    topicPrompt:
      "Explain simple ways to check bank balance like ATM, mobile, or bank visit, without technical terms.",
  },

  {
    id: "atm-card",
    titleTa: "ATM அட்டை என்றால் என்ன?",
    titleEn: "What is an ATM Card?",
    topicPrompt:
      "Explain what an ATM card is and how people can use it safely for cash and payments.",
  },

  {
    id: "government-schemes",
    titleTa: "அரசு திட்டங்கள் என்றால் என்ன?",
    titleEn: "What are Government Schemes?",
    topicPrompt:
      "Explain what government welfare schemes are and how they help common people.",
  },

  {
    id: "scheme-eligibility",
    titleTa: "ஒரு திட்டத்திற்கு தகுதி எப்படித் தெரியும்?",
    titleEn: "How to Know if You Are Eligible for a Scheme?",
    topicPrompt:
      "Explain how eligibility for government schemes is decided in simple terms.",
  },

  {
    id: "subsidy",
    titleTa: "உதவி தொகை (Subsidy) என்றால் என்ன?",
    titleEn: "What is a Subsidy?",
    topicPrompt:
      "Explain what subsidy means and how the government helps people by reducing costs.",
  },

  {
    id: "dbt",
    titleTa: "பணம் நேரடியாக கணக்கில் வருவது எப்படி?",
    titleEn: "How Does Money Come Directly to Bank Account?",
    topicPrompt:
      "Explain Direct Benefit Transfer in very simple language without using the term DBT.",
  },

  {
    id: "documents",
    titleTa: "வங்கிக்கு என்ன ஆவணங்கள் தேவை?",
    titleEn: "What Documents Are Needed for Bank Services?",
    topicPrompt:
      "Explain common documents needed for bank services like Aadhaar, PAN, and address proof.",
  },

  {
    id: "fraud-safety",
    titleTa: "வங்கி மோசடிகளில் இருந்து எப்படி பாதுகாப்பது?",
    titleEn: "How to Stay Safe from Banking Fraud?",
    topicPrompt:
      "Explain common banking frauds and how people can protect themselves in simple language.",
  },
  {
    id: "bank-charges",
    titleTa: "வங்கியில் ஏன் சில கட்டணங்கள் வசூலிக்கப்படுகிறது?",
    titleEn: "Why Does the Bank Charge Fees?",
    topicPrompt:
        "Explain why banks sometimes charge small fees or penalties in very simple language without using financial jargon.",
  },

];

export default function Banking() {
  const [language, setLanguage] = useState<Language>("ta");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [mode, setMode] = useState<Mode>("bank");
  const t = {
    title: language === "ta" ? "வங்கி சேவைகள்" : "Banking Services",
    learnTitle:
      language === "ta"
        ? "வங்கி தொடர்பான விளக்கம்"
        : "Banking Awareness",
    modes: {
        bank: language === "ta" ? "வங்கி" : "Bank",
        education: language === "ta" ? "விளக்கம்" : "Information",
        },

    bank: {
        title: language === "ta" ? "உங்கள் வங்கியை அணுகவும்" : "Access Your Bank",
        note:
            language === "ta"
            ? "இந்த சேவைகள் வங்கியின் அதிகாரப்பூர்வ இணையதளத்தில் திறக்கப்படும்."
            : "These services open on the bank’s official website.",
    },
  };

  const playExplanation = async (cardId: string, prompt: string) => {
    // Stop existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setPlayingId(cardId);

    // If cached → play directly
    if (audioCache[cardId]) {
      const audio = new Audio(audioCache[cardId]);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => setPlayingId(null);
      return;
    }

    // Else → fetch from backend
    try {
      const res = await fetch("http://localhost:5050/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: prompt,
          language,
        }),
      });

      const data = await res.json();

      const audioUrl = `http://localhost:5050${data.audio}`;

      setAudioCache((prev) => ({
        ...prev,
        [cardId]: audioUrl,
      }));

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.play();
      audio.onended = () => setPlayingId(null);
    } catch (err) {
      console.error("Audio explanation failed", err);
      setPlayingId(null);
    }
  };
  const redirectToBank = (bank: "SBI" | "HDFC") => {
    const urls = {
      SBI: "https://retail.onlinesbi.sbi/",
      HDFC: "https://netbanking.hdfcbank.com/",
    };
    window.open(urls[bank], "_blank");
  };
  return (
    <div className="p-6 space-y-8 max-w-screen-xl mx-auto">
      {/* HEADER */}
        <div className="flex items-center justify-between">
        {/* LEFT */}
        <div>
            <Button
            onClick={() => (window.location.href = "/")}
            >
            {language === "en" ? "Back" : "பின்னுக்கு"}
            </Button>
        </div>

        {/* CENTER */}
        <h1 className="text-2xl font-bold text-center">
            {t.title}
        </h1>

        {/* RIGHT */}
        <div>
            <Button
            onClick={() => setLanguage(language === "ta" ? "en" : "ta")}
            >
            {language === "ta" ? "English" : "தமிழ்"}
            </Button>
        </div>
        </div>
      {/* BODY */}
      <div className="max-w-screen-xl mx-auto p-6 space-y-6">
        {/* MODE SELECTOR */}
        <div className="flex gap-3">
          {(["bank", "education"] as Mode[]).map((m) => (
            <Button
              key={m}
              variant={mode === m ? "default" : "outline"}
              onClick={() => setMode(m)}
            >
              {t.modes[m]}
            </Button>
          ))}
        </div>

        {/* BANK MODE */}
        {mode === "bank" && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-2">{t.bank.title}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t.bank.note}
            </p>

            <div className="flex gap-4">
              <Button onClick={() => redirectToBank("SBI")}>SBI</Button>
              <Button onClick={() => redirectToBank("HDFC")}>HDFC</Button>
            </div>
          </Card>
        )}

      {/* EDUCATION SECTION */}
        {mode === "education" && (
          <section>
            <h2 className="text-xl font-semibold mb-4">{t.learnTitle}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EXPLAIN_CARDS.map((card) => {
                const isPlaying = playingId === card.id;

            return (
              <Card
                key={card.id}
                className={`p-4 transition border ${
                  isPlaying
                    ? "border-blue-500 bg-blue-50"
                    : "border-muted"
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className="font-medium">
                    {language === "ta" ? card.titleTa : card.titleEn}
                  </p>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      playExplanation(card.id, card.topicPrompt)
                    }
                  >
                    <Volume2
                      className={`w-5 h-5 ${
                        isPlaying ? "text-blue-600 animate-pulse" : ""
                      }`}
                    />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
        </section>
        )}
    </div>
    </div>
  );
}
