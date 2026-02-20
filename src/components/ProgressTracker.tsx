interface ProgressTrackerProps {
  total: number;
  accepted: number;
  caseName: string;
  status: string;
}

export function ProgressTracker({ total, accepted, caseName, status }: ProgressTrackerProps) {
  const percentage = total > 0 ? Math.round((accepted / total) * 100) : 0;

  return (
    <div className="glass-panel px-6 py-4 flex items-center gap-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold truncate">{caseName}</h1>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            status === "ratified"
              ? "bg-status-accepted/20 text-status-accepted"
              : "bg-primary/20 text-primary"
          }`}>
            {status === "ratified" ? "Ratified" : "In Negotiation"}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1 progress-thermometer">
            <div className="progress-thermometer-fill" style={{ width: `${percentage}%` }} />
          </div>
          <span className="text-sm font-mono text-muted-foreground whitespace-nowrap">
            {accepted}/{total} clauses ({percentage}%)
          </span>
        </div>
      </div>
    </div>
  );
}
