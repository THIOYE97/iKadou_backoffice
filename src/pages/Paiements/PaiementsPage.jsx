import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Plus,
  RefreshCw,
  CreditCard,
  Smartphone,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  Sparkles,
  ArrowUpRight,
  Landmark,
} from 'lucide-react';
import { paymentApi } from '@/Api/paymentApi';
import DataTable from '@/components/custome/DataTable';
import Pagination from '@/components/custome/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PAYMENT_STATUS } from '@/Util/statusConfig';
import { readableDate } from '@/Util/readableDate';
import CreatePaymentModal from './CreatePaymentModal';
import InstallmentPlanModal from './InstallmentPlanModal';

const fmt = (v, c = 'XOF') =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: c,
    maximumFractionDigits: 0,
  }).format(v || 0);

const PROVIDER_BADGES = {
  stripe: { label: '💳 Stripe', color: 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300' },
  danapay: { label: '📱 DanaPay', color: 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300' },
  manual: { label: '✍️ Manuel', color: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/70' },
  bank_transfer: { label: '🏦 Virement', color: 'bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300' },
};

const METHOD_ICONS = {
  card: <CreditCard size={13} className="text-blue-600" />,
  orange_money: <span className="text-sm">🟠</span>,
  wave: <span className="text-sm">🔵</span>,
  free_money: <span className="text-sm">🔴</span>,
  moov_money: <span className="text-sm">🟢</span>,
  mobile_money: <Smartphone size={13} className="text-orange-600" />,
};

function SyncBtn({ id, onSynced }) {
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await paymentApi.sync(id);
      onSynced?.();
    } catch {}
    finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handle}
      disabled={loading}
      className="h-7 rounded-xl px-2"
      title="Synchroniser avec le provider"
    >
      <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
    </Button>
  );
}

const COLUMNS = [
  {
    key: 'ref',
    label: 'Référence',
    render: (v) => <span className="font-mono text-xs font-semibold text-primary">{v}</span>,
  },
  {
    key: 'client_name',
    label: 'Client',
    render: (v, row) => (
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{v || '—'}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">{row.terrain_ref || '—'}</p>
      </div>
    ),
  },
  {
    key: 'amount',
    label: 'Montant',
    render: (v, row) => (
      <div>
        <span className="text-sm font-semibold">{fmt(v, row.currency)}</span>
        {row.installment_total > 1 ? (
          <p className="text-[10px] text-muted-foreground">
            Éch. {row.installment_num}/{row.installment_total}
          </p>
        ) : null}
      </div>
    ),
  },
  {
    key: 'provider',
    label: 'Via',
    render: (v, row) => {
      const badge = PROVIDER_BADGES[v] || { label: v, color: 'bg-muted text-muted-foreground' };
      const icon = METHOD_ICONS[row.method_type];

      return (
        <div className="flex items-center gap-1.5">
          {icon}
          <span className={`whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badge.color}`}>
            {badge.label}
          </span>
        </div>
      );
    },
  },
  {
    key: 'status',
    label: 'Statut',
    render: (v, row) => (
      <div className="flex items-center gap-1">
        <StatusBadge map={PAYMENT_STATUS} value={v} />
        {['stripe', 'danapay'].includes(row.provider) && v === 'pending' ? (
          <SyncBtn id={row.id} onSynced={() => {}} />
        ) : null}
      </div>
    ),
  },
  {
    key: 'created_at',
    label: 'Date',
    render: (v) => <span className="text-xs text-muted-foreground">{readableDate(v)}</span>,
  },
];

function StatCard({ label, value, sub, icon: Icon, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  };

  return (
    <div className="rounded-[24px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tones[tone] || tones.primary}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function PaiementsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    provider: '',
    from_date: '',
    to_date: '',
    page: 1,
    limit: 20,
  });

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const r = await paymentApi.list(params);
      setData(r.data);
      setMeta(r.meta);
    } catch {
      setError('Impossible de charger les paiements');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries({
          provider: filters.provider,
          from_date: filters.from_date,
          to_date: filters.to_date,
        }).filter(([, v]) => v !== '')
      );
      const r = await paymentApi.stats(params);
      setStats(r.data);
    } catch {}
    finally {
      setStatsLoading(false);
    }
  }, [filters.provider, filters.from_date, filters.to_date]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const hasFilters =
    filters.search ||
    filters.status ||
    filters.provider ||
    filters.from_date ||
    filters.to_date;

  const resetFilters = () =>
    setFilters({
      search: '',
      status: '',
      provider: '',
      from_date: '',
      to_date: '',
      page: 1,
      limit: 20,
    });

  const KPI_CARDS = stats
    ? [
        {
          label: 'Total confirmé',
          value: fmt(stats.global?.confirmed_amount),
          sub: `${stats.global?.confirmed_count || 0} transactions`,
          icon: CheckCircle,
          tone: 'emerald',
        },
        {
          label: 'En attente',
          value: fmt(stats.global?.pending_amount),
          sub: `${stats.global?.pending_count || 0} transactions`,
          icon: Clock,
          tone: 'orange',
        },
        {
          label: 'Stripe',
          value: `${stats.global?.stripe_count || 0}`,
          sub: 'transactions',
          icon: CreditCard,
          tone: 'blue',
        },
        {
          label: 'DanaPay',
          value: `${stats.global?.danapay_count || 0}`,
          sub: 'transactions',
          icon: Smartphone,
          tone: 'primary',
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.12),transparent_30%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--surface-1)))] p-6 shadow-sm md:p-8">
        <div className="absolute right-4 top-4 hidden rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur md:flex dark:border-white/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <CreditCard className="h-3.5 w-3.5" />
              Pilotage financier
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Paiements
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
             
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
  <Button
    variant="outline"
    className="h-11 rounded-2xl"
    onClick={() => navigate('/paiements/configurations')}
  >
    <Landmark size={15} />
    Modes de paiement
  </Button>

  <Button variant="outline" className="h-11 rounded-2xl" onClick={() => setShowPlan(true)}>
    <Calendar size={15} />
    Plan échelonné
  </Button>

  <Button
    onClick={() => setShowCreate(true)}
    className="h-11 rounded-2xl px-5 shadow-[0_12px_24px_hsl(var(--primary)/0.22)]"
  >
    <Plus size={15} />
    Nouveau paiement
  </Button>
</div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-[24px] border bg-muted/50" />
            ))
          : KPI_CARDS.map((k) => (
              <StatCard
                key={k.label}
                label={k.label}
                value={k.value}
                sub={k.sub}
                icon={k.icon}
                tone={k.tone}
              />
            ))}
      </section>

      <section className="rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Filtres</h2>
            <p className="text-sm text-muted-foreground">
              Recherche par référence, client, provider, statut et période
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Réf., client, terrain…"
              className="h-11 w-56 rounded-2xl pl-8"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            />
          </div>

          <select
            className="h-11 rounded-2xl border border-input bg-background px-4 text-sm"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))}
          >
            <option value="">Tous les statuts</option>
            {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <select
            className="h-11 rounded-2xl border border-input bg-background px-4 text-sm"
            value={filters.provider}
            onChange={(e) => setFilters((f) => ({ ...f, provider: e.target.value, page: 1 }))}
          >
            <option value="">Tous les providers</option>
            <option value="stripe">💳 Stripe</option>
            <option value="danapay">📱 DanaPay</option>
            <option value="manual">✍️ Manuel</option>
            <option value="bank_transfer">🏦 Virement</option>
          </select>

          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              className="h-11 w-40 rounded-2xl text-xs"
              value={filters.from_date}
              onChange={(e) => setFilters((f) => ({ ...f, from_date: e.target.value, page: 1 }))}
            />
            <span className="text-xs text-muted-foreground">→</span>
            <Input
              type="date"
              className="h-11 w-40 rounded-2xl text-xs"
              value={filters.to_date}
              onChange={(e) => setFilters((f) => ({ ...f, to_date: e.target.value, page: 1 }))}
            />
          </div>

          {hasFilters ? (
            <Button variant="ghost" className="h-11 rounded-2xl" onClick={resetFilters}>
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
          onRowClick={(row) => navigate(`/paiements/${row.id}`)}
        />
      </section>

      <div className="rounded-[24px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-4 shadow-sm">
        <Pagination meta={meta} onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))} />
      </div>

      {showCreate ? (
        <CreatePaymentModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            fetch();
            fetchStats();
          }}
        />
      ) : null}

      {showPlan ? (
        <InstallmentPlanModal
          onClose={() => setShowPlan(false)}
          onSuccess={() => {
            setShowPlan(false);
            fetch();
            fetchStats();
          }}
        />
      ) : null}
    </div>
  );
}