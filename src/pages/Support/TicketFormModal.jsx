import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2 } from 'lucide-react';
import { ticketsApi, clientsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  clientId: z.string().optional(),
  subject: z.string().min(1, 'Sujet requis'),
  description: z.string().min(1, 'Description requise'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
});

export default function TicketFormModal({ onClose, onSuccess }) {
  const [serverError, setServerError] = useState(null);
  const [clients, setClients] = useState([]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: '',
      subject: '',
      description: '',
      priority: 'medium',
    },
  });

  useEffect(() => {
    clientsApi.list({ page: 1, limit: 100 }).then((r) => setClients(r?.data || [])).catch(() => {});
  }, []);

  const onSubmit = async (values) => {
    setServerError(null);
    try {
      await ticketsApi.create({
        clientId: values.clientId || null,
        subject: values.subject,
        description: values.description,
        priority: values.priority,
      });

      onSuccess();
    } catch (err) {
      setServerError(err?.response?.data?.message || 'Erreur');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-card">
          <h2 className="font-display font-semibold">Nouveau ticket</h2>
          <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {serverError && <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{serverError}</p>}

          <div className="space-y-1.5">
            <Label>Client</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('clientId')}>
              <option value="">— Sélectionner —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Sujet *</Label>
            <Input placeholder="Problème de paiement..." {...register('subject')} />
            {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Description *</Label>
            <textarea
              className="min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Priorité</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm" {...register('priority')}>
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Créer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}