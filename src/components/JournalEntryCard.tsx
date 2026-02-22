import { motion } from "framer-motion";
import { Lock, Calendar } from "lucide-react";
import SentimentBadge, { type Sentiment } from "./SentimentBadge";

export interface JournalEntry {
  id: string;
  date: string;
  time: string;
  text: string;
  sentiment: Sentiment;
  score: number;
  encrypted: boolean;
  dayOfWeek?: string;
}

interface JournalEntryCardProps {
  entry: JournalEntry;
  index: number;
  highlighted?: boolean;
}

const JournalEntryCard = ({ entry, index, highlighted }: JournalEntryCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className={`group rounded-xl border p-4 transition-all duration-300 ${
        highlighted
          ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/30"
          : "border-border bg-card hover:shadow-md"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{entry.date}</span>
          <span>·</span>
          <span>{entry.time}</span>
        </div>
        <div className="flex items-center gap-2">
          {entry.encrypted && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <Lock className="h-3 w-3" />
              Encrypted
            </span>
          )}
          <SentimentBadge sentiment={entry.sentiment} score={entry.score} />
        </div>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">{entry.text}</p>
    </motion.div>
  );
};

export default JournalEntryCard;
