import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  X,
  CalendarDays,
  Sparkles,
  Filter,
  ArrowUpRight,
  Clock3,
} from 'lucide-react';
import api from '@/Api/axiosInstance';
import DataTable from '@/components/custome/DataTable';
import Pagination from '@/components/custome/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { VISIT_STATUS } from '@/Util/statusConfig';
import { readableDate } from '@/Util/readableDate';
import VisiteFormModal from './VisitFormModal';

const COLUMNS = [
  {
    key: 'client_name',
    label: 'Client / Lead',
    render: (_, row) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {row.client_name || row.lead_name || '—'}
        </p>
      </div>
    ),
  },
  { key: 'terrain_title', label: 'Terrain' },
  {
    key: 'visit_date',
    label: 'Date & heure',
    render: (v, row) => (
      <div>
        <p className="text-sm font-medium">{readableDate(v)}</p>
        <p className="text-xs text-muted-foreground">
          {row.visit_time?.substring(0, 5)}
        </p>
      </div>
    ),
  },
  {
    key: 'agent_name',
    label: 'Agent',
    render: (v) => (
      <span className="text-xs text-muted-foreground">{v || '—'}</span>
    ),
  },
  {
    key: 'status',
    label: 'Statut',
    render: (v) => <StatusBadge map={VISIT_STATUS} value={v} />,
  },
];

function StatCard({ label, value, icon: Icon, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    violet: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
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

export default function VisitesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({ status: '', page: 1, limit: 20 });

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const r = await api.get('/visits', { params });
      setData(r.data.data);
      setMeta(r.data.meta);
    } catch {
      setError('Impossible de charger les visites');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.12),transparent_30%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--surface-1)))] p-6 shadow-sm md:p-8">
        <div className="absolute right-4 top-4 hidden rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur md:flex dark:border-white/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <CalendarDays className="h-3.5 w-3.5" />
              Agenda terrain
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Visites
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              
            </p>
          </div>

          <Button
            onClick={() => setShowForm(true)}
            className="h-11 rounded-2xl px-5 shadow-[0_12px_24px_hsl(var(--primary)/0.22)]"
          >
            <Plus size={16} />
            Planifier une visite
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total visites"
          value={loading ? '...' : meta?.total ?? 0}
          icon={CalendarDays}
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
          label="Filtre statut"
          value={filters.status ? 'Oui' : 'Non'}
          icon={Clock3}
          tone="emerald"
        />
      </section>

      <section className="rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Filtres</h2>
            <p className="text-sm text-muted-foreground">
              Filtre rapide par statut de visite
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            className="h-11 rounded-2xl border border-input bg-background px-4 text-sm"
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))
            }
          >
            <option value="">Tous les statuts</option>
            {Object.entries(VISIT_STATUS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>

          {filters.status ? (
            <Button
              variant="ghost"
              className="h-11 rounded-2xl"
              onClick={() => setFilters((f) => ({ ...f, status: '', page: 1 }))}
            >
              <X size={14} />
              Réinitialiser
            </Button>
          ) : null}
        </div>
      </section>

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
          onRowClick={(row) => navigate(`/visites/${row.id}`)}
        />
      </section>

      <div className="rounded-[24px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-4 shadow-sm">
        <Pagination
          meta={meta}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        />
      </div>

      {showForm && (
        <VisiteFormModal
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetch();
          }}
        />
      )}
    </div>
  );
}