import { motion } from "framer-motion";
import { Lock, Calendar, Trash2 } from "lucide-react";
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
  onDelete?: (id: string) => void;
}

const JournalEntryCard = ({ entry, index, highlighted, onDelete }: JournalEntryCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className={`group relative rounded-xl border p-4 transition-all duration-300 ${
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
      <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3 pr-8">{entry.text}</p>
      {onDelete && (
        <button
          onClick={() => onDelete(entry.id)}
          className="absolute bottom-3 right-3 rounded-md p-1.5 text-muted-foreground/50 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          aria-label="Delete entry"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
};

export default JournalEntryCard;
