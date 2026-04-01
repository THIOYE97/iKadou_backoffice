import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { ticketsApi } from '@/Api/resourceApi';
import DataTable from '@/components/custome/DataTable';
import Pagination from '@/components/custome/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TICKET_STATUS, TICKET_PRIORITY } from '@/Util/statusConfig';
import { readableDate } from '@/Util/readableDate';

const COLUMNS = [
  {
    key: 'ref',
    label: 'Réf.',
    render: (v) => <span className="font-mono text-xs font-semibold text-primary">{v}</span>,
  },
  { key: 'client_name', label: 'Client', render: (v) => v || '—' },
  { key: 'subject', label: 'Sujet', render: (v) => <span className="text-sm font-medium">{v}</span> },
  { key: 'priority', label: 'Priorité', render: (v) => <StatusBadge map={TICKET_PRIORITY} value={v} /> },
  { key: 'status', label: 'Statut', render: (v) => <StatusBadge map={TICKET_STATUS} value={v} /> },
  { key: 'assigned_name', label: 'Assigné à', render: (v) => <span className="text-xs text-muted-foreground">{v || '—'}</span> },
  {
    key: 'created_at',
    label: 'Ouvert le',
    render: (v) => <span className="text-xs text-muted-foreground">{readableDate(v)}</span>,
  },
];

export default function TicketsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    page: 1,
    limit: 20,
  });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const res = await ticketsApi.list(params);
      setData(res.data);
      setMeta(res.meta);
    } catch {
      setError('Impossible de charger les tickets');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const resetFilters = () =>
    setFilters({
      search: '',
      status: '',
      priority: '',
      page: 1,
      limit: 20,
    });

  const hasFilters = filters.search || filters.status || filters.priority;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Tickets Support</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {meta ? `${meta.total} ticket${meta.total > 1 ? 's' : ''}` : 'Chargement…'}
          </p>
        </div>
        <Button onClick={() => navigate('/support/new')}>
          <Plus size={16} /> Nouveau ticket
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Référence, sujet…"
            className="pl-8 w-56"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
          />
        </div>

        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
        >
          <option value="">Tous les statuts</option>
          {Object.entries(TICKET_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.priority}
          onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value, page: 1 }))}
        >
          <option value="">Toutes priorités</option>
          {Object.entries(TICKET_PRIORITY).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X size={14} /> Réinitialiser
          </Button>
        )}
      </div>

      <DataTable
        columns={COLUMNS}
        data={data}
        loading={loading}
        error={error}
        onRowClick={(row) => navigate(`/support/${row.id}`)}
      />

      <Pagination meta={meta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
    </div>
  );
}