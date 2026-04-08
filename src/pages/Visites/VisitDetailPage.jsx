import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Sparkles,
  CalendarDays,
  Clock3,
  User2,
  MapPinned,
  FileText,
} from 'lucide-react';
import api from '@/Api/axiosInstance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/ui/StatusBadge';
import { VISIT_STATUS } from '@/Util/statusConfig';
import { readableDate, readableTimestamp } from '@/Util/readableDate';
import VisiteFormModal from './VisitFormModal';
import HistoryTimeline from '@/components/custome/HistoryTimeline';

function InfoCard({ icon: Icon, label, value, full = false }) {
  if (!value) return null;

  return (
    <div className={`rounded-2xl border bg-background/60 p-4 ${full ? 'md:col-span-2' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 break-words text-sm font-semibold">{value}</p>
        </div>
      </div>
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

export default function VisiteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [visit, setVisit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReschedule, setShowReschedule] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    try {
      const r = await api.get(`/visits/${id}`);
      setVisit(r.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const changeStatus = async (status, reason) => {
    try {
      await api.patch(`/visits/${id}/status`, { status, reason });
      load();
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] py-16 text-center text-muted-foreground shadow-sm">
        Visite introuvable.
      </div>
    );
  }

  const canConfirm = visit.status === 'scheduled';
  const canDone = visit.status === 'confirmed';
  const canCancel = !['cancelled', 'done'].includes(visit.status);

  return (
    <div className="max-w-5xl space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.12),transparent_30%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--surface-1)))] p-6 shadow-sm md:p-8">
        <div className="absolute right-4 top-4 hidden rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur md:flex dark:border-white/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <CalendarDays className="h-3.5 w-3.5" />
              Fiche visite
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Visite — {visit.terrain_title || '—'}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {readableDate(visit.visit_date)} à {visit.visit_time?.substring(0, 5)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge map={VISIT_STATUS} value={visit.status} />

            {canConfirm ? (
              <Button size="sm" className="rounded-xl" onClick={() => changeStatus('confirmed')}>
                <CheckCircle size={14} />
                Confirmer
              </Button>
            ) : null}

            {canDone ? (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => changeStatus('done')}
              >
                <CheckCircle size={14} />
                Marquer réalisée
              </Button>
            ) : null}

            <Button
              size="sm"
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowReschedule(true)}
            >
              <RefreshCw size={14} />
              Replanifier
            </Button>

            {canCancel ? (
              <Button
                size="sm"
                variant="outline"
                disabled={cancelling}
                className="rounded-xl border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => {
                  setCancelling(true);
                  changeStatus('cancelled').finally(() => setCancelling(false));
                }}
              >
                <XCircle size={14} />
                Annuler
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm xl:col-span-2">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Détails
            </CardTitle>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
            <InfoCard icon={User2} label="Client / Lead" value={visit.client_name || visit.lead_name || '—'} />
            <InfoCard icon={MapPinned} label="Terrain" value={visit.terrain_title} />
            <InfoCard icon={FileText} label="Réf terrain" value={visit.terrain_ref} />
            <InfoCard icon={CalendarDays} label="Date" value={readableDate(visit.visit_date)} />
            <InfoCard icon={Clock3} label="Heure" value={visit.visit_time?.substring(0, 5)} />
            <InfoCard icon={User2} label="Agent" value={visit.agent_name || '—'} />
            <InfoCard icon={FileText} label="Notes" value={visit.notes} full />
            {visit.cancel_reason ? (
              <InfoCard
                icon={XCircle}
                label="Motif d'annulation"
                value={visit.cancel_reason}
                full
              />
            ) : null}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Activité
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-5">
            <StatMini label="Créée le" value={readableDate(visit.created_at)} />
            <StatMini label="Dernière MAJ" value={readableTimestamp(visit.updated_at)} />
            <StatMini label="Historique" value={`${visit.history?.length || 0} entrée(s)`} />
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Historique
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <HistoryTimeline entries={visit.history || []} />
        </CardContent>
      </Card>

      {showReschedule && (
        <VisiteFormModal
          visit={visit}
          onClose={() => setShowReschedule(false)}
          onSuccess={() => {
            setShowReschedule(false);
            load();
          }}
        />
      )}
    </div>
  );
}