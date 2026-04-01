import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { paymentsApi } from '@/Api/resourceApi';
import DataTable from '@/components/custome/DataTable';
import Pagination from '@/components/custome/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PAYMENT_STATUS } from '@/Util/statusConfig';
import { readableDate } from '@/Util/readableDate';

const fmt = (amount, currency) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'XOF',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const COLUMNS = [
  {
    key: 'ref',
    label: 'Référence',
    render: (v) => <span className="font-mono text-xs font-semibold text-primary">{v}</span>,
  },
  { key: 'client_name', label: 'Client', render: (v) => v || '—' },
  { key: 'terrain_title', label: 'Terrain', render: (v) => <span className="text-sm">{v || '—'}</span> },
  {
    key: 'amount',
    label: 'Montant',
    render: (v, row) => <span className="font-semibold">{fmt(v, row.currency)}</span>,
  },
  {
    key: 'status',
    label: 'Statut',
    render: (v) => <StatusBadge map={PAYMENT_STATUS} value={v} />,
  },
  {
    key: 'created_at',
    label: 'Date',
    render: (v) => <span className="text-muted-foreground text-xs">{readableDate(v)}</span>,
  },
];

export default function PaiementsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 20,
  });

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const res = await paymentsApi.list(params);
      setData(res.data);
      setMeta(res.meta);
    } catch {
      setError('Impossible de charger les paiements');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const resetFilters = () =>
    setFilters({
      search: '',
      status: '',
      page: 1,
      limit: 20,
    });

  const hasFilters = filters.search || filters.status;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Paiements</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {meta ? `${meta.total} transaction${meta.total > 1 ? 's' : ''}` : 'Chargement…'}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Référence paiement…"
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
          {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
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
        onRowClick={(row) => navigate(`/paiements/${row.id}`)}
      />

      <Pagination meta={meta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
    </div>
  );
}