import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, ShieldCheck, ShieldX, Bell, Edit } from 'lucide-react';
import { clientsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import StatusBadge from '@/components/ui/StatusBadge';
import PageHeader from '@/components/custome/PageHeader';
import InfoGrid from '@/components/custome/InfoGrid';
import { CLIENT_STATUS, LEAD_STATUS, VISIT_STATUS, PAYMENT_STATUS, TICKET_STATUS } from '@/Util/statusConfig';
import { readableDate, readableTimestamp } from '@/Util/readableDate';
import ClientPreferencesModal from '@/pages/Notifications/ClientPreferencesModal';

const fmt = (v, c) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c || 'XOF', maximumFractionDigits: 0 }).format(v);

function SectionCard({ title, count, children, viewAllPath }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {title}
            <span className="text-muted-foreground font-normal text-sm ml-2">({count || 0})</span>
          </CardTitle>
          {viewAllPath && count > 0 && (
            <Link to={viewAllPath} className="text-xs text-primary hover:underline">Voir tout →</Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!count
          ? <p className="text-sm text-muted-foreground">Aucun(e)</p>
          : <div className="space-y-2">{children}</div>
        }
      </CardContent>
    </Card>
  );
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [suspending, setSuspending] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const load = async () => {
    try {
      const r = await clientsApi.get(id);
      setClient(r.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleStatusChange = async (status) => {
    setSuspending(true);
    try { await clientsApi.updateStatus(id, { status }); load(); }
    finally { setSuspending(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-primary" /></div>;
  if (!client) return <div className="text-center py-16 text-muted-foreground">Client introuvable.</div>;

  const TABS = [
    { key: 'info',     label: 'Profil' },
    { key: 'leads',    label: `Leads (${client.leads?.length || 0})` },
    { key: 'visits',   label: `Visites (${client.visits?.length || 0})` },
    { key: 'payments', label: `Paiements (${client.payments?.length || 0})` },
    { key: 'tickets',  label: `Tickets (${client.tickets?.length || 0})` },
    { key: 'docs',     label: `Documents (${client.documents?.length || 0})` },
  ];

  return (
    <div className="space-y-5 max-w-5xl">
      <PageHeader title={`${client.first_name} ${client.last_name}`} subtitle={`Client depuis le ${readableDate(client.created_at)}`} backTo="/clients">
        <StatusBadge map={CLIENT_STATUS} value={client.status} />
        <Button variant="outline" size="sm" onClick={() => setShowPrefs(true)}>
          <Bell size={14} /> Préférences
        </Button>
        {client.status === 'active'
          ? <Button variant="outline" size="sm" onClick={() => handleStatusChange('suspended')} disabled={suspending} className="border-destructive text-destructive hover:bg-destructive/10">
              <ShieldX size={14} /> Suspendre
            </Button>
          : <Button variant="outline" size="sm" onClick={() => handleStatusChange('active')} disabled={suspending}>
              <ShieldCheck size={14} /> Réactiver
            </Button>
        }
      </PageHeader>

      {/* Profile card + tabs */}
      <div className="flex gap-5">
        {/* Avatar sidebar */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-display font-bold text-2xl">
              {client.first_name?.[0]}{client.last_name?.[0]}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Tabs */}
          <div className="flex border-b gap-1 mb-5 overflow-x-auto scrollbar-thin">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab: Profil */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card>
                <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
                <CardContent>
                  <InfoGrid items={[
                    { label: 'Email',    value: client.email },
                    { label: 'Téléphone', value: client.phone },
                    { label: 'Pays',     value: client.country },
                    { label: 'Ville',    value: client.city },
                    { label: 'KYC',      value: client.kyc_verified ? <Badge variant="success">Vérifié ✓</Badge> : <Badge variant="outline">Non vérifié</Badge> },
                    { label: 'Statut',   value: <StatusBadge map={CLIENT_STATUS} value={client.status} /> },
                    { label: 'Inscrit le', value: readableDate(client.created_at) },
                    { label: 'Dernière MAJ', value: readableTimestamp(client.updated_at) },
                  ]} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Activité globale</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Leads',     value: client.leads?.length || 0,    color: 'text-blue-600' },
                      { label: 'Visites',   value: client.visits?.length || 0,   color: 'text-violet-600' },
                      { label: 'Paiements', value: client.payments?.length || 0, color: 'text-primary' },
                      { label: 'Tickets',   value: client.tickets?.length || 0,  color: 'text-rose-600' },
                    ].map(s => (
                      <div key={s.label} className="bg-muted/50 rounded-xl p-3 text-center">
                        <p className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tab: Leads */}
          {activeTab === 'leads' && (
            <SectionCard title="Leads" count={client.leads?.length} viewAllPath={`/leads?client_id=${id}`}>
              {client.leads?.map(l => (
                <div key={l.id} className="flex items-center gap-3 py-2 border-b last:border-0 cursor-pointer hover:bg-muted/20 rounded px-1"
                  onClick={() => navigate(`/leads/${l.id}`)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{l.first_name} {l.last_name}</p>
                    <p className="text-xs text-muted-foreground">{l.source} · {readableDate(l.created_at)}</p>
                  </div>
                  <StatusBadge map={LEAD_STATUS} value={l.status} />
                </div>
              ))}
            </SectionCard>
          )}

          {/* Tab: Visites */}
          {activeTab === 'visits' && (
            <SectionCard title="Visites" count={client.visits?.length}>
              {client.visits?.map(v => (
                <div key={v.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{v.terrain_title}</p>
                    <p className="text-xs text-muted-foreground">{readableDate(v.visit_date)} à {v.visit_time?.substring(0,5)}</p>
                  </div>
                  <StatusBadge map={VISIT_STATUS} value={v.status} />
                </div>
              ))}
            </SectionCard>
          )}

          {/* Tab: Paiements */}
          {activeTab === 'payments' && (
            <SectionCard title="Paiements" count={client.payments?.length}>
              {client.payments?.map(p => (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b last:border-0 cursor-pointer hover:bg-muted/20 rounded px-1"
                  onClick={() => navigate(`/paiements/${p.id}`)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono font-semibold text-primary">{p.ref}</p>
                    <p className="text-xs text-muted-foreground">{readableDate(p.created_at)}</p>
                  </div>
                  <span className="font-semibold text-sm">{fmt(p.amount, p.currency)}</span>
                  <StatusBadge map={PAYMENT_STATUS} value={p.status} />
                </div>
              ))}
            </SectionCard>
          )}

          {/* Tab: Tickets */}
          {activeTab === 'tickets' && (
            <SectionCard title="Tickets support" count={client.tickets?.length}>
              {client.tickets?.map(t => (
                <div key={t.id} className="flex items-center gap-3 py-2 border-b last:border-0 cursor-pointer hover:bg-muted/20 rounded px-1"
                  onClick={() => navigate(`/support/${t.id}`)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{t.subject}</p>
                    <p className="text-xs font-mono text-muted-foreground">{t.ref} · {readableDate(t.created_at)}</p>
                  </div>
                  <StatusBadge map={TICKET_STATUS} value={t.status} />
                </div>
              ))}
            </SectionCard>
          )}

          {/* Tab: Documents */}
          {activeTab === 'docs' && (
            <SectionCard title="Documents" count={client.documents?.length}>
              {client.documents?.map(d => (
                <div key={d.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{readableDate(d.created_at)}</p>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">{d.type?.replace('_', ' ')}</Badge>
                  <a href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${d.url}`}
                    target="_blank" rel="noreferrer"
                    className="text-xs text-primary hover:underline" onClick={e => e.stopPropagation()}>
                    Ouvrir
                  </a>
                </div>
              ))}
            </SectionCard>
          )}
        </div>
      </div>

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