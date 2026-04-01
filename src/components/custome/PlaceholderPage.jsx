import { Construction } from 'lucide-react';

/**
 * Generic placeholder for pages not yet implemented.
 * Replace with real implementation in subsequent phases.
 */
export default function PlaceholderPage({ title, description, icon: Icon = Construction }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm mt-1">{description}</p>
        )}
      </div>
      <div className="flex flex-col items-center justify-center h-64 rounded-xl border border-dashed text-muted-foreground gap-3">
        <Icon size={32} className="opacity-30" />
        <p className="text-sm">Module en cours de développement</p>
      </div>
    </div>
  );
}
