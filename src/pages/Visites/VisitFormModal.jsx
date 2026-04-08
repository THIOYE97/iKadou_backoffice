import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Loader2,
  CalendarDays,
  Clock3,
  User2,
  MapPinned,
  FileText,
} from 'lucide-react';
import api from '@/Api/axiosInstance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  terrainId: z.string().uuid('Terrain requis'),
  visitDate: z.string().min(1, 'Date requise'),
  visitTime: z.string().min(1, 'Heure requise'),
  agentId: z.string().optional(),
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  notes: z.string().optional(),
});

export default function VisiteFormModal({ onClose, onSuccess, visit }) {
  const isEdit = !!visit;
  const [serverError, setServerError] = useState(null);
  const [terrains, setTerrains] = useState([]);
  const [agents, setAgents] = useState([]);
  const [clients, setClients] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/terrains', { params: { status: 'published', limit: 100 } }),
      api.get('/agents', { params: { status: 'active', limit: 100 } }),
      api.get('/clients', { params: { status: 'active', limit: 100 } }),
    ])
      .then(([t, a, c]) => {
        setTerrains(t.data.data || []);
        setAgents(a.data.data || []);
        setClients(c.data.data || []);
      })
      .catch(() => {});
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: visit
      ? {
          terrainId: visit.terrain_id,
          visitDate: visit.visit_date,
          visitTime: visit.visit_time?.substring(0, 5),
          agentId: visit.agent_id || '',
          clientId: visit.client_id || '',
        }
      : {},
  });

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      if (isEdit) {
        await api.patch(`/visits/${visit.id}/reschedule`, {
          visitDate: values.visitDate,
          visitTime: values.visitTime,
          reason: values.notes,
        });
      } else {
        await api.post('/visits', {
          ...values,
          agentId: values.agentId || undefined,
          clientId: values.clientId || undefined,
          leadId: values.leadId || undefined,
        });
      }
      onSuccess();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Erreur');
    }
  };

  const selClass =
    'flex h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm focus:ring-1 focus:ring-ring';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-xl rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-[var(--shadow-lg)] animate-fade-in">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              {isEdit ? 'Replanifier la visite' : 'Planifier une visite'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isEdit
                ? 'Mets à jour la date et l’heure de la visite'
                : 'Renseigne les informations de planification'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-5">
          {serverError ? (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </p>
          ) : null}

          {!isEdit ? (
            <div className="space-y-1.5">
              <Label>Terrain *</Label>
              <div className="relative">
                <MapPinned className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select className={`${selClass} pl-10`} {...register('terrainId')}>
                  <option value="">— Sélectionner —</option>
                  {terrains.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.ref} — {t.title}
                    </option>
                  ))}
                </select>
              </div>
              {errors.terrainId ? (
                <p className="text-xs text-destructive">{errors.terrainId.message}</p>
              ) : null}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="date" className="h-11 rounded-2xl pl-10" {...register('visitDate')} />
              </div>
              {errors.visitDate ? (
                <p className="text-xs text-destructive">{errors.visitDate.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>Heure *</Label>
              <div className="relative">
                <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="time" className="h-11 rounded-2xl pl-10" {...register('visitTime')} />
              </div>
              {errors.visitTime ? (
                <p className="text-xs text-destructive">{errors.visitTime.message}</p>
              ) : null}
            </div>
          </div>

          {!isEdit ? (
            <>
              <div className="space-y-1.5">
                <Label>Client (optionnel)</Label>
                <div className="relative">
                  <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select className={`${selClass} pl-10`} {...register('clientId')}>
                    <option value="">— Aucun —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Agent (optionnel)</Label>
                <div className="relative">
                  <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <select className={`${selClass} pl-10`} {...register('agentId')}>
                    <option value="">— Aucun —</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.first_name} {a.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : null}

          <div className="space-y-1.5">
            <Label>{isEdit ? 'Motif de replanification' : 'Notes'}</Label>
            <div className="relative">
              <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <textarea
                className="min-h-[100px] w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={isEdit ? 'Motif optionnel…' : 'Notes internes…'}
                {...register('notes')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" className="rounded-2xl" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="rounded-2xl" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              {isEdit ? 'Replanifier' : 'Planifier'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}