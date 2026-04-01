import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { visitsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/ui/StatusBadge';
import { Input } from '@/components/ui/input';
import { VISIT_STATUS } from '@/Util/statusConfig';
import { readableDate, readableTimestamp } from '@/Util/readableDate';

export default function VisitDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingReschedule, setSavingReschedule] = useState(false);

  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');

  const [reschedule, setReschedule] = useState({
    visitDate: '',
    visitTime: '',
    reason: '',
  });

  const loadVisit = useCallback(async () => {
    try {
      const res = await visitsApi.get(id);
      const data = res?.data || null;
      setVisit(data);
      setStatus(data?.status || '');
      setReschedule({
        visitDate: data?.visit_date || '',
        visitTime: data?.visit_time?.slice(0, 5) || '',
        reason: '',
      });
    } catch {
      setVisit(null);
    }
  }, [id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadVisit();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [loadVisit]);

  const handleStatusChange = async () => {
    setSavingStatus(true);
    try {
      await visitsApi.updateStatus(id, {
        status,
        reason: reason || undefined,
      });
      setReason('');
      await loadVisit();
    } finally {
      setSavingStatus(false);
    }
  };

  const handleReschedule = async () => {
    setSavingReschedule(true);
    try {
      await visitsApi.reschedule(id, reschedule);
      setReschedule((r) => ({ ...r, reason: '' }));
      await loadVisit();
    } finally {
      setSavingReschedule(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!visit) {
    return <div className="text-center py-16 text-muted-foreground">Visite introuvable.</div>;
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/visites')}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold">{visit.terrain_title || 'Visite'}</h1>
          <p className="text-sm text-muted-foreground">
            {readableDate(visit.visit_date)} à {visit.visit_time?.slice(0, 5)}
          </p>
        </div>
        <StatusBadge map={VISIT_STATUS} value={visit.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Info label="Terrain" value={visit.terrain_title} />
            <Info label="Réf. terrain" value={visit.terrain_ref} />
            <Info label="Agent" value={visit.agent_name} />
            <Info label="Client" value={visit.client_name} />
            <Info label="Lead" value={visit.lead_name} />
            <Info label="Créé le" value={readableTimestamp(visit.created_at)} />
            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="font-medium whitespace-pre-wrap">{visit.notes || '—'}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
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
                <option value="scheduled">Planifiée</option>
                <option value="confirmed">Confirmée</option>
                <option value="done">Terminée</option>
                <option value="cancelled">Annulée</option>
                <option value="rescheduled">Replanifiée</option>
                <option value="no_show">Absent</option>
              </select>

              <Input
                placeholder="Motif"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

              <Button className="w-full" onClick={handleStatusChange} disabled={savingStatus}>
                {savingStatus ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Mettre à jour
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Replanifier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="date"
                value={reschedule.visitDate}
                onChange={(e) =>
                  setReschedule((r) => ({ ...r, visitDate: e.target.value }))
                }
              />
              <Input
                type="time"
                value={reschedule.visitTime}
                onChange={(e) =>
                  setReschedule((r) => ({ ...r, visitTime: e.target.value }))
                }
              />
              <Input
                placeholder="Motif"
                value={reschedule.reason}
                onChange={(e) =>
                  setReschedule((r) => ({ ...r, reason: e.target.value }))
                }
              />

              <Button className="w-full" variant="outline" onClick={handleReschedule} disabled={savingReschedule}>
                {savingReschedule ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Replanifier
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
          {!visit.history?.length ? (
            <p className="text-sm text-muted-foreground">Aucun historique</p>
          ) : (
            <div className="space-y-2">
              {visit.history.map((h) => (
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