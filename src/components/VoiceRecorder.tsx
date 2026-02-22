import { Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceRecorderProps {
  isRecording: boolean;
  onToggle: () => void;
  duration: number;
}

const formatTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const VoiceRecorder = ({ isRecording, onToggle, duration }: VoiceRecorderProps) => {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <AnimatePresence>
          {isRecording && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/20"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 1.6, opacity: 0.3 }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/10"
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 2, opacity: 0.2 }}
                exit={{ scale: 1, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", delay: 0.3 }}
              />
            </>
          )}
        </AnimatePresence>
        <motion.button
          onClick={onToggle}
          className={`relative z-10 flex h-20 w-20 items-center justify-center rounded-full transition-colors ${
            isRecording
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground"
          }`}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
        >
          {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </motion.button>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {isRecording ? "Recording..." : "Tap to start recording"}
        </p>
        {isRecording && (
          <motion.p
            className="mt-1 font-mono text-lg text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {formatTime(duration)}
          </motion.p>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;
