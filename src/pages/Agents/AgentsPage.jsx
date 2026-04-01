import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { agentsApi, zonesApi } from '@/Api/resourceApi';
import DataTable from '@/components/custome/DataTable';
import Pagination from '@/components/custome/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { USER_STATUS } from '@/Util/statusConfig';
import { readableDate } from '@/Util/readableDate';

const COLUMNS = [
  {
    key: 'name',
    label: 'Agent',
    render: (_, row) => (
      <div>
        <p className="font-medium text-sm">{row.first_name} {row.last_name}</p>
        <p className="text-xs text-muted-foreground">{row.email || '—'}</p>
      </div>
    ),
  },
  { key: 'phone', label: 'Téléphone', render: (v) => v || '—' },
  { key: 'zone_name', label: 'Zone', render: (v) => <span className="text-sm">{v || '—'}</span> },
  { key: 'status', label: 'Statut', render: (v) => <StatusBadge map={USER_STATUS} value={v} /> },
  { key: 'leads_count', label: 'Leads actifs', render: (v) => <span className="font-semibold">{v ?? '—'}</span> },
  { key: 'active_visits', label: 'Visites actives', render: (v) => <span className="font-semibold">{v ?? '—'}</span> },
  { key: 'created_at', label: 'Créé le', render: (v) => <span className="text-xs text-muted-foreground">{readableDate(v)}</span> },
];

export default function AgentsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    zone_id: '',
    status: '',
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    zonesApi.list().then((r) => setZones(r.data)).catch(() => {});
  }, []);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const res = await agentsApi.list(params);
      setData(res.data);
      setMeta(res.meta);
    } catch {
      setError('Impossible de charger les agents');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const resetFilters = () =>
    setFilters({ search: '', zone_id: '', status: '', page: 1, limit: 20 });

  const hasFilters = filters.search || filters.zone_id || filters.status;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Agents</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {meta ? `${meta.total} agent${meta.total > 1 ? 's' : ''}` : 'Chargement…'}
          </p>
        </div>
        <Button onClick={() => navigate('/agents/new')}>
          <Plus size={16} /> Nouvel agent
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Nom, email…"
            className="pl-8 w-56"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
          />
        </div>

        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.zone_id}
          onChange={(e) => setFilters((f) => ({ ...f, zone_id: e.target.value, page: 1 }))}
        >
          <option value="">Toutes les zones</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>

        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
        >
          <option value="">Tous les statuts</option>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
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
        onRowClick={(row) => navigate(`/agents/${row.id}`)}
      />

      <Pagination meta={meta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
    </div>
  );
}