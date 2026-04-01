import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { clientsApi } from '@/Api/resourceApi';
import DataTable from '@/components/custome/DataTable';
import Pagination from '@/components/custome/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CLIENT_STATUS } from '@/Util/statusConfig';
import { readableDate } from '@/Util/readableDate';

const COLUMNS = [
  {
    key: 'name',
    label: 'Client',
    render: (_, row) => (
      <div>
        <p className="font-medium">{row.first_name} {row.last_name}</p>
        <p className="text-xs text-muted-foreground">{row.email || '—'}</p>
      </div>
    ),
  },
  { key: 'phone', label: 'Téléphone', render: (v) => v || '—' },
  { key: 'country', label: 'Pays', render: (v) => v || '—' },
  { key: 'status', label: 'Statut', render: (v) => <StatusBadge map={CLIENT_STATUS} value={v} /> },
  {
    key: 'kyc_verified',
    label: 'KYC',
    render: (v) => v ? <Badge variant="success">Vérifié</Badge> : <Badge variant="outline">Non vérifié</Badge>,
  },
  { key: 'created_at', label: 'Inscrit le', render: (v) => <span className="text-muted-foreground text-xs">{readableDate(v)}</span> },
];

export default function ClientsPage() {
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

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const res = await clientsApi.list(params);
      setData(res.data);
      setMeta(res.meta);
    } catch {
      setError('Impossible de charger les clients');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const resetFilters = () =>
    setFilters({ search: '', status: '', page: 1, limit: 20 });

  const hasFilters = filters.search || filters.status;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Clients</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {meta ? `${meta.total} client${meta.total > 1 ? 's' : ''}` : 'Chargement…'}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Nom, email, téléphone…"
            className="pl-8 w-64"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
          />
        </div>

        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-ring"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
        >
          <option value="">Tous les statuts</option>
          {Object.entries(CLIENT_STATUS).map(([k, v]) => (
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
        onRowClick={(row) => navigate(`/clients/${row.id}`)}
      />

      <Pagination meta={meta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
    </div>
  );
}