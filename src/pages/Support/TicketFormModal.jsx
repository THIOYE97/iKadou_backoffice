import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, LifeBuoy, User2, FileText, ShieldAlert } from 'lucide-react';
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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-[var(--shadow-lg)] animate-fade-in">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/90 p-5 backdrop-blur">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Nouveau ticket
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Créer une nouvelle demande support
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

          <div className="space-y-1.5">
            <Label>Client</Label>
            <div className="relative">
              <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 pl-10 text-sm"
                {...register('clientId')}
              >
                <option value="">— Sélectionner —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Sujet *</Label>
            <div className="relative">
              <LifeBuoy className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 rounded-2xl pl-10"
                placeholder="Problème de paiement..."
                {...register('subject')}
              />
            </div>
            {errors.subject ? <p className="text-xs text-destructive">{errors.subject.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label>Description *</Label>
            <div className="relative">
              <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <textarea
                className="min-h-[160px] w-full rounded-2xl border border-input bg-background px-4 py-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                {...register('description')}
              />
            </div>
            {errors.description ? (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Priorité</Label>
            <div className="relative">
              <ShieldAlert className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 pl-10 text-sm"
                {...register('priority')}
              >
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" className="rounded-2xl" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="rounded-2xl" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
              Créer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}