import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.pages <= 1) return null;

  const { page, pages, total, limit } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
      <span>{from}–{to} sur {total} résultats</span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline" size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={14} />
        </Button>
        <span className="px-3 py-1 rounded border text-xs font-medium text-foreground">
          {page} / {pages}
        </span>
        <Button
          variant="outline" size="sm"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}