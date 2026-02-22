import { Smile, Meh, Frown, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface MoodSummaryProps {
  positive: number;
  neutral: number;
  negative: number;
  streak: number;
}

const MoodSummary = ({ positive, neutral, negative, streak }: MoodSummaryProps) => {
  const total = positive + neutral + negative || 1;
  const stats = [
    { label: "Positive", value: positive, pct: Math.round((positive / total) * 100), icon: Smile, colorClass: "text-sentiment-positive bg-sentiment-positive/10" },
    { label: "Neutral", value: neutral, pct: Math.round((neutral / total) * 100), icon: Meh, colorClass: "text-sentiment-neutral bg-sentiment-neutral/10" },
    { label: "Negative", value: negative, pct: Math.round((negative / total) * 100), icon: Frown, colorClass: "text-sentiment-negative bg-sentiment-negative/10" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="rounded-xl border border-border bg-card p-3 text-center"
        >
          <div className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full ${s.colorClass}`}>
            <s.icon className="h-4 w-4" />
          </div>
          <p className="text-lg font-semibold text-foreground">{s.pct}%</p>
          <p className="text-xs text-muted-foreground">{s.label}</p>
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        className="rounded-xl border border-border bg-card p-3 text-center"
      >
        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <TrendingUp className="h-4 w-4" />
        </div>
        <p className="text-lg font-semibold text-foreground">{streak}</p>
        <p className="text-xs text-muted-foreground">Day streak</p>
      </motion.div>
    </div>
  );
};

export default MoodSummary;
