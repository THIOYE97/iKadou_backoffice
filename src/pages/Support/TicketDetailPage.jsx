import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Send, Save } from 'lucide-react';
import { ticketsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/ui/StatusBadge';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TICKET_STATUS, TICKET_PRIORITY } from '@/Util/statusConfig';
import { readableDate, readableTimestamp } from '@/Util/readableDate';

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
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return <div className="text-center py-16 text-muted-foreground">Ticket introuvable.</div>;
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/support')}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold">{ticket.subject}</h1>
          <p className="text-sm text-muted-foreground">
            {ticket.ref} · ouvert le {readableDate(ticket.created_at)}
          </p>
        </div>
        <StatusBadge map={TICKET_PRIORITY} value={ticket.priority} />
        <StatusBadge map={TICKET_STATUS} value={ticket.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!ticket.messages?.length ? (
              <p className="text-sm text-muted-foreground">Aucun message</p>
            ) : (
              <div className="space-y-3">
                {ticket.messages.map((m) => (
                  <div key={m.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{m.author || 'Utilisateur'}</p>
                        {m.is_internal && <Badge variant="outline">Interne</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{readableTimestamp(m.created_at)}</p>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 pt-2 border-t">
              <textarea
                className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                <Button onClick={handleSendMessage} disabled={sending || !message.trim()}>
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Envoyer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info label="Client" value={ticket.client_name} />
              <Info label="Email" value={ticket.client_email} />
              <Info label="Téléphone" value={ticket.client_phone} />
              <Info label="Assigné à" value={ticket.assigned_name} />
              <Info label="Créé le" value={readableTimestamp(ticket.created_at)} />
              <Info label="Mis à jour" value={readableTimestamp(ticket.updated_at)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Changer le statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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
                placeholder="Commentaire"
                value={statusComment}
                onChange={(e) => setStatusComment(e.target.value)}
              />

              <Button className="w-full" onClick={handleStatusChange} disabled={savingStatus}>
                {savingStatus ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Mettre à jour
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assigner à un agent support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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
                className="w-full"
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique</CardTitle>
        </CardHeader>
        <CardContent>
          {!ticket.history?.length ? (
            <p className="text-sm text-muted-foreground">Aucun historique</p>
          ) : (
            <div className="space-y-2">
              {ticket.history.map((h) => (
                <div key={h.id} className="rounded-md border px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{h.action}</p>
                    <p className="text-xs text-muted-foreground">{readableTimestamp(h.created_at)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
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

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || '—'}</p>
    </div>
  );
}