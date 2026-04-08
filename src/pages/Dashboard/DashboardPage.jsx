import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  User,
  CalendarDays,
  CreditCard,
  HeadphonesIcon,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Sparkles,
} from 'lucide-react';
import api from '@/Api/axiosInstance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PERIODS = [
  { label: "Aujourd'hui", value: 'today' },
  { label: '7 derniers jours', value: '7d' },
  { label: '30 derniers jours', value: '30d' },
  { label: 'Ce mois', value: 'month' },
];

function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'primary',
  path,
  loading,
  subtitle,
}) {
  const navigate = useNavigate();

  const tones = {
    primary: {
      iconWrap:
        'bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-deep)))] text-white shadow-[0_12px_30px_hsl(var(--primary)/0.28)]',
      badge: 'bg-primary/10 text-primary',
      hover: 'hover:border-primary/20',
    },
    orange: {
      iconWrap:
        'bg-[linear-gradient(135deg,#ff9b3d,#ff6b00)] text-white shadow-[0_12px_30px_rgba(255,107,0,0.22)]',
      badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
      hover: 'hover:border-orange-300/30',
    },
    violet: {
      iconWrap:
        'bg-[linear-gradient(135deg,#8b5cf6,#6d28d9)] text-white shadow-[0_12px_30px_rgba(139,92,246,0.22)]',
      badge: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
      hover: 'hover:border-violet-300/30',
    },
    rose: {
      iconWrap:
        'bg-[linear-gradient(135deg,#f43f5e,#e11d48)] text-white shadow-[0_12px_30px_rgba(244,63,94,0.22)]',
      badge: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
      hover: 'hover:border-rose-300/30',
    },
    emerald: {
      iconWrap:
        'bg-[linear-gradient(135deg,#10b981,#059669)] text-white shadow-[0_12px_30px_rgba(16,185,129,0.22)]',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
      hover: 'hover:border-emerald-300/30',
    },
  };

  const theme = tones[tone] || tones.primary;

  return (
    <Card
      onClick={() => path && navigate(path)}
      className={[
        'group cursor-pointer overflow-hidden rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))]',
        'shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]',
        theme.hover,
      ].join(' ')}
    >
      <CardContent className="relative p-5">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-muted/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              Indicateur
            </div>

            <p className="mt-3 text-sm font-medium text-muted-foreground">{label}</p>

            {loading ? (
              <div className="mt-3 h-9 w-24 animate-pulse rounded-xl bg-muted" />
            ) : (
              <p className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                {value ?? '—'}
              </p>
            )}

            <p className="mt-2 text-xs text-muted-foreground">
              {subtitle || 'Accès rapide aux données'}
            </p>
          </div>

          <div
            className={[
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105',
              theme.iconWrap,
            ].join(' ')}
          >
            <Icon size={24} />
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${theme.badge}`}>
            Vue synthétique
          </span>

          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
            Ouvrir
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function SmallStatusBadge({ children, tone = 'default' }) {
  const tones = {
    default:
      'bg-muted text-muted-foreground border-border',
    primary:
      'bg-primary/10 text-primary border-primary/15',
    orange:
      'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/20',
    emerald:
      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/20',
    rose:
      'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/20',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tones[tone] || tones.default}`}
    >
      {children}
    </span>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="h-16 animate-pulse rounded-2xl border bg-muted/60"
        />
      ))}
    </div>
  );
}

function SectionCard({ title, subtitle, actionLabel, onAction, children }) {
  return (
    <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight">
              {title}
            </CardTitle>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>

          {actionLabel ? (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 rounded-xl border bg-background/80 px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              {actionLabel}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
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
      {/* Hero header */}
      <section className="relative overflow-hidden rounded-[32px] border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.12),transparent_30%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--surface-1)))] p-6 shadow-sm md:p-8">
        <div className="absolute right-4 top-4 hidden rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur md:flex dark:border-white/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Activity className="h-3.5 w-3.5" />
              Vue opérationnelle globale
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Dashboard
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              Suivez l’activité commerciale, les paiements, les visites et le support
              depuis votre interface de pilotage.
            </p>
          </div>

          <div className="inline-flex w-fit flex-wrap gap-2 rounded-2xl border bg-background/70 p-1.5 shadow-sm backdrop-blur">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={[
                  'rounded-xl px-4 py-2.5 text-xs font-semibold transition-all',
                  period === p.value
                    ? 'bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-deep)))] text-white shadow-[0_12px_24px_hsl(var(--primary)/0.22)]'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                ].join(' ')}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Error */}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : null}

      {/* KPI cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <KpiCard
          label="Nouveaux leads"
          value={kpis?.new_leads}
          icon={Users}
          tone="primary"
          path="/leads"
          loading={loading}
          subtitle="Leads ajoutés sur la période"
        />
        <KpiCard
          label="Leads en attente"
          value={kpis?.pending_leads}
          icon={TrendingUp}
          tone="orange"
          path="/leads"
          loading={loading}
          subtitle="À relancer ou qualifier"
        />
        <KpiCard
          label="Visites planifiées"
          value={kpis?.visits_planned}
          icon={CalendarDays}
          tone="violet"
          path="/visites"
          loading={loading}
          subtitle="Visites programmées"
        />
        <KpiCard
          label="Paiements en attente"
          value={kpis?.payments_pending}
          icon={CreditCard}
          tone="orange"
          path="/paiements"
          loading={loading}
          subtitle="Paiements à confirmer"
        />
        <KpiCard
          label="Tickets ouverts"
          value={kpis?.tickets_open}
          icon={HeadphonesIcon}
          tone="rose"
          path="/support"
          loading={loading}
          subtitle="Demandes support en cours"
        />
        <KpiCard
          label="Clients actifs"
          value={kpis?.active_clients}
          icon={User}
          tone="emerald"
          path="/clients"
          loading={loading}
          subtitle="Clients actifs sur la plateforme"
        />
      </section>

      {/* Detail cards */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <SectionCard
          title="Leads récents"
          subtitle="Derniers contacts créés dans le système"
          actionLabel="Voir les leads"
          onAction={() => navigate('/leads')}
        >
          {loading ? (
            <ListSkeleton />
          ) : !kpis?.recent_leads?.length ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-dashed bg-muted/20 px-6 text-center">
              <p className="text-sm font-medium">Aucun lead récent</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Les nouveaux leads apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {kpis.recent_leads.map((l) => (
                <div
                  key={l.id}
                  className="group flex items-center justify-between gap-4 rounded-2xl border bg-background/70 px-4 py-4 transition-all duration-200 hover:border-primary/15 hover:bg-primary/[0.03]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {l.first_name} {l.last_name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        Source : {l.source || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <SmallStatusBadge tone="primary">{l.status}</SmallStatusBadge>
                    <button
                      onClick={() => navigate('/leads')}
                      className="hidden rounded-xl border px-2.5 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground md:inline-flex"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Visites à venir"
          subtitle="Planning des prochaines visites terrain"
          actionLabel="Voir les visites"
          onAction={() => navigate('/visites')}
        >
          {loading ? (
            <ListSkeleton />
          ) : !kpis?.upcoming_visits?.length ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[24px] border border-dashed bg-muted/20 px-6 text-center">
              <p className="text-sm font-medium">Aucune visite à venir</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Les visites planifiées apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {kpis.upcoming_visits.map((v) => (
                <div
                  key={v.id}
                  className="group flex items-center justify-between gap-4 rounded-2xl border bg-background/70 px-4 py-4 transition-all duration-200 hover:border-orange-300/25 hover:bg-orange-500/[0.03]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {v.terrain_title}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {v.visit_date} à {v.visit_time}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <SmallStatusBadge tone="orange">
                      {v.agent_name || '—'}
                    </SmallStatusBadge>
                    <button
                      onClick={() => navigate('/visites')}
                      className="hidden rounded-xl border px-2.5 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground md:inline-flex"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </section>
    </div>
  );
}