import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2 } from 'lucide-react';
import api from '@/Api/axiosInstance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  terrainId: z.string().uuid('Terrain requis'),
  visitDate: z.string().min(1, 'Date requise'),
  visitTime: z.string().min(1, 'Heure requise'),
  agentId:   z.string().optional(),
  clientId:  z.string().optional(),
  leadId:    z.string().optional(),
  notes:     z.string().optional(),
});

export default function VisiteFormModal({ onClose, onSuccess, visit }) {
  const isEdit = !!visit;
  const [serverError, setServerError] = useState(null);
  const [terrains, setTerrains]       = useState([]);
  const [agents, setAgents]           = useState([]);
  const [clients, setClients]         = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/terrains', { params: { status: 'published', limit: 100 } }),
      api.get('/agents', { params: { status: 'active', limit: 100 } }),
      api.get('/clients', { params: { status: 'active', limit: 100 } }),
    ]).then(([t, a, c]) => {
      setTerrains(t.data.data || []);
      setAgents(a.data.data || []);
      setClients(c.data.data || []);
    }).catch(() => {});
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: visit ? {
      terrainId: visit.terrain_id,
      visitDate: visit.visit_date,
      visitTime: visit.visit_time?.substring(0, 5),
      agentId:   visit.agent_id || '',
      clientId:  visit.client_id || '',
    } : {},
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
          agentId:  values.agentId  || undefined,
          clientId: values.clientId || undefined,
          leadId:   values.leadId   || undefined,
        });
      }
      onSuccess();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Erreur');
    }
  };

  const selClass = 'flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-ring';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-display font-semibold">{isEdit ? 'Replanifier la visite' : 'Planifier une visite'}</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {serverError && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{serverError}</p>}

          {!isEdit && (
            <div className="space-y-1.5">
              <Label>Terrain *</Label>
              <select className={selClass} {...register('terrainId')}>
                <option value="">— Sélectionner —</option>
                {terrains.map(t => <option key={t.id} value={t.id}>{t.ref} — {t.title}</option>)}
              </select>
              {errors.terrainId && <p className="text-xs text-destructive">{errors.terrainId.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" {...register('visitDate')} />
              {errors.visitDate && <p className="text-xs text-destructive">{errors.visitDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Heure *</Label>
              <Input type="time" {...register('visitTime')} />
              {errors.visitTime && <p className="text-xs text-destructive">{errors.visitTime.message}</p>}
            </div>
          </div>

          {!isEdit && (
            <>
              <div className="space-y-1.5">
                <Label>Client (optionnel)</Label>
                <select className={selClass} {...register('clientId')}>
                  <option value="">— Aucun —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Agent (optionnel)</Label>
                <select className={selClass} {...register('agentId')}>
                  <option value="">— Aucun —</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label>{isEdit ? 'Motif de replanification' : 'Notes'}</Label>
            <textarea className="w-full min-h-[72px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:ring-1 focus:ring-ring"
              placeholder={isEdit ? 'Motif optionnel…' : 'Notes internes…'}
              {...register('notes')} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Replanifier' : 'Planifier'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}