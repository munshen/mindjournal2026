import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Shield, Sparkles } from "lucide-react";
import VoiceRecorder from "../components/VoiceRecorder";
import MoodChart from "../components/MoodChart";
import MoodSummary from "../components/MoodSummary";
import JournalEntryCard, { type JournalEntry } from "../components/JournalEntryCard";
import type { Sentiment } from "../components/SentimentBadge";

const SAMPLE_ENTRIES: JournalEntry[] = [
  { id: "1", date: "Feb 22", time: "9:15 AM", text: "Woke up feeling really refreshed today. Had a good breakfast and went for a morning walk. The weather was perfect and I felt genuinely grateful for the little things.", sentiment: "positive", score: 0.85, encrypted: true },
  { id: "2", date: "Feb 21", time: "8:30 PM", text: "Work was a bit stressful today with the deadline approaching. I managed to take a few breaks though, which helped. Need to remember to be kinder to myself during busy periods.", sentiment: "neutral", score: 0.45, encrypted: true },
  { id: "3", date: "Feb 21", time: "7:00 AM", text: "Didn't sleep well last night, feeling tired and a bit anxious about the presentation today. Trying to focus on breathing exercises.", sentiment: "negative", score: 0.25, encrypted: true },
  { id: "4", date: "Feb 20", time: "6:45 PM", text: "Great afternoon catching up with an old friend. We laughed so much and it reminded me how important social connections are for my wellbeing.", sentiment: "positive", score: 0.92, encrypted: true },
  { id: "5", date: "Feb 19", time: "9:00 PM", text: "A quiet day. Nothing particularly good or bad happened. Spent time reading and doing laundry. Sometimes ordinary days are exactly what you need.", sentiment: "neutral", score: 0.5, encrypted: true },
];

const MOOD_DATA = [
  { date: "Mon", score: 0.7, label: "Positive" },
  { date: "Tue", score: 0.3, label: "Neutral" },
  { date: "Wed", score: -0.2, label: "Slightly negative" },
  { date: "Thu", score: 0.5, label: "Positive" },
  { date: "Fri", score: 0.8, label: "Very positive" },
  { date: "Sat", score: 0.6, label: "Positive" },
  { date: "Sun", score: 0.9, label: "Very positive" },
];

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      setIsRecording(false);
      setTranscribing(true);
      // Simulate transcription
      setTimeout(() => {
        setTranscribedText("Today was a pretty good day overall. I managed to finish the project I've been working on and it felt really satisfying to see it come together.");
        setTranscribing(false);
      }, 2000);
    } else {
      setDuration(0);
      setTranscribedText("");
      setIsRecording(true);
    }
  }, [isRecording]);

  const sentimentCounts = SAMPLE_ENTRIES.reduce(
    (acc, e) => {
      acc[e.sentiment]++;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 } as Record<Sentiment, number>
  );

  return (
    <div className="min-h-screen bg-background">
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
          className="mb-8"
        >
          <h2 className="text-3xl font-serif text-foreground">Good morning ☀️</h2>
          <p className="mt-1 text-muted-foreground">How are you feeling today?</p>
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
                  <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                    Save entry
                  </button>
                  <button className="rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/80">
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
            <MoodChart data={MOOD_DATA} />
          </div>
        </motion.section>

        {/* Summary Stats */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h3 className="mb-4 text-lg font-serif text-foreground">Your insights</h3>
          <MoodSummary
            positive={sentimentCounts.positive}
            neutral={sentimentCounts.neutral}
            negative={sentimentCounts.negative}
            streak={7}
          />
        </motion.section>

        {/* Journal Entries */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="mb-4 text-lg font-serif text-foreground">Recent entries</h3>
          <div className="space-y-3">
            {SAMPLE_ENTRIES.map((entry, i) => (
              <JournalEntryCard key={entry.id} entry={entry} index={i} />
            ))}
          </div>
        </motion.section>
      </main>
    </div>
  );
};

export default Index;
