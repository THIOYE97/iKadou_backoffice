import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  User,
  CalendarDays,
  CreditCard,
  HeadphonesIcon,
  TrendingUp,
} from 'lucide-react';
import api from '@/Api/axiosInstance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PERIODS = [
  { label: "Aujourd'hui", value: 'today' },
  { label: '7 derniers jours', value: '7d' },
  { label: '30 derniers jours', value: '30d' },
  { label: 'Ce mois', value: 'month' },
];

function KpiCard({ label, value, icon: Icon, tone = 'primary', path, loading }) {
  const navigate = useNavigate();

  const tones = {
    primary: {
      iconBg: 'bg-primary',
      ring: 'hover:border-primary/30',
      glow: 'hover:shadow-[0_8px_30px_rgba(14,165,183,0.12)]',
    },
    orange: {
      iconBg: 'bg-[hsl(var(--accent-foreground))]',
      ring: 'hover:border-orange-300/40',
      glow: 'hover:shadow-[0_8px_30px_rgba(255,107,0,0.12)]',
    },
    violet: {
      iconBg: 'bg-violet-500',
      ring: 'hover:border-violet-300/40',
      glow: 'hover:shadow-[0_8px_30px_rgba(139,92,246,0.12)]',
    },
    rose: {
      iconBg: 'bg-rose-500',
      ring: 'hover:border-rose-300/40',
      glow: 'hover:shadow-[0_8px_30px_rgba(244,63,94,0.12)]',
    },
    emerald: {
      iconBg: 'bg-emerald-500',
      ring: 'hover:border-emerald-300/40',
      glow: 'hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)]',
    },
  };

  const theme = tones[tone] || tones.primary;

  return (
    <Card
      onClick={() => path && navigate(path)}
      className={[
        'cursor-pointer border transition-all duration-200',
        'bg-card/95 backdrop-blur-sm',
        'hover:-translate-y-0.5',
        theme.ring,
        theme.glow,
      ].join(' ')}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>

            {loading ? (
              <div className="mt-2 h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <p className="mt-2 text-3xl font-display font-bold tracking-tight">
                {value ?? '—'}
              </p>
            )}
          </div>

          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm ${theme.iconBg}`}>
            <Icon size={22} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SmallStatusBadge({ children, tone = 'default' }) {
  const tones = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    orange: 'bg-orange-100 text-orange-700',
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${tones[tone] || tones.default}`}>
      {children}
    </span>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState('30d');
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    api
      .get('/dashboard/kpis', { params: { period } })
      .then((r) => setKpis(r.data?.data || null))
      .catch((err) => {
        setKpis(null);
        setError(err?.response?.data?.message || 'Impossible de charger le dashboard');
      })
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Vue opérationnelle globale
          </p>
        </div>

        <div className="inline-flex w-fit gap-1 rounded-xl border bg-card p-1 shadow-sm">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={[
                'rounded-lg px-3 py-2 text-xs font-medium transition-all',
                period === p.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              ].join(' ')}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Nouveaux leads"
          value={kpis?.new_leads}
          icon={Users}
          tone="primary"
          path="/leads"
          loading={loading}
        />
        <KpiCard
          label="Leads en attente"
          value={kpis?.pending_leads}
          icon={TrendingUp}
          tone="orange"
          path="/leads"
          loading={loading}
        />
        <KpiCard
          label="Visites planifiées"
          value={kpis?.visits_planned}
          icon={CalendarDays}
          tone="violet"
          path="/visites"
          loading={loading}
        />
        <KpiCard
          label="Paiements en att."
          value={kpis?.payments_pending}
          icon={CreditCard}
          tone="orange"
          path="/paiements"
          loading={loading}
        />
        <KpiCard
          label="Tickets ouverts"
          value={kpis?.tickets_open}
          icon={HeadphonesIcon}
          tone="rose"
          path="/support"
          loading={loading}
        />
        <KpiCard
          label="Clients actifs"
          value={kpis?.active_clients}
          icon={User}
          tone="emerald"
          path="/clients"
          loading={loading}
        />
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Leads récents</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : !kpis?.recent_leads?.length ? (
              <p className="text-sm text-muted-foreground">Aucun lead récent</p>
            ) : (
              <div className="space-y-2">
                {kpis.recent_leads.map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {l.first_name} {l.last_name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {l.source || '—'}
                      </p>
                    </div>

                    <SmallStatusBadge tone="primary">
                      {l.status}
                    </SmallStatusBadge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Visites à venir</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : !kpis?.upcoming_visits?.length ? (
              <p className="text-sm text-muted-foreground">Aucune visite à venir</p>
            ) : (
              <div className="space-y-2">
                {kpis.upcoming_visits.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {v.terrain_title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {v.visit_date} à {v.visit_time}
                      </p>
                    </div>

                    <SmallStatusBadge tone="orange">
                      {v.agent_name || '—'}
                    </SmallStatusBadge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}