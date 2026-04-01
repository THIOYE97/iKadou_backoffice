import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  ShieldX,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  CalendarDays,
  Ticket,
} from 'lucide-react';
import { clientsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/ui/StatusBadge';
import { CLIENT_STATUS, LEAD_STATUS, VISIT_STATUS, PAYMENT_STATUS } from '@/Util/statusConfig';
import { readableDate, readableTimestamp } from '@/Util/readableDate';

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  const loadClient = useCallback(async () => {
    setLoading(true);
    try {
      const res = await clientsApi.get(id);
      setClient(res?.data || null);
    } catch {
      setClient(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  const handleStatusChange = async (status) => {
    setStatusLoading(true);
    try {
      await clientsApi.updateStatus(id, { status });
      await loadClient();
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return <div className="text-center py-16 text-muted-foreground">Client introuvable.</div>;
  }

  const fullName = `${client.first_name || ''} ${client.last_name || ''}`.trim();

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
          <ArrowLeft size={18} />
        </Button>

        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold">{fullName}</h1>
          <p className="text-muted-foreground text-sm">
            Client depuis le {readableDate(client.created_at)}
          </p>
        </div>

        <StatusBadge map={CLIENT_STATUS} value={client.status} />

        {client.status === 'active' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange('suspended')}
            disabled={statusLoading}
          >
            <ShieldX size={14} />
            Suspendre
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange('active')}
            disabled={statusLoading}
          >
            <ShieldCheck size={14} />
            Réactiver
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <InfoItem icon={Phone} label="Téléphone" value={client.phone} />
            <InfoItem icon={Mail} label="Email" value={client.email} />
            <InfoItem icon={MapPin} label="Pays" value={client.country} />
            <InfoItem icon={MapPin} label="Ville" value={client.city} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">KYC</CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            {client.kyc_verified ? (
              <Badge variant="success">Identité vérifiée</Badge>
            ) : (
              <Badge variant="outline">Non vérifié</Badge>
            )}

            <p className="text-xs text-muted-foreground">
              Dernière activité {client.updated_at ? readableTimestamp(client.updated_at) : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MiniStat label="Leads" value={client.leads?.length || 0} icon={FileText} />
        <MiniStat label="Visites" value={client.visits?.length || 0} icon={CalendarDays} />
        <MiniStat label="Paiements" value={client.payments?.length || 0} icon={CreditCard} />
        <MiniStat label="Documents" value={client.documents?.length || 0} icon={FileText} />
        <MiniStat label="Tickets" value={client.tickets?.length || 0} icon={Ticket} />
      </div>

      <Section title="Leads" count={client.leads?.length}>
        {client.leads?.map((lead) => (
          <Row key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">
                {lead.first_name} {lead.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">{lead.source || '—'}</p>
            </div>
            <StatusBadge map={LEAD_STATUS} value={lead.status} />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {readableDate(lead.created_at)}
            </span>
          </Row>
        ))}
      </Section>

      <Section title="Visites" count={client.visits?.length}>
        {client.visits?.map((visit) => (
          <Row key={visit.id}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{visit.terrain_title || 'Terrain'}</p>
              <p className="text-xs text-muted-foreground">
                {visit.visit_date} à {visit.visit_time}
              </p>
            </div>
            <StatusBadge map={VISIT_STATUS} value={visit.status} />
          </Row>
        ))}
      </Section>

      <Section title="Paiements" count={client.payments?.length}>
        {client.payments?.map((payment) => (
          <Row key={payment.id}>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs text-primary truncate">{payment.ref || '—'}</p>
              <p className="text-sm">
                {new Intl.NumberFormat('fr-FR').format(Number(payment.amount || 0))} {payment.currency}
              </p>
            </div>
            <StatusBadge map={PAYMENT_STATUS} value={payment.status} />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {readableDate(payment.created_at)}
            </span>
          </Row>
        ))}
      </Section>

      <Section title="Documents" count={client.documents?.length}>
        {client.documents?.map((doc) => (
          <Row key={doc.id}>
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate">{doc.name}</p>
              <p className="text-xs text-muted-foreground truncate">{doc.type}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {readableDate(doc.created_at)}
            </span>
          </Row>
        ))}
      </Section>

      <Section title="Tickets support" count={client.tickets?.length}>
        {client.tickets?.map((ticket) => (
          <Row key={ticket.id}>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{ticket.subject}</p>
              <p className="text-xs text-muted-foreground truncate">
                {ticket.ref} · priorité {ticket.priority}
              </p>
            </div>
            <Badge variant="outline">{ticket.status}</Badge>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {readableDate(ticket.created_at)}
            </span>
          </Row>
        ))}
      </Section>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  if (!value) return null;

  return (
    <div>
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-muted-foreground" />
        <p className="font-medium break-all">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
          <Icon size={16} className="text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, count, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {title}{' '}
          <span className="text-muted-foreground font-normal text-sm">({count || 0})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!count ? (
          <p className="text-sm text-muted-foreground">Aucun élément</p>
        ) : (
          <div className="space-y-2">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ children, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 py-2 border-b last:border-0 ${
        onClick ? 'cursor-pointer hover:bg-muted/30 rounded px-2 transition-colors' : ''
      }`}
    >
      {children}
    </div>
  );
}