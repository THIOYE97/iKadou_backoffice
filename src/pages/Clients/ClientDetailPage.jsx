import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  ShieldCheck,
  ShieldX,
  Bell,
  Sparkles,
  User2,
  Mail,
  Phone,
  MapPin,
  Clock3,
  FileText,
  CreditCard,
  HeadphonesIcon,
  CalendarDays,
  ArrowUpRight,
} from 'lucide-react';
import { clientsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/ui/StatusBadge';
import { CLIENT_STATUS, LEAD_STATUS, VISIT_STATUS, PAYMENT_STATUS, TICKET_STATUS } from '@/Util/statusConfig';
import { readableDate, readableTimestamp } from '@/Util/readableDate';
import ClientPreferencesModal from '@/pages/Notifications/ClientPreferencesModal';

const fmt = (v, c) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: c || 'XOF',
    maximumFractionDigits: 0,
  }).format(v);

function SectionCard({ title, count, children }) {
  return (
    <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold tracking-tight">
            {title}
          </CardTitle>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {count || 0}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {!count ? (
          <div className="rounded-[24px] border border-dashed bg-muted/20 px-6 py-10 text-center">
            <p className="text-sm font-medium">Aucune donnée</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Les éléments apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="space-y-3">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border bg-background/60 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="mt-1 text-sm font-semibold text-foreground">
            {value || '—'}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatMini({ label, value, tone = 'primary' }) {
  const tones = {
    primary: 'text-primary',
    violet: 'text-violet-600 dark:text-violet-400',
    orange: 'text-orange-600 dark:text-orange-400',
    rose: 'text-rose-600 dark:text-rose-400',
  };

  return (
    <div className="rounded-2xl border bg-background/60 p-4 text-center">
      <p className={`text-2xl font-bold tracking-tight ${tones[tone] || tones.primary}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suspending, setSuspending] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const load = async () => {
    try {
      const r = await clientsApi.get(id);
      setClient(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleStatusChange = async (status) => {
    setSuspending(true);
    try {
      await clientsApi.updateStatus(id, { status });
      load();
    } finally {
      setSuspending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] py-16 text-center text-muted-foreground shadow-sm">
        Client introuvable.
      </div>
    );
  }

  const TABS = [
    { key: 'info', label: 'Profil' },
    { key: 'leads', label: `Leads (${client.leads?.length || 0})` },
    { key: 'visits', label: `Visites (${client.visits?.length || 0})` },
    { key: 'payments', label: `Paiements (${client.payments?.length || 0})` },
    { key: 'tickets', label: `Tickets (${client.tickets?.length || 0})` },
    { key: 'docs', label: `Documents (${client.documents?.length || 0})` },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-[32px] border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.12),transparent_30%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--surface-1)))] p-6 shadow-sm md:p-8">
        <div className="absolute right-4 top-4 hidden rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur md:flex dark:border-white/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary/10">
              <span className="font-display text-2xl font-bold text-primary">
                {client.first_name?.[0]}{client.last_name?.[0]}
              </span>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <User2 className="h-3.5 w-3.5" />
                Fiche client
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                {client.first_name} {client.last_name}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Client depuis le {readableDate(client.created_at)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge map={CLIENT_STATUS} value={client.status} />

            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setShowPrefs(true)}
            >
              <Bell size={14} />
              Préférences
            </Button>

            {client.status === 'active' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('suspended')}
                disabled={suspending}
                className="rounded-xl border-destructive text-destructive hover:bg-destructive/10"
              >
                <ShieldX size={14} />
                Suspendre
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('active')}
                disabled={suspending}
                className="rounded-xl"
              >
                <ShieldCheck size={14} />
                Réactiver
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-2 shadow-sm">
        <div className="flex gap-1 overflow-x-auto scrollbar-thin">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                activeTab === t.key
                  ? 'bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-deep)))] text-white shadow-[0_12px_24px_hsl(var(--primary)/0.18)]'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Profil */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm xl:col-span-2">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-lg font-semibold tracking-tight">
                Informations
              </CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              <InfoCard icon={Mail} label="Email" value={client.email} />
              <InfoCard icon={Phone} label="Téléphone" value={client.phone} />
              <InfoCard icon={MapPin} label="Pays" value={client.country} />
              <InfoCard icon={MapPin} label="Ville" value={client.city} />
              <InfoCard
                icon={ShieldCheck}
                label="KYC"
                value={
                  client.kyc_verified ? (
                    <Badge variant="success">Vérifié ✓</Badge>
                  ) : (
                    <Badge variant="outline">Non vérifié</Badge>
                  )
                }
              />
              <InfoCard
                icon={Clock3}
                label="Dernière mise à jour"
                value={readableTimestamp(client.updated_at)}
              />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-lg font-semibold tracking-tight">
                Activité globale
              </CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-2 gap-3 p-5">
              <StatMini label="Leads" value={client.leads?.length || 0} tone="primary" />
              <StatMini label="Visites" value={client.visits?.length || 0} tone="violet" />
              <StatMini label="Paiements" value={client.payments?.length || 0} tone="orange" />
              <StatMini label="Tickets" value={client.tickets?.length || 0} tone="rose" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leads */}
      {activeTab === 'leads' && (
        <SectionCard title="Leads" count={client.leads?.length}>
          {client.leads?.map((l) => (
            <div
              key={l.id}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border bg-background/60 px-4 py-4 transition hover:bg-muted/30"
              onClick={() => navigate(`/leads/${l.id}`)}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {l.first_name} {l.last_name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {l.source} · {readableDate(l.created_at)}
                </p>
              </div>
              <StatusBadge map={LEAD_STATUS} value={l.status} />
            </div>
          ))}
        </SectionCard>
      )}

      {/* Visites */}
      {activeTab === 'visits' && (
        <SectionCard title="Visites" count={client.visits?.length}>
          {client.visits?.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-3 rounded-2xl border bg-background/60 px-4 py-4"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{v.terrain_title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {readableDate(v.visit_date)} à {v.visit_time?.substring(0, 5)}
                </p>
              </div>
              <StatusBadge map={VISIT_STATUS} value={v.status} />
            </div>
          ))}
        </SectionCard>
      )}

      {/* Paiements */}
      {activeTab === 'payments' && (
        <SectionCard title="Paiements" count={client.payments?.length}>
          {client.payments?.map((p) => (
            <div
              key={p.id}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border bg-background/60 px-4 py-4 transition hover:bg-muted/30"
              onClick={() => navigate(`/paiements/${p.id}`)}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-semibold text-primary">{p.ref}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {readableDate(p.created_at)}
                </p>
              </div>
              <span className="text-sm font-semibold">{fmt(p.amount, p.currency)}</span>
              <StatusBadge map={PAYMENT_STATUS} value={p.status} />
            </div>
          ))}
        </SectionCard>
      )}

      {/* Tickets */}
      {activeTab === 'tickets' && (
        <SectionCard title="Tickets support" count={client.tickets?.length}>
          {client.tickets?.map((t) => (
            <div
              key={t.id}
              className="flex cursor-pointer items-center gap-3 rounded-2xl border bg-background/60 px-4 py-4 transition hover:bg-muted/30"
              onClick={() => navigate(`/support/${t.id}`)}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <HeadphonesIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.subject}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {t.ref} · {readableDate(t.created_at)}
                </p>
              </div>
              <StatusBadge map={TICKET_STATUS} value={t.status} />
            </div>
          ))}
        </SectionCard>
      )}

      {/* Documents */}
      {activeTab === 'docs' && (
        <SectionCard title="Documents" count={client.documents?.length}>
          {client.documents?.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-3 rounded-2xl border bg-background/60 px-4 py-4"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{d.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {readableDate(d.created_at)}
                </p>
              </div>

              <Badge variant="outline" className="capitalize">
                {d.type?.replace('_', ' ')}
              </Badge>

              <a
                href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${d.url}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Ouvrir
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </SectionCard>
      )}

      {showPrefs && (
        <ClientPreferencesModal
          clientId={client.id}
          clientName={`${client.first_name} ${client.last_name}`}
          onClose={() => setShowPrefs(false)}
        />
      )}
    </div>
  );
}