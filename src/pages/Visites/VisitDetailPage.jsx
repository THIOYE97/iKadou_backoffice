import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Edit, X, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import api from '@/Api/axiosInstance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/ui/StatusBadge';
import PageHeader from '@/components/custome/PageHeader';
import InfoGrid from '@/components/custome/InfoGrid';
import HistoryTimeline from '@/components/custome/HistoryTimeline';
import { VISIT_STATUS } from '@/Util/statusConfig';
import { readableDate, readableTimestamp } from '@/Util/readableDate';
import VisiteFormModal from './VisitFormModal';

export default function VisiteDetailPage() {
  const { id } = useParams();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReschedule, setShowReschedule] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const load = async () => {
    try { const r = await api.get(`/visits/${id}`); setVisit(r.data.data); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const changeStatus = async (status, reason) => {
    try {
      await api.patch(`/visits/${id}/status`, { status, reason });
      load();
    } catch {}
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={28} className="animate-spin text-primary" /></div>;
  if (!visit) return <div className="text-center py-16 text-muted-foreground">Visite introuvable.</div>;

  const canConfirm  = visit.status === 'scheduled';
  const canDone     = visit.status === 'confirmed';
  const canCancel   = !['cancelled', 'done'].includes(visit.status);

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader
        title={`Visite — ${visit.terrain_title || '—'}`}
        subtitle={`${readableDate(visit.visit_date)} à ${visit.visit_time?.substring(0,5)}`}
        backTo="/visites"
      >
        <StatusBadge map={VISIT_STATUS} value={visit.status} />
        {canConfirm && (
          <Button size="sm" onClick={() => changeStatus('confirmed')} disabled={confirming}>
            <CheckCircle size={14} /> Confirmer
          </Button>
        )}
        {canDone && (
          <Button size="sm" variant="outline" onClick={() => changeStatus('done')}>
            <CheckCircle size={14} /> Marquer réalisée
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => setShowReschedule(true)}>
          <RefreshCw size={14} /> Replanifier
        </Button>
        {canCancel && (
          <Button size="sm" variant="outline" onClick={() => { setCancelling(true); changeStatus('cancelled').finally(() => setCancelling(false)); }}
            disabled={cancelling} className="border-destructive text-destructive hover:bg-destructive/10">
            <XCircle size={14} /> Annuler
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-base">Détails</CardTitle></CardHeader>
          <CardContent>
            <InfoGrid items={[
              { label: 'Client',       value: visit.client_name || visit.lead_name || '—' },
              { label: 'Terrain',      value: visit.terrain_title },
              { label: 'Réf terrain',  value: visit.terrain_ref },
              { label: 'Date',         value: readableDate(visit.visit_date) },
              { label: 'Heure',        value: visit.visit_time?.substring(0,5) },
              { label: 'Agent',        value: visit.agent_name || '—' },
              { label: 'Notes',        value: visit.notes, full: true },
              visit.cancel_reason && { label: "Motif d'annulation", value: visit.cancel_reason, full: true },
            ].filter(Boolean)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Activité</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><p className="text-muted-foreground text-xs">Créée le</p><p>{readableDate(visit.created_at)}</p></div>
            <div><p className="text-muted-foreground text-xs">Dernière MAJ</p><p>{readableTimestamp(visit.updated_at)}</p></div>
            <div><p className="text-muted-foreground text-xs">Historique</p><p className="font-semibold">{visit.history?.length || 0} entrée(s)</p></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Historique</CardTitle></CardHeader>
        <CardContent>
          <HistoryTimeline entries={visit.history || []} />
        </CardContent>
      </Card>

      {showReschedule && (
        <VisiteFormModal visit={visit} onClose={() => setShowReschedule(false)} onSuccess={() => { setShowReschedule(false); load(); }} />
      )}
    </div>
  );
}