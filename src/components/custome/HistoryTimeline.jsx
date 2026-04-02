import { readableTimestamp } from '@/Util/readableDate';

/**
 * HistoryTimeline — renders a chronological list of history entries.
 *
 * Props:
 *   entries: [{ id, action, old_value, new_value, comment, author, created_at }]
 *   emptyText?: string
 */
export default function HistoryTimeline({ entries = [], emptyText = 'Aucun historique.' }) {
  if (!entries.length) {
    return <p className="text-sm text-muted-foreground py-2">{emptyText}</p>;
  }

  return (
    <div className="space-y-4">
      {entries.map((h, i) => (
        <div key={h.id || i} className="flex items-start gap-3 text-sm">
          {/* Dot + line */}
          <div className="flex flex-col items-center flex-shrink-0 mt-1">
            <div className={`w-2.5 h-2.5 rounded-full border-2 ${
              h.new_value?.includes('confirmed') || h.action?.includes('confirmed')
                ? 'bg-emerald-500 border-emerald-500'
                : h.new_value?.includes('failed') || h.action?.includes('failed')
                  ? 'bg-destructive border-destructive'
                  : 'bg-primary border-primary'
            }`} />
            {i < entries.length - 1 && (
              <div className="w-px flex-1 bg-border mt-1" style={{ minHeight: 20 }} />
            )}
          </div>

          <div className="flex-1 pb-2">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium capitalize">
                {h.action?.replace(/_/g, ' ') || 'Action'}
              </span>
              <span className="text-xs text-muted-foreground flex-shrink-0 mt-0.5">
                {readableTimestamp(h.created_at)}
              </span>
            </div>

            {h.old_value && h.new_value && (
              <p className="text-muted-foreground text-xs mt-0.5">
                <span className="line-through opacity-60">{h.old_value}</span>
                {' → '}
                <span className="font-medium text-foreground">{h.new_value}</span>
              </p>
            )}
            {h.comment && (
              <p className="text-muted-foreground text-xs mt-0.5 italic">"{h.comment}"</p>
            )}
            {(h.author || h.author_name) && (
              <p className="text-xs text-muted-foreground mt-0.5">
                par {h.author || h.author_name}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}