import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Shield, Sparkles, Smile, Meh, Frown } from "lucide-react";
import VoiceRecorder from "../components/VoiceRecorder";
import MoodChart from "../components/MoodChart";
import JournalEntryCard, { type JournalEntry } from "../components/JournalEntryCard";
import type { Sentiment } from "../components/SentimentBadge";

const INITIAL_ENTRIES: JournalEntry[] = [
  { id: "1", date: "Feb 22", time: "9:15 AM", text: "Woke up feeling really refreshed today. Had a good breakfast and went for a morning walk. The weather was perfect and I felt genuinely grateful for the little things.", sentiment: "positive", score: 0.85, encrypted: true, dayOfWeek: "Sat" },
  { id: "2", date: "Feb 21", time: "8:30 PM", text: "Work was a bit stressful today with the deadline approaching. I managed to take a few breaks though, which helped. Need to remember to be kinder to myself during busy periods.", sentiment: "neutral", score: 0.5, encrypted: true, dayOfWeek: "Fri" },
  { id: "3", date: "Feb 21", time: "7:00 AM", text: "Didn't sleep well last night, feeling tired and a bit anxious about the presentation today. Trying to focus on breathing exercises.", sentiment: "negative", score: 0.15, encrypted: true, dayOfWeek: "Fri" },
  { id: "4", date: "Feb 20", time: "6:45 PM", text: "Great afternoon catching up with an old friend. We laughed so much and it reminded me how important social connections are for my wellbeing.", sentiment: "positive", score: 0.92, encrypted: true, dayOfWeek: "Thu" },
  { id: "5", date: "Feb 19", time: "9:00 PM", text: "A quiet day. Nothing particularly good or bad happened. Spent time reading and doing laundry. Sometimes ordinary days are exactly what you need.", sentiment: "neutral", score: 0.5, encrypted: true, dayOfWeek: "Wed" },
];

const DAYS_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getMoodLabel = (score: number): string => {
  if (score >= 0.6) return "Very positive";
  if (score > 0) return "Positive";
  if (score === 0) return "Neutral";
  if (score > -0.6) return "Negative";
  return "Very negative";
};

type MoodSelection = "positive" | "neutral" | "negative";

const MOOD_OPTIONS: { value: MoodSelection; icon: typeof Smile; label: string }[] = [
  { value: "positive", icon: Smile, label: "😊" },
  { value: "neutral", icon: Meh, label: "😐" },
  { value: "negative", icon: Frown, label: "😔" },
];

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [selectedMood, setSelectedMood] = useState<MoodSelection | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>(INITIAL_ENTRIES);
  const [highlightedEntryIds, setHighlightedEntryIds] = useState<string[]>([]);
  const entriesSectionRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const moodData = useMemo(() => {
    return DAYS_ORDER.map((day) => {
      const dayEntries = entries.filter((e) => e.dayOfWeek === day);
      if (dayEntries.length === 0) {
        return { date: day, score: 0, label: "No record", hasEntries: false };
      }
      const avgScore =
        dayEntries.reduce((sum, e) => sum + (e.score - 0.5) * 2, 0) / dayEntries.length;
      return { date: day, score: avgScore, label: getMoodLabel(avgScore), hasEntries: true };
    });
  }, [entries]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleToggleRecording = useCallback(async () => {
    // STOP RECORDING LOGIC
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = async () => {
          setTranscribing(true);
          // Combine audio chunks into a single WebM blob
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          // Prepare the data to send to the backend
          const formData = new FormData();
          formData.append('audio', audioBlob, 'journal-entry.webm');

          try {
            const response = await fetch('http://localhost:5000/api/journal/voice', {
              method: 'POST',
              body: formData,
            });
            
            if (!response.ok) throw new Error("Backend processing failed");
            
            const data = await response.json();
            
            // Update UI with real data!
            setTranscribedText(data.transcript);
            setSelectedMood(data.analysis.uiMood as MoodSelection); // Automatically selects the mood button!
            
          } catch (error) {
            console.error("Error processing audio:", error);
            setTranscribedText("Sorry, there was an error processing your audio. Please try again.");
          } finally {
            setTranscribing(false);
            // Turn off the microphone completely
            mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
          }
        };
        
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } 
    // START RECORDING LOGIC
    else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        setDuration(0);
        setTranscribedText("");
        setSelectedMood(null);
      } catch (error) {
        console.error("Error accessing microphone:", error);
        alert("Please allow microphone access to record your journal.");
      }
    }
  }, [isRecording]);

  const handleSaveEntry = () => {
    if (!transcribedText) return;
    const now = new Date();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const sentiment: Sentiment = selectedMood || "neutral";
    const scoreMap: Record<Sentiment, number> = { positive: 0.85, neutral: 0.5, negative: 0.15 };
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: `${months[now.getMonth()]} ${now.getDate()}`,
      time: now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      text: transcribedText,
      sentiment,
      score: scoreMap[sentiment],
      encrypted: true,
      dayOfWeek: days[now.getDay()],
    };
    setEntries((prev) => [newEntry, ...prev]);
    setTranscribedText("");
    setSelectedMood(null);
  };

  const handleDiscard = () => {
    setTranscribedText("");
  };

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleDayClick = (day: string) => {
    const matchingEntries = entries.filter((e) => e.dayOfWeek === day);
    if (matchingEntries.length === 0) return;
    const ids = matchingEntries.map((e) => e.id);
    setHighlightedEntryIds(ids);
    const firstEl = entryRefs.current[ids[0]];
    if (firstEl) {
      firstEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    setTimeout(() => setHighlightedEntryIds([]), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-background to-primary/10">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-serif text-foreground">MindJournal</h1>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <Shield className="h-3 w-3" />
            End-to-end encrypted
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h2 className="text-3xl font-serif text-foreground">Good morning ☀️</h2>
          <p className="mt-1 text-muted-foreground">How are you feeling today?</p>
        </motion.div>

        {/* Mood Picker */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 flex gap-3"
        >
          {MOOD_OPTIONS.map((mood) => (
            <button
              key={mood.value}
              onClick={() => setSelectedMood(mood.value)}
              className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all ${
                selectedMood === mood.value
                  ? "border-primary bg-primary/15 text-primary scale-105 shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:bg-card/80"
              }`}
            >
              <span className="text-lg">{mood.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Voice Recording Section */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 rounded-2xl border border-border bg-card p-6"
        >
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Record a voice entry
          </div>
          <VoiceRecorder
            isRecording={isRecording}
            onToggle={handleToggleRecording}
            duration={duration}
          />

          <AnimatePresence>
            {transcribing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 text-center"
              >
                <div className="mx-auto h-1 w-32 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ width: "50%" }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Transcribing & analyzing sentiment...</p>
              </motion.div>
            )}

            {transcribedText && !transcribing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-6 rounded-lg border border-border bg-surface-warm p-4"
              >
                <p className="mb-2 text-xs font-medium text-muted-foreground">Transcribed text</p>
                <p className="text-sm leading-relaxed text-foreground">{transcribedText}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleSaveEntry}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Save entry
                  </button>
                  <button
                    onClick={handleDiscard}
                    className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80"
                  >
                    Discard
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Mood Trend */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="mb-4 text-lg font-serif text-foreground">This week's mood</h3>
          <div className="rounded-2xl border border-border bg-card p-5">
            <MoodChart data={moodData} onDayClick={handleDayClick} />
          </div>
        </motion.section>

        {/* Journal Entries */}
        <motion.section
          ref={entriesSectionRef}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="mb-4 text-lg font-serif text-foreground">Recent entries</h3>
          <div className="space-y-3">
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                ref={(el) => { entryRefs.current[entry.id] = el; }}
              >
                <JournalEntryCard
                  entry={entry}
                  index={i}
                  highlighted={highlightedEntryIds.includes(entry.id)}
                  onDelete={handleDeleteEntry}
                />
              </div>
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default Index;
