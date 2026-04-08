import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Send,
  Save,
  Sparkles,
  MessageSquare,
  User2,
  Clock3,
  ShieldAlert,
  Tag,
} from 'lucide-react';
import { ticketsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/ui/StatusBadge';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TICKET_STATUS, TICKET_PRIORITY } from '@/Util/statusConfig';
import { readableDate, readableTimestamp } from '@/Util/readableDate';

function Info({ label, value }) {
  return (
    <div className="rounded-2xl border bg-background/60 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value || '—'}</p>
    </div>
  );
}

function StatMini({ label, value }) {
  return (
    <div className="rounded-2xl border bg-background/60 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [supportUsers, setSupportUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingAssign, setSavingAssign] = useState(false);

  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [status, setStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const loadTicket = useCallback(async () => {
    try {
      const res = await ticketsApi.get(id);
      const data = res?.data || null;
      setTicket(data);
      setStatus(data?.status || '');
      setAssignedTo(data?.assigned_to || '');
    } catch {
      setTicket(null);
    }
  }, [id]);

  const loadAssignableUsers = useCallback(async () => {
    try {
      const res = await ticketsApi.listAssignableSupportUsers();
      setSupportUsers(res?.data || []);
    } catch {
      setSupportUsers([]);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await Promise.all([loadTicket(), loadAssignableUsers()]);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [loadTicket, loadAssignableUsers]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await ticketsApi.addMessage(id, {
        content: message.trim(),
        isInternal,
      });
      setMessage('');
      setIsInternal(false);
      await loadTicket();
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async () => {
    if (!status) return;
    setSavingStatus(true);
    try {
      await ticketsApi.updateStatus(id, {
        status,
        comment: statusComment || undefined,
      });
      setStatusComment('');
      await loadTicket();
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAssign = async () => {
    if (!assignedTo) return;
    setSavingAssign(true);
    try {
      await ticketsApi.assign(id, assignedTo);
      await loadTicket();
    } finally {
      setSavingAssign(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] py-16 text-center text-muted-foreground shadow-sm">
        Ticket introuvable.
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.12),transparent_30%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--surface-1)))] p-6 shadow-sm md:p-8">
        <div className="absolute right-4 top-4 hidden rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur md:flex dark:border-white/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="mt-1 rounded-2xl"
              onClick={() => navigate('/support')}
            >
              <ArrowLeft size={18} />
            </Button>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <MessageSquare className="h-3.5 w-3.5" />
                Fiche support
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                {ticket.subject}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                {ticket.ref} · ouvert le {readableDate(ticket.created_at)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge map={TICKET_PRIORITY} value={ticket.priority} />
            <StatusBadge map={TICKET_STATUS} value={ticket.status} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm xl:col-span-2">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Conversation
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 p-5">
            {!ticket.messages?.length ? (
              <div className="rounded-[24px] border border-dashed bg-muted/20 px-6 py-10 text-center">
                <p className="text-sm font-medium">Aucun message</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Les échanges apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {ticket.messages.map((m) => (
                  <div key={m.id} className="rounded-2xl border bg-background/60 p-4">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{m.author || 'Utilisateur'}</p>
                        {m.is_internal ? <Badge variant="outline">Interne</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {readableTimestamp(m.created_at)}
                      </p>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6">{m.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-4">
              <div className="space-y-3">
                <textarea
                  className="min-h-[140px] w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Ajouter un message…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                  />
                  Message interne
                </label>
                <div className="flex justify-end">
                  <Button className="rounded-2xl" onClick={handleSendMessage} disabled={sending || !message.trim()}>
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Envoyer
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-lg font-semibold tracking-tight">
                Résumé
              </CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-3 p-5">
              <Info label="Client" value={ticket.client_name} />
              <Info label="Email" value={ticket.client_email} />
              <Info label="Téléphone" value={ticket.client_phone} />
              <Info label="Assigné à" value={ticket.assigned_name} />
              <Info label="Créé le" value={readableTimestamp(ticket.created_at)} />
              <Info label="Mis à jour" value={readableTimestamp(ticket.updated_at)} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-lg font-semibold tracking-tight">
                Changer le statut
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 p-5">
              <select
                className="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="open">Ouvert</option>
                <option value="in_progress">En cours</option>
                <option value="waiting_client">En attente client</option>
                <option value="resolved">Résolu</option>
                <option value="closed">Fermé</option>
              </select>

              <Input
                className="h-11 rounded-2xl"
                placeholder="Commentaire"
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
              />

              <Button className="w-full rounded-2xl" onClick={handleStatusChange} disabled={savingStatus}>
                {savingStatus ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Mettre à jour
              </Button>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="text-lg font-semibold tracking-tight">
                Assigner à un agent support
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 p-5">
              <select
                className="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">Sélectionner un agent support</option>
                {supportUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}{user.email ? ` — ${user.email}` : ''}
                  </option>
                ))}
              </select>

              <Button
                className="w-full rounded-2xl"
                variant="outline"
                onClick={handleAssign}
                disabled={savingAssign || !assignedTo}
              >
                {savingAssign ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Assigner
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Historique
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5">
          {!ticket.history?.length ? (
            <div className="rounded-[24px] border border-dashed bg-muted/20 px-6 py-10 text-center">
              <p className="text-sm font-medium">Aucun historique</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Les changements et événements apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {ticket.history.map((h) => (
                <div key={h.id} className="rounded-2xl border bg-background/60 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold">{h.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {readableTimestamp(h.created_at)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {h.author || 'Utilisateur'} {h.comment ? `· ${h.comment}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}