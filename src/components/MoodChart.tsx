import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useCallback } from "react";

interface MoodDataPoint {
  date: string;
  score: number;
  label: string;
  hasEntries?: boolean;
}

interface MoodChartProps {
  data: MoodDataPoint[];
  onDayClick?: (day: string) => void;
}

const CustomDot = ({ cx, cy, payload, onDayClick }: any) => {
  if (cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={6}
      fill="hsl(152, 35%, 45%)"
      stroke="hsl(80, 25%, 97%)"
      strokeWidth={2}
      style={{ cursor: "pointer", opacity: 0 }}
      className="recharts-active-dot"
      onClick={() => onDayClick?.(payload.date)}
      onMouseEnter={(e) => { (e.target as SVGCircleElement).style.opacity = "1"; }}
      onMouseLeave={(e) => { (e.target as SVGCircleElement).style.opacity = "0"; }}
    />
  );
};

const MoodChart = ({ data, onDayClick }: MoodChartProps) => {
  const renderDot = useCallback(
    (props: any) => <CustomDot key={props.index} {...props} onDayClick={onDayClick} />,
    [onDayClick]
  );

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(152, 35%, 45%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(152, 35%, 45%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(160, 10%, 45%)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[-1, 1]}
            ticks={[-1, 0, 1]}
            tickFormatter={(v) => (v === 1 ? "😊" : v === 0 ? "😐" : "😔")}
            tick={{ fontSize: 14 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null;
              const d = payload[0].payload as MoodDataPoint;
              return (
                <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
                  <p className="text-xs text-muted-foreground">{d.date}</p>
                  <p className="text-sm font-medium text-foreground">{d.label}</p>
                  {d.hasEntries !== false && (
                    <p className="text-xs text-primary mt-1 cursor-pointer">Click dot to view entry</p>
                  )}
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="hsl(152, 35%, 45%)"
            strokeWidth={2}
            fill="url(#moodGradient)"
            activeDot={false}
            dot={renderDot}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MoodChart;
