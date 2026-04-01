import { Badge } from '@/components/ui/badge';
import { getStatusConfig } from '@/Util/statusConfig';

export default function StatusBadge({ map = {}, value, status }) {
  const finalValue = value ?? status ?? '';
  const config = map?.[finalValue];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
        config?.className || 'bg-slate-100 text-slate-600 border-slate-200'
      }`}
    >
      {config?.label || finalValue || 'Inconnu'}
    </span>
  );
}
