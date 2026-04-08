import { useState, useEffect } from 'react';
import { reportsApi } from '@/Api/resourceApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts';
import {
  Activity,
  Sparkles,
  ArrowUpRight,
  BarChart3,
  Users,
  CreditCard,
  UserRound,
  BadgeCheck,
} from 'lucide-react';

const PERIODS = [
  { label: '7 jours', value: '7d' },
  { label: '30 jours', value: '30d' },
  { label: '3 mois', value: '3m' },
  { label: '12 mois', value: '12m' },
];

const COLORS = ['#0ea5b7', '#ff8a1f', '#8b5cf6', '#10b981', '#f43f5e', '#64748b'];

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-5 w-28 animate-pulse rounded bg-muted" />
      <div className="h-56 animate-pulse rounded-2xl bg-muted/80" />
    </div>
  );
}

function EmptyChartState({ message = 'Pas de données disponibles' }) {
  return (
    <div className="flex h-56 flex-col items-center justify-center rounded-[24px] border border-dashed bg-muted/20 px-6 text-center">
      <p className="text-sm font-medium">Aucune donnée</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, icon: Icon, children }) {
  return (
    <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>

          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              {title}
            </CardTitle>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function StatMiniCard({ label, value, icon: Icon, tone = 'primary' }) {
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

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border bg-card px-3 py-2 shadow-lg">
      {label ? <p className="mb-1 text-xs font-semibold text-foreground">{label}</p> : null}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-3 text-xs">
            <span className="text-muted-foreground">{entry.name}</span>
            <span className="font-semibold text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportingPage() {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    reportsApi
      .overview({ period })
      .then((res) => setData(res?.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period]);

  const totalLeadSources =
    data?.leads_by_source?.reduce((sum, item) => sum + Number(item.count || 0), 0) || 0;

  const totalLeadStatuses =
    data?.leads_by_status?.reduce((sum, item) => sum + Number(item.count || 0), 0) || 0;

  const totalPayments =
    data?.payments_by_status?.reduce((sum, item) => sum + Number(item.count || 0), 0) || 0;

  const totalAgentSignals =
    data?.agents_performance?.reduce(
      (sum, item) => sum + Number(item.leads_count || 0) + Number(item.visits_count || 0),
      0
    ) || 0;

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
              <BarChart3 className="h-3.5 w-3.5" />
              Analyse globale de l’activité
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Reporting
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
              Visualise les performances commerciales, les leads, les paiements et
              l’activité des agents.
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

      {/* Mini stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatMiniCard
          label="Leads analysés"
          value={loading ? '...' : totalLeadStatuses}
          icon={Users}
          tone="primary"
        />
        <StatMiniCard
          label="Sources de leads"
          value={loading ? '...' : totalLeadSources}
          icon={BadgeCheck}
          tone="orange"
        />
        <StatMiniCard
          label="Signaux agents"
          value={loading ? '...' : totalAgentSignals}
          icon={UserRound}
          tone="violet"
        />
        <StatMiniCard
          label="Paiements suivis"
          value={loading ? '...' : totalPayments}
          icon={CreditCard}
          tone="emerald"
        />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCard
          title="Leads par source"
          subtitle="Répartition des leads par canal d’acquisition"
          icon={Activity}
        >
          {loading ? (
            <ChartSkeleton />
          ) : !data?.leads_by_source?.length ? (
            <EmptyChartState message="Les sources de leads apparaîtront ici." />
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data.leads_by_source}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {data.leads_by_source.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {data.leads_by_source.map((item, i) => (
                  <div
                    key={`${item.source}-${i}`}
                    className="rounded-2xl border bg-background/60 px-3 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <p className="truncate text-xs font-medium text-foreground">
                        {item.source || '—'}
                      </p>
                    </div>
                    <p className="mt-2 text-lg font-bold">{item.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Leads par statut"
          subtitle="Volume des leads selon leur statut"
          icon={Users}
        >
          {loading ? (
            <ChartSkeleton />
          ) : !data?.leads_by_status?.length ? (
            <EmptyChartState message="Les statuts de leads apparaîtront ici." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.leads_by_status}
                layout="vertical"
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="status"
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={100}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#0ea5b7"
                  radius={[0, 10, 10, 0]}
                  name="Leads"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Performance agents"
          subtitle="Comparatif leads et visites par agent"
          icon={UserRound}
        >
          {loading ? (
            <ChartSkeleton />
          ) : !data?.agents_performance?.length ? (
            <EmptyChartState message="Les performances agents apparaîtront ici." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.agents_performance}
                margin={{ top: 8, right: 8, left: -8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.35} />
                <XAxis
                  dataKey="agent_name"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="leads_count"
                  fill="#0ea5b7"
                  name="Leads"
                  radius={[10, 10, 0, 0]}
                />
                <Bar
                  dataKey="visits_count"
                  fill="#ff8a1f"
                  name="Visites"
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Paiements par statut"
          subtitle="Répartition des paiements selon leur état"
          icon={CreditCard}
        >
          {loading ? (
            <ChartSkeleton />
          ) : !data?.payments_by_status?.length ? (
            <EmptyChartState message="Les statuts de paiements apparaîtront ici." />
          ) : (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data.payments_by_status}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {data.payments_by_status.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {data.payments_by_status.map((item, i) => (
                  <div
                    key={`${item.status}-${i}`}
                    className="rounded-2xl border bg-background/60 px-3 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <p className="truncate text-xs font-medium text-foreground">
                        {item.status || '—'}
                      </p>
                    </div>
                    <p className="mt-2 text-lg font-bold">{item.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </section>
    </div>
  );
}