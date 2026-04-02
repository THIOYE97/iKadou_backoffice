import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Plus, RefreshCw, CreditCard, Smartphone, Calendar, TrendingUp, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
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

const fmt = (amount, currency = 'XOF') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

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
    <Button size="sm" variant="ghost" onClick={handle} disabled={loading} className="h-7 px-2" title="Synchroniser avec le provider">
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
        <p className="text-xs text-muted-foreground font-mono">{row.terrain_ref || '—'}</p>
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
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge.color}`}>
            {badge.label}
          </span>
        </div>
      );
    }},
  { key: 'status', label: 'Statut',
    render: (v, row) => (
      <div className="flex items-center gap-1">
        <StatusBadge map={PAYMENT_STATUS} value={v} />
        {(row.provider === 'stripe' || row.provider === 'danapay') && v === 'pending' && (
          <SyncBtn id={row.id} />
        )}
      </div>
    )},
  { key: 'created_at', label: 'Date',
    render: v => <span className="text-xs text-muted-foreground">{readableDate(v)}</span> },
];

export default function PaiementsPage() {
  const navigate = useNavigate();
  const [data, setData]             = useState([]);
  const [meta, setMeta]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showPlan, setShowPlan]     = useState(false);
  const [filters, setFilters]       = useState({ search: '', status: '', provider: '', page: 1, limit: 20 });

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const r = await paymentApi.list(params);
      setData(r.data); setMeta(r.meta);
    } catch { setError('Impossible de charger les paiements'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const hasFilters = filters.search || filters.status || filters.provider;

  // Page-level stats
  const stats = data.reduce((acc, p) => {
    if (p.status === 'confirmed') acc.confirmedAmount += Number(p.amount);
    if (p.status === 'pending')   acc.pendingAmount   += Number(p.amount);
    if (p.provider === 'stripe')  acc.stripeCount++;
    if (p.provider === 'danapay') acc.danaCount++;
    return acc;
  }, { confirmedAmount: 0, pendingAmount: 0, stripeCount: 0, danaCount: 0 });

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

      {/* ── KPI cards ─── */}
      {data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Confirmés', value: fmt(stats.confirmedAmount), icon: CheckCircle, color: 'text-emerald-600', iconBg: 'bg-emerald-100' },
            { label: 'En attente', value: fmt(stats.pendingAmount),  icon: Clock,       color: 'text-amber-600',  iconBg: 'bg-amber-100' },
            { label: '💳 Stripe',  value: `${stats.stripeCount} tx`, icon: CreditCard,  color: 'text-blue-600',   iconBg: 'bg-blue-100' },
            { label: '📱 DanaPay', value: `${stats.danaCount} tx`,   icon: Smartphone,  color: 'text-orange-600', iconBg: 'bg-orange-100' },
          ].map(k => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="bg-card rounded-xl border px-4 py-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${k.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={16} className={k.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                  <p className={`text-sm font-display font-bold ${k.color} truncate`}>{k.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Filters ─── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Référence paiement…"
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

        {hasFilters && (
          <Button variant="ghost" size="sm"
            onClick={() => setFilters({ search: '', status: '', provider: '', page: 1, limit: 20 })}>
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
          onSuccess={() => { setShowCreate(false); fetch(); }}
        />
      )}
      {showPlan && (
        <InstallmentPlanModal
          onClose={() => setShowPlan(false)}
          onSuccess={() => { setShowPlan(false); fetch(); }}
        />
      )}
    </div>
  );
}
