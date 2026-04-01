import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import { leadsApi } from '@/Api/resourceApi';
import DataTable from '@/components/custome/DataTable';
import Pagination from '@/components/custome/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LEAD_STATUS } from '@/Util/statusConfig';
import { readableDate } from '@/Util/readableDate';
import LeadFormModal from './leadFormModal';

const SOURCE_LABELS = {
  landing_page: 'Landing',
  mobile_app:   'App mobile',
  referral:     'Parrainage',
  social_media: 'Réseaux sociaux',
  whatsapp:     'WhatsApp',
  phone:        'Téléphone',
  email:        'Email',
  agent:        'Agent',
  other:        'Autre',
};

const COLUMNS = [
  { key: 'full_name', label: 'Nom',
    render: (_, row) => <span className="font-medium">{row.first_name} {row.last_name}</span> },
  { key: 'phone',  label: 'Téléphone' },
  { key: 'email',  label: 'Email',
    render: (v) => <span className="text-muted-foreground">{v || '—'}</span> },
  { key: 'source', label: 'Source',
    render: (v) => <span className="text-xs">{SOURCE_LABELS[v] || v}</span> },
  { key: 'status', label: 'Statut',
    render: (v) => <StatusBadge map={LEAD_STATUS} value={v} /> },
  { key: 'agent_name', label: 'Agent',
    render: (v) => <span className="text-muted-foreground text-xs">{v || '—'}</span> },
  { key: 'created_at', label: 'Créé le',
    render: (v) => <span className="text-muted-foreground text-xs">{readableDate(v)}</span> },
];

export default function LeadsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [filters, setFilters] = useState({
    search: '', status: '', source: '', page: 1, limit: 20,
  });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const res = await leadsApi.list(params);
      setData(res.data);
      setMeta(res.meta);
    } catch {
      setError('Impossible de charger les leads');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const resetFilters = () =>
    setFilters({ search: '', status: '', source: '', page: 1, limit: 20 });

  const hasFilters = filters.search || filters.status || filters.source;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Leads</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {meta ? `${meta.total} prospect${meta.total > 1 ? 's' : ''}` : 'Chargement…'}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} /> Nouveau lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Nom, téléphone, email…"
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
          {Object.entries(LEAD_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-ring"
          value={filters.source}
          onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value, page: 1 }))}
        >
          <option value="">Toutes les sources</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X size={14} /> Réinitialiser
          </Button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={COLUMNS}
        data={data}
        loading={loading}
        error={error}
        onRowClick={(row) => navigate(`/leads/${row.id}`)}
      />

      <Pagination meta={meta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />

      {/* Create modal */}
      {showForm && (
        <LeadFormModal
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); fetchLeads(); }}
        />
      )}
    </div>
  );
}