import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { visitsApi, agentsApi } from '@/Api/resourceApi';
import DataTable from '@/components/custome/DataTable';
import Pagination from '@/components/custome/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VISIT_STATUS } from '@/Util/statusConfig';
import { readableDate } from '@/Util/readableDate';

const COLUMNS = [
  {
    key: 'client',
    label: 'Client/Lead',
    render: (_, row) => <span className="font-medium text-sm">{row.client_name || row.lead_name || '—'}</span>,
  },
  {
    key: 'terrain_title',
    label: 'Terrain',
    render: (v) => <span className="text-sm">{v || '—'}</span>,
  },
  {
    key: 'visit_date',
    label: 'Date',
    render: (v, row) => (
      <span className="text-sm">
        {readableDate(v)} à {row.visit_time?.substring(0, 5)}
      </span>
    ),
  },
  {
    key: 'agent_name',
    label: 'Agent',
    render: (v) => <span className="text-muted-foreground text-xs">{v || '—'}</span>,
  },
  {
    key: 'status',
    label: 'Statut',
    render: (v) => <StatusBadge map={VISIT_STATUS} value={v} />,
  },
];

export default function VisitesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    status: '',
    agent_id: '',
    from_date: '',
    to_date: '',
    page: 1,
    limit: 20,
  });

  useEffect(() => {
    agentsApi.list({ page: 1, limit: 100 }).then((r) => setAgents(r.data)).catch(() => {});
  }, []);

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const res = await visitsApi.list(params);
      setData(res.data);
      setMeta(res.meta);
    } catch {
      setError('Impossible de charger les visites');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const resetFilters = () =>
    setFilters({
      status: '',
      agent_id: '',
      from_date: '',
      to_date: '',
      page: 1,
      limit: 20,
    });

  const hasFilters = filters.status || filters.agent_id || filters.from_date || filters.to_date;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Visites</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {meta ? `${meta.total} visite${meta.total > 1 ? 's' : ''}` : 'Chargement…'}
          </p>
        </div>
        <Button onClick={() => navigate('/visites/new')}>
          <Plus size={16} /> Planifier une visite
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
        >
          <option value="">Tous les statuts</option>
          {Object.entries(VISIT_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.agent_id}
          onChange={(e) => setFilters((f) => ({ ...f, agent_id: e.target.value, page: 1 }))}
        >
          <option value="">Tous les agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.first_name} {a.last_name}
            </option>
          ))}
        </select>

        <Input
          type="date"
          className="w-44"
          value={filters.from_date}
          onChange={(e) => setFilters((f) => ({ ...f, from_date: e.target.value, page: 1 }))}
        />

        <Input
          type="date"
          className="w-44"
          value={filters.to_date}
          onChange={(e) => setFilters((f) => ({ ...f, to_date: e.target.value, page: 1 }))}
        />

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
        onRowClick={(row) => navigate(`/visites/${row.id}`)}
      />

      <Pagination meta={meta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
    </div>
  );
}