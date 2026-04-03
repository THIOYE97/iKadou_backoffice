import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Plus, RefreshCw, CreditCard, Smartphone,
  Calendar, TrendingUp, CheckCircle, Clock, AlertCircle, Loader2,
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
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(v || 0);

const PROVIDER_BADGES = {
  stripe:        { label: '💳 Stripe',   color: 'bg-blue-100 text-blue-800' },
  danapay:       { label: '📱 DanaPay',  color: 'bg-orange-100 text-orange-800' },
  manual:        { label: '✍️ Manuel',   color: 'bg-gray-100 text-gray-700' },
  bank_transfer: { label: '🏦 Virement', color: 'bg-violet-100 text-violet-800' },
};

const METHOD_ICONS = {
  card:         <CreditCard size={13} className="text-blue-600" />,
  orange_money: <span className="text-sm">🟠</span>,
  wave:         <span className="text-sm">🔵</span>,
  free_money:   <span className="text-sm">🔴</span>,
  moov_money:   <span className="text-sm">🟢</span>,
  mobile_money: <Smartphone size={13} className="text-orange-600" />,
};

function SyncBtn({ id, onSynced }) {
  const [loading, setLoading] = useState(false);
  const handle = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try { await paymentApi.sync(id); onSynced?.(); }
    catch {} finally { setLoading(false); }
  };
  return (
    <Button size="sm" variant="ghost" onClick={handle} disabled={loading}
      className="h-7 px-2" title="Synchroniser avec le provider">
      <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
    </Button>
  );
}

const COLUMNS = [
  { key: 'ref', label: 'Référence',
    render: v => <span className="font-mono text-xs font-semibold text-primary">{v}</span> },
  { key: 'client_name', label: 'Client',
    render: (v, row) => (
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{v || '—'}</p>
        <p className="text-xs text-muted-foreground font-mono truncate">{row.terrain_ref || '—'}</p>
      </div>
    )},
  { key: 'amount', label: 'Montant',
    render: (v, row) => (
      <div>
        <span className="font-semibold text-sm">{fmt(v, row.currency)}</span>
        {row.installment_total > 1 && (
          <p className="text-[10px] text-muted-foreground">
            Éch. {row.installment_num}/{row.installment_total}
          </p>
        )}
      </div>
    )},
  { key: 'provider', label: 'Via',
    render: (v, row) => {
      const badge = PROVIDER_BADGES[v] || { label: v, color: 'bg-muted text-muted-foreground' };
      const icon  = METHOD_ICONS[row.method_type];
      return (
        <div className="flex items-center gap-1.5">
          {icon}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${badge.color}`}>
            {badge.label}
          </span>
        </div>
      );
    }},
  { key: 'status', label: 'Statut',
    render: (v, row) => (
      <div className="flex items-center gap-1">
        <StatusBadge map={PAYMENT_STATUS} value={v} />
        {['stripe','danapay'].includes(row.provider) && v === 'pending' && (
          <SyncBtn id={row.id} />
        )}
      </div>
    )},
  { key: 'created_at', label: 'Date',
    render: v => <span className="text-xs text-muted-foreground">{readableDate(v)}</span> },
];

export default function PaiementsPage() {
  const navigate = useNavigate();
  const [data, setData]           = useState([]);
  const [meta, setMeta]           = useState(null);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError]         = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showPlan, setShowPlan]   = useState(false);
  const [filters, setFilters]     = useState({
    search: '', status: '', provider: '', from_date: '', to_date: '',
    page: 1, limit: 20,
  });

  // Fetch list
  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const r = await paymentApi.list(params);
      setData(r.data); setMeta(r.meta);
    } catch { setError('Impossible de charger les paiements'); }
    finally { setLoading(false); }
  }, [filters]);

  // Fetch stats (independent of pagination)
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries({
          provider:  filters.provider,
          from_date: filters.from_date,
          to_date:   filters.to_date,
        }).filter(([, v]) => v !== '')
      );
      const r = await paymentApi.stats(params);
      setStats(r.data);
    } catch {} finally { setStatsLoading(false); }
  }, [filters.provider, filters.from_date, filters.to_date]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const hasFilters = filters.search || filters.status || filters.provider
    || filters.from_date || filters.to_date;

  const resetFilters = () => setFilters({
    search: '', status: '', provider: '', from_date: '', to_date: '', page: 1, limit: 20,
  });

  // KPI cards from real stats endpoint
  const KPI_CARDS = stats ? [
    {
      label: 'Total confirmé',
      value: fmt(stats.global?.confirmed_amount),
      sub: `${stats.global?.confirmed_count || 0} transactions`,
      icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50',
    },
    {
      label: 'En attente',
      value: fmt(stats.global?.pending_amount),
      sub: `${stats.global?.pending_count || 0} transactions`,
      icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50',
    },
    {
      label: '💳 Stripe',
      value: `${stats.global?.stripe_count || 0}`,
      sub: 'transactions',
      icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50',
    },
    {
      label: '📱 DanaPay',
      value: `${stats.global?.danapay_count || 0}`,
      sub: 'transactions',
      icon: Smartphone, color: 'text-orange-600', bg: 'bg-orange-50',
    },
  ] : [];

  return (
    <div className="space-y-5">

      {/* ── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Paiements</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {meta ? `${meta.total} transaction${meta.total > 1 ? 's' : ''}` : '…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPlan(true)}>
            <Calendar size={15} /> Plan échelonné
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Nouveau paiement
          </Button>
        </div>
      </div>

      {/* ── KPI cards — real data from stats endpoint ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card rounded-xl border h-20 animate-pulse" />
            ))
          : KPI_CARDS.map(k => {
              const Icon = k.icon;
              return (
                <div key={k.label} className="bg-card rounded-xl border px-4 py-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${k.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={16} className={k.color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    <p className={`font-display font-bold text-sm ${k.color} truncate`}>{k.value}</p>
                    <p className="text-[10px] text-muted-foreground">{k.sub}</p>
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* ── Filters ─── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Réf., client, terrain…"
            className="pl-8 w-52"
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
          />
        </div>

        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.status}
          onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
          <option value="">Tous les statuts</option>
          {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={filters.provider}
          onChange={e => setFilters(f => ({ ...f, provider: e.target.value, page: 1 }))}>
          <option value="">Tous les providers</option>
          <option value="stripe">💳 Stripe</option>
          <option value="danapay">📱 DanaPay</option>
          <option value="manual">✍️ Manuel</option>
          <option value="bank_transfer">🏦 Virement</option>
        </select>

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            className="h-9 w-36 text-xs"
            value={filters.from_date}
            onChange={e => setFilters(f => ({ ...f, from_date: e.target.value, page: 1 }))}
            title="Date de début"
          />
          <span className="text-muted-foreground text-xs">→</span>
          <Input
            type="date"
            className="h-9 w-36 text-xs"
            value={filters.to_date}
            onChange={e => setFilters(f => ({ ...f, to_date: e.target.value, page: 1 }))}
            title="Date de fin"
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <X size={14} /> Reset
          </Button>
        )}
      </div>

      {/* ── Table ─── */}
      <DataTable
        columns={COLUMNS}
        data={data}
        loading={loading}
        error={error}
        onRowClick={row => navigate(`/paiements/${row.id}`)}
      />
      <Pagination meta={meta} onPageChange={p => setFilters(f => ({ ...f, page: p }))} />

      {/* ── Modals ─── */}
      {showCreate && (
        <CreatePaymentModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); fetch(); fetchStats(); }}
        />
      )}
      {showPlan && (
        <InstallmentPlanModal
          onClose={() => setShowPlan(false)}
          onSuccess={() => { setShowPlan(false); fetch(); fetchStats(); }}
        />
      )}
    </div>
  );
}