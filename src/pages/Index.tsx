//index.tsx
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Shield, Sparkles, Brain, CheckCircle2 } from "lucide-react";
import VoiceRecorder from "../components/VoiceRecorder";
import MoodChart from "../components/MoodChart";
import JournalEntryCard, { type JournalEntry } from "../components/JournalEntryCard";
import SentimentBadge from "../components/SentimentBadge";
import { io, Socket } from "socket.io-client";

const DAYS_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const getMoodLabel = (score: number): string => {
  if (score >= 0.8) return "Very positive";
  if (score >= 0.6) return "Positive";
  if (score >= 0.4) return "Neutral";
  if (score >= 0.2) return "Negative";
  return "Very negative";
};

const Index = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [highlightedEntryIds, setHighlightedEntryIds] = useState<string[]>([]);
  
  const socketRef = useRef<Socket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const entriesSectionRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 1. Initialize Socket Connection
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    socketRef.current = io(backendUrl);

    socketRef.current.on("loadHistory", (history: JournalEntry[]) => {
    setEntries(history);
    });
    
    socketRef.current.on("transcriptUpdate", (data: { text: string; isFinal: boolean }) => {
      setLiveTranscript(data.text);
    });

    socketRef.current.on("saveComplete", (entry: JournalEntry) => {
      setEntries((prev) => [entry, ...prev]);
      setAiAnalysis(entry); // Show the result card
      setIsAnalyzing(false);
      setLiveTranscript(""); // Reset for next time
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // 2. Audio Processing & Streaming
  const startStreaming = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      
      // Standard ScriptProcessor for raw audio chunks
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 for Google STT
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        socketRef.current?.emit("audioData", pcmData.buffer);
      };

      socketRef.current?.emit("startStream");
      setIsRecording(true);
      setDuration(0);
      setAiAnalysis(null);
    } catch (err) {
      console.error("Mic access error:", err);
      alert("Please allow microphone access.");
    }
  };

  const stopStreaming = () => {
    setIsRecording(false);
    setIsAnalyzing(true);
    
    // Stop audio hardware
    processorRef.current?.disconnect();
    audioContextRef.current?.close();
    streamRef.current?.getTracks().forEach(track => track.stop());

    // Tell backend to finalize and analyze
    socketRef.current?.emit("stopStream", liveTranscript);
  };

  const handleToggleRecording = useCallback(() => {
    if (isRecording) stopStreaming();
    else startStreaming();
  }, [isRecording, liveTranscript]);

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // --- Updated Mood Trend Calculation with High Sensitivity ---
  const moodData = useMemo(() => {
    return DAYS_ORDER.map((day) => {
      const dayEntries = entries.filter((e) => e.dayOfWeek === day);
      
      if (dayEntries.length === 0) return { date: day, score: 0.5, hasEntries: false };
      
      // Calculate average
      const avgScore = dayEntries.reduce((sum, e) => sum + e.score, 0) / dayEntries.length;

      // FIX: If the score is negative (below 0.5), we "stretch" it 
      // so it sits lower on the graph and doesn't look neutral.
      let displayScore = avgScore;
      if (avgScore < 0.5) {
        displayScore = avgScore * 0.6; // This pushes the line further down
      }

      return { 
        date: day, 
        score: displayScore, 
        label: getMoodLabel(avgScore), 
        hasEntries: true 
      };
    });
  }, [entries]);

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    socketRef.current?.emit('deleteEntry', id); // Sends the ID to the server.js listener above
  };

  const handleDayClick = (day: string) => {
    const matchingEntries = entries.filter((e) => e.dayOfWeek === day);
    if (matchingEntries.length === 0) return;
    const ids = matchingEntries.map((e) => e.id);
    setHighlightedEntryIds(ids);
    entryRefs.current[ids[0]]?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setHighlightedEntryIds([]), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-background to-primary/10">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-serif text-foreground">MindJournal</h1>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <Shield className="h-3 w-3" /> Encrypted Cloud Storage
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-3xl font-serif text-foreground">How's your mind today?</h2>
          <p className="mt-1 text-muted-foreground italic">Just start speaking to record your thoughts.</p>
        </motion.div>

        {/* Voice Section */}
        <motion.section className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Voice Recording
            </div>
            {isRecording && (
              <span className="flex items-center gap-2 text-xs font-bold text-red-500 animate-pulse">
                <div className="h-2 w-2 rounded-full bg-red-500" /> LIVE STREAMING
              </span>
            )}
          </div>
          
          <VoiceRecorder isRecording={isRecording} onToggle={handleToggleRecording} duration={duration} />

          {/* Real-time Transcript Area */}
          <AnimatePresence>
            {(isRecording || liveTranscript) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 rounded-xl bg-muted/30 border border-dashed border-primary/20">
                <p className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-2">Real-time Transcription</p>
                <p className="text-lg leading-relaxed text-foreground min-h-[1.5em]">
                  {liveTranscript || "Listening..."}
                  {isRecording && <span className="inline-block w-1 h-5 ml-1 bg-primary animate-pulse" />}
                </p>
              </motion.div>
            )}

            {isAnalyzing && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center">
                <Brain className="mx-auto h-8 w-8 text-primary animate-bounce mb-2" />
                <p className="text-sm font-medium text-primary">AI Analyzing Emotional Tone...</p>
              </motion.div>
            )}

            {/* AI Result Card (Replaces Manual Mood Buttons) */}
            {aiAnalysis && !isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="mt-6 p-6 rounded-xl bg-primary/5 border border-primary/20 shadow-inner"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <h4 className="font-bold text-foreground">Entry Analyzed</h4>
                  </div>
                  <SentimentBadge sentiment={aiAnalysis.sentiment} />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Dominant Emotion:</span>
                    <span className="text-sm font-medium text-primary capitalize">{aiAnalysis.emotion}</span>
                  </div>
                  
                  {/* This is your humanized summary/response */}
                  <p className="text-sm italic text-foreground leading-relaxed">"{aiAnalysis.summary}"</p>
                  
                  {/* NEW: Actionable/Comforting Advice Section */}
                  {aiAnalysis.advice && (
                    <div className="mt-4 p-3 bg-primary/10 rounded-lg border-l-4 border-primary">
                      <p className="text-xs font-bold text-primary uppercase mb-1">A little thought for you:</p>
                      <p className="text-sm text-foreground italic">{aiAnalysis.advice}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h3 className="mb-4 text-lg font-serif text-foreground">Recent entries</h3>
            <div className="space-y-3">
              {entries.map((entry, i) => (
                <div key={entry.id} ref={(el) => { entryRefs.current[entry.id] = el; }}>
                  <JournalEntryCard
                    entry={entry}
                    index={i}
                    highlighted={highlightedEntryIds.includes(entry.id)}
                    onDelete={handleDeleteEntry}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-serif text-foreground">Mood Trend</h3>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <MoodChart data={moodData} onDayClick={handleDayClick} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;