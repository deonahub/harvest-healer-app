import { useState, useCallback, useRef, useEffect } from "react";
import { Mic, MicOff, Volume2, VolumeX, Upload, Clock, Search, CloudSun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const speechLangMap: Record<Language, string> = {
  en: "en-US",
  hi: "hi-IN",
  kn: "kn-IN",
  te: "te-IN",
  ta: "ta-IN",
};

// Command keywords per language
const commandMap: Record<Language, Record<string, string>> = {
  en: {
    upload: "upload|photo|image|camera|picture",
    history: "history|past|previous|records",
    analyze: "analyze|scan|check|detect",
    environment: "environment|data|weather|conditions",
  },
  hi: {
    upload: "अपलोड|फोटो|तस्वीर|छवि|कैमरा",
    history: "इतिहास|पिछला|रिकॉर्ड",
    analyze: "विश्लेषण|जांच|स्कैन",
    environment: "पर्यावरण|डेटा|मौसम",
  },
  kn: {
    upload: "ಅಪ್ಲೋಡ್|ಫೋಟೋ|ಚಿತ್ರ|ಕ್ಯಾಮೆರಾ",
    history: "ಇತಿಹಾಸ|ಹಿಂದಿನ|ದಾಖಲೆ",
    analyze: "ವಿಶ್ಲೇಷಣೆ|ಸ್ಕ್ಯಾನ್|ಪರಿಶೀಲಿಸಿ",
    environment: "ಪರಿಸರ|ಡೇಟಾ|ಹವಾಮಾನ",
  },
  te: {
    upload: "అప్లోడ్|ఫోటో|చిత్రం|కెమెరా",
    history: "చరిత్ర|గతం|రికార్డులు",
    analyze: "విశ్లేషణ|స్కాన్|తనిఖీ",
    environment: "పర్యావరణం|డేటా|వాతావరణం",
  },
  ta: {
    upload: "பதிவேற்றம்|புகைப்படம்|படம்|கேமரா",
    history: "வரலாறு|முந்தைய|பதிவுகள்",
    analyze: "பகுப்பாய்வு|ஸ்கேன்|சோதனை",
    environment: "சுற்றுச்சூழல்|தரவு|வானிலை",
  },
};

interface VoiceAssistantProps {
  lastResult?: string | null;
}

const VoiceAssistant = ({ lastResult }: VoiceAssistantProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) {
        toast({ title: t("voice.notSupported"), variant: "destructive" });
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = speechLangMap[language];
      utterance.rate = 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [language, t]
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const matchCommand = useCallback(
    (text: string) => {
      const lower = text.toLowerCase();
      const cmds = commandMap[language] || commandMap.en;

      for (const [action, keywords] of Object.entries(cmds)) {
        const patterns = keywords.split("|");
        if (patterns.some((p) => lower.includes(p))) return action;
      }
      return null;
    },
    [language]
  );

  const executeCommand = useCallback(
    (command: string) => {
      switch (command) {
        case "upload":
          document.getElementById("upload")?.scrollIntoView({ behavior: "smooth" });
          speak(t("voice.goingUpload"));
          break;
        case "history":
          navigate("/history");
          speak(t("voice.goingHistory"));
          break;
        case "analyze":
          if (lastResult) {
            speak(lastResult);
          } else {
            speak(t("voice.noResult"));
          }
          break;
        case "environment":
          document.getElementById("environment")?.scrollIntoView({ behavior: "smooth" });
          speak(t("voice.goingEnvironment"));
          break;
        default:
          speak(t("voice.notUnderstood"));
      }
    },
    [navigate, speak, lastResult, t]
  );

  const startListening = useCallback(async () => {
    console.log("[VoiceAssistant] startListening called");
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    console.log("[VoiceAssistant] SpeechRecognition available:", !!SpeechRecognition);

    if (!SpeechRecognition) {
      toast({
        title: t("voice.notSupported"),
        description: t("voice.notSupportedDesc"),
        variant: "destructive",
      });
      return;
    }

    // Request microphone permission first to ensure the browser grants access
    try {
      console.log("[VoiceAssistant] Requesting microphone permission...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      console.log("[VoiceAssistant] Microphone permission granted");
    } catch (err: any) {
      console.error("[VoiceAssistant] Microphone permission error:", err.name, err.message);
      toast({
        title: t("voice.error"),
        description:
          err.name === "NotAllowedError"
            ? "Microphone permission denied. Please allow microphone access in your browser settings."
            : err.name === "NotFoundError"
            ? "No microphone found on this device."
            : err.message,
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = speechLangMap[language];
    recognition.continuous = false;
    recognition.interimResults = true;
    console.log("[VoiceAssistant] Starting recognition with lang:", recognition.lang);

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      const current = event.results[event.results.length - 1];
      const text = current[0].transcript;
      setTranscript(text);

      if (current.isFinal) {
        const cmd = matchCommand(text);
        if (cmd) {
          executeCommand(cmd);
        } else {
          speak(t("voice.notUnderstood"));
        }
        setTimeout(() => setTranscript(""), 3000);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error !== "aborted" && event.error !== "not-allowed") {
        toast({
          title: t("voice.error"),
          description: event.error,
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
  }, [language, matchCommand, executeCommand, speak, t]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis.cancel();
    };
  }, []);

  const commandHints = [
    { icon: Upload, label: t("voice.cmdUpload") },
    { icon: Clock, label: t("voice.cmdHistory") },
    { icon: Search, label: t("voice.cmdAnalyze") },
    { icon: CloudSun, label: t("voice.cmdEnvironment") },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {isListening && (
        <div className="bg-card border border-border rounded-2xl px-4 py-3 shadow-lg max-w-[220px] animate-slide-up">
          <p className="text-xs font-semibold text-primary mb-2">{t("voice.cmdTitle")}</p>
          <ul className="space-y-1.5">
            {commandHints.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="size-3.5 text-primary/70 shrink-0" />
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {transcript && (
        <div className="bg-card border border-border rounded-xl px-4 py-2 shadow-lg max-w-[250px] text-sm animate-slide-up">
          <p className="text-muted-foreground text-xs mb-1">{t("voice.heard")}</p>
          <p className="font-medium">{transcript}</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {lastResult && (
          <Button
            variant={isSpeaking ? "destructive" : "secondary"}
            size="icon"
            className="size-12 rounded-full shadow-lg"
            onClick={isSpeaking ? stopSpeaking : () => speak(lastResult)}
            title={isSpeaking ? t("voice.stopReading") : t("voice.readResult")}
          >
            {isSpeaking ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </Button>
        )}

        <Button
          variant={isListening ? "destructive" : "hero"}
          size="icon"
          className={`size-14 rounded-full shadow-lg ${isListening ? "animate-pulse" : ""}`}
          onClick={() => {
            console.log("[VoiceAssistant] Mic button clicked, isListening:", isListening);
            if (isListening) {
              stopListening();
            } else {
              startListening();
            }
          }}
          title={isListening ? t("voice.stopListening") : t("voice.startListening")}
        >
          {isListening ? <MicOff className="size-6" /> : <Mic className="size-6" />}
        </Button>
      </div>
    </div>
  );
};

export default VoiceAssistant;
