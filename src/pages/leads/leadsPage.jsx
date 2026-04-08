import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  X,
  Sparkles,
  Users,
  Filter,
  ArrowUpRight,
} from 'lucide-react';
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
  mobile_app: 'App mobile',
  referral: 'Parrainage',
  social_media: 'Réseaux sociaux',
  whatsapp: 'WhatsApp',
  phone: 'Téléphone',
  email: 'Email',
  agent: 'Agent',
  other: 'Autre',
};

const COLUMNS = [
  {
    key: 'full_name',
    label: 'Nom',
    render: (_, row) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {row.first_name} {row.last_name}
        </p>
      </div>
    ),
  },
  { key: 'phone', label: 'Téléphone' },
  {
    key: 'email',
    label: 'Email',
    render: (v) => <span className="text-muted-foreground">{v || '—'}</span>,
  },
  {
    key: 'source',
    label: 'Source',
    render: (v) => (
      <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">
        {SOURCE_LABELS[v] || v}
      </span>
    ),
  },
  {
    key: 'status',
    label: 'Statut',
    render: (v) => <StatusBadge map={LEAD_STATUS} value={v} />,
  },
  {
    key: 'agent_name',
    label: 'Agent',
    render: (v) => (
      <span className="text-xs text-muted-foreground">{v || '—'}</span>
    ),
  },
  {
    key: 'created_at',
    label: 'Créé le',
    render: (v) => (
      <span className="text-xs text-muted-foreground">{readableDate(v)}</span>
    ),
  },
];

function StatCard({ label, value }) {
  return (
    <div className="rounded-[24px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

export default function LeadsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    source: '',
    page: 1,
    limit: 20,
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

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const resetFilters = () =>
    setFilters({ search: '', status: '', source: '', page: 1, limit: 20 });

  const hasFilters = filters.search || filters.status || filters.source;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[32px] border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.12),transparent_30%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--surface-1)))] p-6 shadow-sm md:p-8">
        <div className="absolute right-4 top-4 hidden rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur md:flex dark:border-white/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Users className="h-3.5 w-3.5" />
              Gestion commerciale
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Leads
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              
            </p>
          </div>

          <Button
            onClick={() => setShowForm(true)}
            className="h-11 rounded-2xl px-5 shadow-[0_12px_24px_hsl(var(--primary)/0.22)]"
          >
            <Plus size={16} />
            Nouveau lead
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total prospects"
          value={loading ? '...' : meta?.total ?? 0}
        />
        <StatCard
          label="Page actuelle"
          value={loading ? '...' : filters.page}
        />
        <StatCard
          label="Par page"
          value={filters.limit}
        />
        <StatCard
          label="Filtres actifs"
          value={hasFilters ? 'Oui' : 'Non'}
        />
      </section>

      {/* Filters */}
      <section className="rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Filtres</h2>
            <p className="text-sm text-muted-foreground">
              Recherche et segmentation rapide des prospects
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative w-full xl:max-w-sm">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Nom, téléphone, email…"
              className="h-11 rounded-2xl border-border/80 pl-9"
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))
              }
            />
          </div>

          <select
            className="h-11 rounded-2xl border border-input bg-background px-4 text-sm focus:ring-1 focus:ring-ring"
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))
            }
          >
            <option value="">Tous les statuts</option>
            {Object.entries(LEAD_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          <select
            className="h-11 rounded-2xl border border-input bg-background px-4 text-sm focus:ring-1 focus:ring-ring"
            value={filters.source}
            onChange={(e) =>
              setFilters((f) => ({ ...f, source: e.target.value, page: 1 }))
            }
          >
            <option value="">Toutes les sources</option>
            {Object.entries(SOURCE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          {hasFilters ? (
            <Button
              variant="ghost"
              className="h-11 rounded-2xl"
              onClick={resetFilters}
            >
              <X size={14} />
              Réinitialiser
            </Button>
          ) : null}
        </div>
      </section>

      {/* Table */}
      <section className="rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-3 shadow-sm md:p-4">
        {error ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <DataTable
          columns={COLUMNS}
          data={data}
          loading={loading}
          error={null}
          onRowClick={(row) => navigate(`/leads/${row.id}`)}
        />
      </section>

      {/* Pagination */}
      <div className="rounded-[24px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-4 shadow-sm">
        <Pagination
          meta={meta}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        />
      </div>

      {showForm && (
        <LeadFormModal
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchLeads();
          }}
        />
      )}
    </div>
  );
}