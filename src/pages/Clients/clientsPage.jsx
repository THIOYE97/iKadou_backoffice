import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Sparkles,
  Users,
  Filter,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';
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
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">
          {row.first_name} {row.last_name}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {row.email || '—'}
        </p>
      </div>
    ),
  },
  {
    key: 'phone',
    label: 'Téléphone',
    render: (v) => v || '—',
  },
  {
    key: 'country',
    label: 'Pays',
    render: (v) => v || '—',
  },
  {
    key: 'status',
    label: 'Statut',
    render: (v) => <StatusBadge map={CLIENT_STATUS} value={v} />,
  },
  {
    key: 'kyc_verified',
    label: 'KYC',
    render: (v) =>
      v ? (
        <Badge variant="success">Vérifié</Badge>
      ) : (
        <Badge variant="outline">Non vérifié</Badge>
      ),
  },
  {
    key: 'created_at',
    label: 'Inscrit le',
    render: (v) => (
      <span className="text-xs text-muted-foreground">{readableDate(v)}</span>
    ),
  },
];

function StatCard({ label, value, icon: Icon, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  };

  return (
    <div className="rounded-[24px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone] || tones.primary}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

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
              Base clients
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Clients
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl border bg-background/70 px-4 py-3 text-sm text-muted-foreground backdrop-blur">
            <ArrowUpRight className="h-4 w-4 text-primary" />
            Pilotage et suivi client
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total clients"
          value={loading ? '...' : meta?.total ?? 0}
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Page actuelle"
          value={loading ? '...' : filters.page}
          icon={Filter}
          tone="violet"
        />
        <StatCard
          label="Par page"
          value={filters.limit}
          icon={ArrowUpRight}
          tone="orange"
        />
        <StatCard
          label="Filtres actifs"
          value={hasFilters ? 'Oui' : 'Non'}
          icon={ShieldCheck}
          tone="emerald"
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
              Recherche et segmentation rapide des clients
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
              placeholder="Nom, email, téléphone…"
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
            {Object.entries(CLIENT_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
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
          onRowClick={(row) => navigate(`/clients/${row.id}`)}
        />
      </section>

      {/* Pagination */}
      <div className="rounded-[24px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-4 shadow-sm">
        <Pagination
          meta={meta}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        />
      </div>
    </div>
  );
}