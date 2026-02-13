import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, FileUp, Home } from "lucide-react";

type Language = "ta" | "en";

interface DocumentVerificationProps {
  userName: string;
  language: Language;
  onVerified: () => void;
}

const API_BASE_URL = "http://localhost:5070";

export function DocumentVerification({
  userName,
  language,
  onVerified,
}: DocumentVerificationProps) {
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [verifying, setVerifying] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);

  const startCamera = async () => {
    if (cameraOn) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      const videoEl = videoRef.current;
      if (videoEl) {
        videoEl.srcObject = stream;
        // Some browsers only start rendering after onloadedmetadata + play()
        videoEl.onloadedmetadata = () => {
          videoEl
            .play()
            .then(() => {
              // Clear any old error if play succeeds
              setStatus("");
            })
            .catch((err) => {
              console.error("Video play error:", err);
            });
        };
      }

      setCameraOn(true);
    } catch (err) {
      console.error("Camera error:", err);
      setStatus(
        language === "ta"
          ? "கேமராவை அணுக முடியவில்லை. உலாவி அனுமதிகளை மற்றும் Windows அமைப்புகளை சரிபார்க்கவும்."
          : "Unable to access camera. Please check browser and Windows camera permissions."
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    // If the video metadata hasn't loaded, we can't capture a proper frame
    if (!video.videoWidth || !video.videoHeight) {
      setStatus(
        language === "ta"
          ? "கேமரா தயார் ஆகவில்லை. சில விநாடிகள் காத்திருந்து மீண்டும் முயற்சிக்கவும்."
          : "Camera is not ready yet. Please wait a few seconds and try again."
      );
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setSelfieBlob(blob);
        setSelfiePreview(URL.createObjectURL(blob));
        stopCamera();
      },
      "image/png",
      0.95
    );
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (selfiePreview) {
        URL.revokeObjectURL(selfiePreview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async () => {
    setVerificationFailed(false);
    setStatus("");

    if (!aadharFile) {
      setStatus(
        language === "ta"
          ? "ஆதார் அட்டை PDF ஐ பதிவேற்றவும்."
          : "Please upload your Aadhaar card PDF."
      );
      return;
    }
    if (!selfieBlob) {
      setStatus(
        language === "ta"
          ? "உங்கள் புகைப்படத்தை எடுக்கவும்."
          : "Please take your photo."
      );
      return;
    }
    if (!userName || !userName.trim()) {
      setStatus(
        language === "ta"
          ? "பெயர் தகவல் கிடைக்கவில்லை. மீண்டும் விவரங்களை நிரப்பவும்."
          : "Name information is missing. Please re-enter your details."
      );
      setVerificationFailed(true);
      return;
    }

    try {
      setVerifying(true);
      setStatus(
        language === "ta"
          ? "ஆவணங்கள் சரிபார்க்கப்படுகிறது..."
          : "Verifying documents..."
      );

      const formData = new FormData();
      formData.append("user_name", userName);
      formData.append("language", language);
      formData.append("aadhar_pdf", aadharFile);
      formData.append(
        "selfie_image",
        new File([selfieBlob], "selfie.png", { type: "image/png" })
      );

      const res = await fetch(`${API_BASE_URL}/verify_documents`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        console.error("Verification error:", data);
        setVerificationFailed(true);
        setStatus(
          data.message ||
          (language === "ta"
            ? "ஆவண சரிபார்ப்பு தோல்வியடைந்தது."
            : "Document verification failed.")
        );
        return;
      }

      if (data.verified) {
        setStatus(
          data.message ||
          (language === "ta"
            ? "ஆவணங்கள் வெற்றிகரமாகச் சரிபார்க்கப்பட்டன."
            : "Documents verified successfully.")
        );
        setTimeout(() => {
          onVerified();
        }, 800);
      } else {
        setVerificationFailed(true);
        setStatus(
          data.message ||
          (language === "ta"
            ? "ஆவண சரிபார்ப்பு தோல்வியடைந்தது."
            : "Document verification failed.")
        );
      }
    } catch (err) {
      console.error("Verification exception:", err);
      setVerificationFailed(true);
      setStatus(
        language === "ta"
          ? "சரிபார்ப்பில் பிழை. மீண்டும் முயற்சிக்கவும் அல்லது வங்கி பணியாளரை அணுகவும்."
          : "Error during verification. Please try again or contact bank staff."
      );
    } finally {
      setVerifying(false);
    }
  };

  const title =
    language === "ta" ? "ஆவண சரிபார்ப்பு" : "Document Verification";
  const subtitle =
    language === "ta"
      ? "தொடர்வதற்கு முன் உங்கள் ஆதார் அட்டையும் உங்கள் புகைப்படமும் சரிபார்க்கப்படுகிறது."
      : "Before continuing, we will verify your Aadhaar card and your photo.";

  return (
    <Card className="bg-kiosk-surface shadow-card border-0 p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-kiosk-header">{title}</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Aadhaar upload */}
          <div className="space-y-3">
            <p className="font-semibold text-sm text-kiosk-header">
              {language === "ta"
                ? "1. ஆதார் அட்டை PDF ஐ பதிவேற்றவும்"
                : "1. Upload Aadhaar card PDF"}
            </p>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setAadharFile(file);
                }}
              />
              <FileUp className="w-5 h-5 text-muted-foreground" />
            </div>
            {aadharFile && (
              <p className="text-xs text-muted-foreground break-all">
                {language === "ta" ? "தேர்ந்தெடுக்கப்பட்டது:" : "Selected:"}{" "}
                {aadharFile.name}
              </p>
            )}
          </div>

          {/* Camera / selfie capture */}
          <div className="space-y-3">
            <p className="font-semibold text-sm text-kiosk-header">
              {language === "ta"
                ? "2. உங்கள் புகைப்படத்தை எடுக்கவும்"
                : "2. Take your photo"}
            </p>

            <div className="space-y-3">
              {/* Live camera option */}
              {!cameraOn && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={startCamera}
                >
                  <Camera className="w-4 h-4" />
                  {language === "ta" ? "கேமராவை தொடங்கவும்" : "Start camera"}
                </Button>
              )}

              {cameraOn && (
                <div className="space-y-2">
                  <video
                    ref={videoRef}
                    className="w-full rounded-lg border bg-black max-h-64 object-contain"
                    autoPlay
                    muted
                    playsInline
                  />
                  <div className="flex gap-2">
                    <Button className="flex-1 gap-2" onClick={takePhoto}>
                      <Camera className="w-4 h-4" />
                      {language === "ta"
                        ? "புகைப்படம் எடுக்கவும்"
                        : "Capture photo"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={stopCamera}
                    >
                      {language === "ta" ? "நிறுத்து" : "Stop"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Fallback: upload selfie from file if camera is not working */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {language === "ta"
                    ? "அல்லது உங்கள் சாதனத்தில் இருந்து புகைப்படத்தை பதிவேற்றவும்"
                    : "Or upload a photo from this device"}
                </p>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (!file) return;
                    // Stop camera if it is running
                    if (cameraOn) {
                      stopCamera();
                    }
                    // Revoke old preview URL
                    if (selfiePreview) {
                      URL.revokeObjectURL(selfiePreview);
                    }
                    setSelfieBlob(file);
                    setSelfiePreview(URL.createObjectURL(file));
                  }}
                />
              </div>

              {selfiePreview && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    {language === "ta"
                      ? "பதிவு செய்யப்பட்ட/பதிவேற்றப்பட்ட புகைப்படம்:"
                      : "Captured / uploaded photo:"}
                  </p>
                  <img
                    src={selfiePreview}
                    alt="Captured selfie"
                    className="w-full max-h-64 object-contain rounded-lg border"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status + actions */}
        <div className="space-y-4 pt-2">
          {status && (
            <div
              className={`text-sm text-center ${verificationFailed ? "text-red-600" : "text-emerald-700"
                }`}
            >
              {status}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleVerify}
              disabled={verifying}
              className="min-w-[180px]"
            >
              {verifying
                ? language === "ta"
                  ? "சரிபார்க்கிறது..."
                  : "Verifying..."
                : language === "ta"
                  ? "ஆவணங்களை சரிபார்க்கவும்"
                  : "Verify documents"}
            </Button>

            {verificationFailed && (
              <Button
                variant="outline"
                className="min-w-[180px] gap-2"
                onClick={() => {
                  window.location.href = "/";
                }}
              >
                <Home className="w-4 h-4" />
                {language === "ta" ? "முகப்பு பக்கத்திற்கு செல்லவும்" : "Go to Home"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

