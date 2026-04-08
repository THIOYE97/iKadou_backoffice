import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Edit,
  MessageSquare,
  Tag,
  Sparkles,
  Clock3,
  User2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  FileText,
  ArrowUpRight,
} from 'lucide-react';
import { leadsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/ui/StatusBadge';
import { LEAD_STATUS } from '@/Util/statusConfig';
import { readableDate, readableTimestamp } from '@/Util/readableDate';
import LeadFormModal from './leadFormModal';
import LeadStatusModal from './leadStatusModal';

function InfoItem({ icon: Icon, label, value }) {
  if (!value) return null;

  return (
    <div className="rounded-2xl border bg-background/60 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 break-words text-sm font-semibold text-foreground">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="rounded-2xl border bg-background/60 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const load = async () => {
    try {
      const res = await leadsApi.get(id);
      setLead(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await leadsApi.addNote(id, noteText);
      setNoteText('');
      load();
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] py-16 text-center text-muted-foreground shadow-sm">
        Lead introuvable.
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      {/* Hero */}
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
              onClick={() => navigate('/leads')}
            >
              <ArrowLeft size={18} />
            </Button>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <User2 className="h-3.5 w-3.5" />
                Fiche prospect
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                {lead.first_name} {lead.last_name}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Lead créé le {readableDate(lead.created_at)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge map={LEAD_STATUS} value={lead.status} />
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setShowStatus(true)}
            >
              <Tag size={14} />
              Statut
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setShowEdit(true)}
            >
              <Edit size={14} />
              Modifier
            </Button>
          </div>
        </div>
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Main info */}
        <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm xl:col-span-2">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Informations de contact
            </CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
            <InfoItem icon={Phone} label="Téléphone" value={lead.phone} />
            <InfoItem icon={Mail} label="Email" value={lead.email} />
            <InfoItem icon={MapPin} label="Pays" value={lead.country} />
            <InfoItem icon={Briefcase} label="Source" value={lead.source} />
            <InfoItem icon={User2} label="Agent" value={lead.agent_name} />
            <InfoItem icon={FileText} label="Terrain" value={lead.terrain_title} />
            <InfoItem icon={User2} label="Client lié" value={lead.client_name} />
            <InfoItem icon={Tag} label="Motif perte" value={lead.lost_reason} />
          </CardContent>
        </Card>

        {/* Activity */}
        <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Activité
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-5">
            <StatItem
              label="Dernière mise à jour"
              value={readableTimestamp(lead.updated_at)}
            />
            <StatItem
              label="Interactions"
              value={lead.history?.length || 0}
            />
            <StatItem
              label="Notes"
              value={lead.notes?.length || 0}
            />
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <MessageSquare size={18} />
            Notes internes
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5 p-5">
          <div className="flex flex-col gap-3 md:flex-row">
            <textarea
              className="min-h-[100px] flex-1 rounded-2xl border border-input bg-background px-4 py-3 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Ajouter une note interne…"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />

            <Button
              onClick={handleAddNote}
              disabled={savingNote || !noteText.trim()}
              className="h-11 rounded-2xl px-5 md:self-end"
            >
              {savingNote ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                'Ajouter'
              )}
            </Button>
          </div>

          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {!lead.notes?.length ? (
              <div className="rounded-[24px] border border-dashed bg-muted/20 px-6 py-10 text-center">
                <p className="text-sm font-medium">Aucune note</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Les notes internes apparaîtront ici.
                </p>
              </div>
            ) : (
              lead.notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border bg-background/65 px-4 py-4"
                >
                  <p className="text-sm leading-6">{note.content}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {note.author} · {readableTimestamp(note.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Historique
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5">
          {!lead.history?.length ? (
            <div className="rounded-[24px] border border-dashed bg-muted/20 px-6 py-10 text-center">
              <p className="text-sm font-medium">Aucun historique</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Les changements de statut et actions apparaîtront ici.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {lead.history.map((h) => (
                <div key={h.id} className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Clock3 className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1 rounded-2xl border bg-background/60 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{h.action}</span>
                      {h.old_value && h.new_value ? (
                        <span className="text-muted-foreground">
                          · {h.old_value} → {h.new_value}
                        </span>
                      ) : null}
                    </div>

                    {h.comment ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        “{h.comment}”
                      </p>
                    ) : null}

                    <p className="mt-2 text-xs text-muted-foreground">
                      {h.author || 'Système'} · {readableTimestamp(h.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showEdit && (
        <LeadFormModal
          lead={lead}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setShowEdit(false);
            load();
          }}
        />
      )}

      {showStatus && (
        <LeadStatusModal
          lead={lead}
          onClose={() => setShowStatus(false)}
          onSuccess={() => {
            setShowStatus(false);
            load();
          }}
        />
      )}
    </div>
  );
}