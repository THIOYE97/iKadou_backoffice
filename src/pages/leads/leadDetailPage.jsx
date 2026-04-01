import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Edit, MessageSquare, UserCheck, Tag } from 'lucide-react';
import { leadsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/ui/StatusBadge';
import { LEAD_STATUS } from '@/Util/statusConfig';
import { readableDate, readableTimestamp } from '@/Util/readableDate';
import LeadFormModal from './leadFormModal';
import LeadStatusModal from './leadStatusModal';

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
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await leadsApi.addNote(id, noteText);
      setNoteText('');
      load();
    } finally { setSavingNote(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  );

  if (!lead) return (
    <div className="text-center text-muted-foreground py-16">Lead introuvable.</div>
  );

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold">
            {lead.first_name} {lead.last_name}
          </h1>
          <p className="text-muted-foreground text-sm">Lead créé le {readableDate(lead.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge map={LEAD_STATUS} value={lead.status} />
          <Button variant="outline" size="sm" onClick={() => setShowStatus(true)}>
            <Tag size={14} /> Statut
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Edit size={14} /> Modifier
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Contact info */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Informations de contact</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Téléphone',   lead.phone],
              ['Email',       lead.email],
              ['Pays',        lead.country],
              ['Source',      lead.source],
              ['Agent',       lead.agent_name],
              ['Terrain',     lead.terrain_title],
              ['Client lié',  lead.client_name],
              ['Motif perte', lead.lost_reason],
            ].map(([label, val]) => val ? (
              <div key={label}>
                <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
                <p className="font-medium">{val}</p>
              </div>
            ) : null)}
          </CardContent>
        </Card>

        {/* Quick stats */}
        <Card>
          <CardHeader><CardTitle className="text-base">Activité</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Dernière mise à jour</p>
              <p>{readableTimestamp(lead.updated_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Interactions</p>
              <p className="font-semibold">{lead.history?.length || 0}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Notes</p>
              <p className="font-semibold">{lead.notes?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare size={16} /> Notes internes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <textarea
              className="flex-1 min-h-[72px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:ring-1 focus:ring-ring"
              placeholder="Ajouter une note interne…"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <Button onClick={handleAddNote} disabled={savingNote || !noteText.trim()} className="self-end">
              {savingNote ? <Loader2 size={14} className="animate-spin" /> : 'Ajouter'}
            </Button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {!lead.notes?.length && (
              <p className="text-muted-foreground text-sm">Aucune note.</p>
            )}
            {lead.notes?.map((note) => (
              <div key={note.id} className="bg-muted/50 rounded-lg px-4 py-3 text-sm">
                <p>{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {note.author} · {readableTimestamp(note.created_at)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique</CardTitle>
        </CardHeader>
        <CardContent>
          {!lead.history?.length && (
            <p className="text-muted-foreground text-sm">Aucun historique.</p>
          )}
          <div className="space-y-2">
            {lead.history?.map((h) => (
              <div key={h.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-medium">{h.action}</span>
                  {h.old_value && h.new_value && (
                    <span className="text-muted-foreground"> · {h.old_value} → {h.new_value}</span>
                  )}
                  {h.comment && <span className="text-muted-foreground"> · "{h.comment}"</span>}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {h.author || 'Système'} · {readableTimestamp(h.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showEdit && (
        <LeadFormModal lead={lead} onClose={() => setShowEdit(false)} onSuccess={() => { setShowEdit(false); load(); }} />
      )}
      {showStatus && (
        <LeadStatusModal lead={lead} onClose={() => setShowStatus(false)} onSuccess={() => { setShowStatus(false); load(); }} />
      )}
    </div>
  );
}