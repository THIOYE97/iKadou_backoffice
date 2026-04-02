import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Reusable page header with optional back button and actions slot.
 *
 * Props:
 *   title: string
 *   subtitle?: string
 *   backTo?: string     — route to navigate back to
 *   children?           — action buttons on the right
 */
export default function PageHeader({ title, subtitle, backTo, children }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3">
      {backTo && (
        <Button variant="ghost" size="icon" onClick={() => navigate(backTo)}>
          <ArrowLeft size={18} />
        </Button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="font-display text-2xl font-semibold text-foreground truncate">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
    </div>
  );
}