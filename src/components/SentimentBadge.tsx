import { motion } from "framer-motion";
import { Smile, Meh, Frown } from "lucide-react";

export type Sentiment = "positive" | "neutral" | "negative";

interface SentimentBadgeProps {
  sentiment: Sentiment;
  score?: number;
  size?: "sm" | "md";
}

const config: Record<Sentiment, { icon: typeof Smile; label: string; className: string }> = {
  positive: { icon: Smile, label: "Positive", className: "bg-sentiment-positive/15 text-sentiment-positive" },
  neutral: { icon: Meh, label: "Neutral", className: "bg-sentiment-neutral/15 text-sentiment-neutral" },
  negative: { icon: Frown, label: "Negative", className: "bg-sentiment-negative/15 text-sentiment-negative" },
};

const SentimentBadge = ({ sentiment, score, size = "sm" }: SentimentBadgeProps) => {
  const { icon: Icon, label, className } = config[sentiment];
  const isSmall = size === "sm";

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${className} ${
        isSmall ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      }`}
    >
      <Icon className={isSmall ? "h-3 w-3" : "h-4 w-4"} />
      {label}
      {score !== undefined && <span className="opacity-70">({Math.round(score * 100)}%)</span>}
    </motion.span>
  );
};

export default SentimentBadge;
