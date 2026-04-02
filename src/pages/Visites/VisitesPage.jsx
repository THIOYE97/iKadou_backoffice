import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, CalendarDays } from 'lucide-react';
import api from '@/Api/axiosInstance';
import DataTable from '@/components/custome/DataTable';
import Pagination from '@/components/custome/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { VISIT_STATUS } from '@/Util/statusConfig';
import { readableDate } from '@/Util/readableDate';
import VisiteFormModal from './VisitFormModal';

const COLUMNS = [
  { key: 'client_name', label: 'Client / Lead',
    render: (_, row) => <span className="font-medium text-sm">{row.client_name || row.lead_name || '—'}</span> },
  { key: 'terrain_title', label: 'Terrain' },
  { key: 'visit_date', label: 'Date & heure',
    render: (v, row) => (
      <div>
        <p className="text-sm font-medium">{readableDate(v)}</p>
        <p className="text-xs text-muted-foreground">{row.visit_time?.substring(0,5)}</p>
      </div>
    )},
  { key: 'agent_name', label: 'Agent',
    render: v => <span className="text-xs text-muted-foreground">{v || '—'}</span> },
  { key: 'status', label: 'Statut',
    render: v => <StatusBadge map={VISIT_STATUS} value={v} /> },
];

export default function VisitesPage() {
  const navigate = useNavigate();
  const [data, setData]         = useState([]);
  const [meta, setMeta]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters]   = useState({ status: '', page: 1, limit: 20 });

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const r = await api.get('/visits', { params });
      setData(r.data.data); setMeta(r.data.meta);
    } catch { setError('Impossible de charger les visites'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Visites</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {meta ? `${meta.total} visite${meta.total > 1 ? 's' : ''}` : '…'}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}><Plus size={16} /> Planifier une visite</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
          <option value="">Tous les statuts</option>
          {Object.entries(VISIT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        {filters.status && (
          <Button variant="ghost" size="sm" onClick={() => setFilters(f => ({ ...f, status: '', page: 1 }))}>
            <X size={14} /> Reset
          </Button>
        )}
      </div>

      <DataTable columns={COLUMNS} data={data} loading={loading} error={error}
        onRowClick={row => navigate(`/visites/${row.id}`)} />
      <Pagination meta={meta} onPageChange={p => setFilters(f => ({ ...f, page: p }))} />

      {showForm && (
        <VisiteFormModal onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); fetch(); }} />
      )}
    </div>
  );
}