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
} from 'recharts';

const PERIODS = [
  { label: '7 jours', value: '7d' },
  { label: '30 jours', value: '30d' },
  { label: '3 mois', value: '3m' },
  { label: '12 mois', value: '12m' },
];

const COLORS = ['#dc7a20', '#e3943d', '#ecb870', '#f4d5a8', '#6b7280', '#374151'];

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

  const Skeleton = () => <div className="h-48 bg-muted animate-pulse rounded-lg" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Reporting</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Analyse globale de l'activité</p>
        </div>

        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                period === p.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads par source</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton />
            ) : !data?.leads_by_source?.length ? (
              <p className="text-sm text-muted-foreground">Pas de données</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.leads_by_source}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.leads_by_source.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads par statut</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton />
            ) : !data?.leads_by_status?.length ? (
              <p className="text-sm text-muted-foreground">Pas de données</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.leads_by_status} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="status" type="category" tick={{ fontSize: 11 }} width={90} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#dc7a20" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance agents</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton />
            ) : !data?.agents_performance?.length ? (
              <p className="text-sm text-muted-foreground">Pas de données</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.agents_performance}>
                  <XAxis dataKey="agent_name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="leads_count" fill="#dc7a20" name="Leads" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="visits_count" fill="#ecb870" name="Visites" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paiements par statut</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton />
            ) : !data?.payments_by_status?.length ? (
              <p className="text-sm text-muted-foreground">Pas de données</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.payments_by_status}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                  >
                    {data.payments_by_status.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}