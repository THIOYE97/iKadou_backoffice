import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Send,
  Save,
  Sparkles,
  MessageSquare,
  Paperclip,
  ImagePlus,
  X,
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

function normalizeTicketDetailResponse(res) {
  const candidates = [
    res,
    res?.data,
    res?.data?.data,
    res?.raw,
    res?.raw?.data,
    res?.raw?.data?.data,
  ].filter(Boolean);

  const payload =
    candidates.find(
      (item) =>
        item &&
        typeof item === 'object' &&
        (
          Array.isArray(item.messages) ||
          Array.isArray(item.history) ||
          Array.isArray(item.attachments) ||
          item.subject ||
          item.ref ||
          item.id
        )
    ) || null;

  if (!payload || typeof payload !== 'object') return null;

  return {
    ...payload,
    messages: Array.isArray(payload.messages) ? payload.messages : [],
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
    history: Array.isArray(payload.history) ? payload.history : [],
  };
}

function buildAttachmentsMap(attachments) {
  const safeAttachments = Array.isArray(attachments) ? attachments : [];

  return safeAttachments.reduce((acc, item) => {
    const key = item?.message_id;
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
}

function getMessageText(message) {
  return (
    message?.content ??
    message?.message ??
    message?.text ??
    ''
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
  const [files, setFiles] = useState([]);

  const loadTicket = useCallback(async () => {
    try {
      const res = await ticketsApi.get(id);
      const data = normalizeTicketDetailResponse(res);

      console.log('BACKOFFICE TICKET DETAIL RAW =', res);
      console.log('BACKOFFICE TICKET DETAIL NORMALIZED =', data);

      setTicket(data);
      setStatus(data?.status || '');
      setAssignedTo(data?.assigned_to || '');
    } catch (error) {
      console.log('BACKOFFICE LOAD TICKET ERROR =', error);
      setTicket(null);
    }
  }, [id]);

  const loadAssignableUsers = useCallback(async () => {
    try {
      const res = await ticketsApi.listAssignableSupportUsers();
      const users = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setSupportUsers(users);
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

  const attachmentsByMessageId = useMemo(
    () => buildAttachmentsMap(ticket?.attachments),
    [ticket?.attachments]
  );

  const handlePickFiles = (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const mapped = selected.map((file) => ({
      file,
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      preview: file.type?.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));

    setFiles((prev) => [...prev, ...mapped].slice(0, 5));
    e.target.value = '';
  };

  const removeFile = (fileId) => {
    setFiles((prev) => {
      const target = prev.find((item) => item.id === fileId);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((item) => item.id !== fileId);
    });
  };

  const resetComposer = () => {
    files.forEach((item) => {
      if (item.preview) URL.revokeObjectURL(item.preview);
    });
    setFiles([]);
    setMessage('');
    setIsInternal(false);
  };

  const handleSendMessage = async () => {
    const trimmed = message.trim();
    const hasMessage = !!trimmed;
    const hasFiles = files.length > 0;

    if (!hasMessage && !hasFiles) return;

    setSending(true);
    try {
      let createdMessage = null;
      const effectiveMessage = hasMessage ? trimmed : hasFiles ? 'Image jointe' : '';

      if (effectiveMessage) {
        const res = await ticketsApi.addMessage(id, {
          content: effectiveMessage,
          isInternal,
        });

        createdMessage =
          res?.data?.data ??
          res?.data ??
          res ??
          null;
      }

      if (hasFiles) {
        await ticketsApi.uploadAttachments(id, {
          files: files.map((item) => item.file),
          messageId: createdMessage?.id || null,
        });
      }

      resetComposer();
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
                {ticket.messages.map((m) => {
                  const linkedAttachments = attachmentsByMessageId[m.id] || [];
                  const messageText = getMessageText(m);

                  return (
                    <div key={m.id} className="rounded-2xl border bg-background/60 p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">
                            {m.author || m.author_name || 'Utilisateur'}
                          </p>
                          {m.is_internal ? <Badge variant="outline">Interne</Badge> : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {readableTimestamp(m.created_at)}
                        </p>
                      </div>

                      {!!messageText ? (
                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {messageText}
                        </p>
                      ) : null}

                      {linkedAttachments.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {linkedAttachments.map((file) => {
                            const isImage =
                              String(file?.file_type || '').includes('image') ||
                              /\.(jpg|jpeg|png|webp|heic)$/i.test(file?.file_url || '');

                            if (isImage) {
                              return (
                                <a
                                  key={file.id}
                                  href={file.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block overflow-hidden rounded-2xl border bg-muted/20"
                                >
                                  <img
                                    src={file.file_url}
                                    alt="Pièce jointe"
                                    className="h-40 w-40 object-cover"
                                  />
                                </a>
                              );
                            }

                            return (
                              <a
                                key={file.id}
                                href={file.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm"
                              >
                                <Paperclip className="h-4 w-4" />
                                Pièce jointe
                              </a>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
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

                {files.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {files.map((item) => (
                      <div
                        key={item.id}
                        className="relative overflow-hidden rounded-2xl border bg-background"
                      >
                        {item.preview ? (
                          <img
                            src={item.preview}
                            alt={item.file.name}
                            className="h-24 w-24 object-cover"
                          />
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center px-2 text-center text-xs text-muted-foreground">
                            {item.file.name}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => removeFile(item.id)}
                          className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium">
                      <ImagePlus className="h-4 w-4" />
                      Ajouter des images
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handlePickFiles}
                      />
                    </label>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                      />
                      Message interne
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      className="rounded-2xl"
                      onClick={handleSendMessage}
                      disabled={sending || (!message.trim() && files.length === 0)}
                    >
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Envoyer
                    </Button>
                  </div>
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
