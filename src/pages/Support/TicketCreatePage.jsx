import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Save,
  Sparkles,
  LifeBuoy,
  User2,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { ticketsApi, clientsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function TicketCreatePage() {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    clientId: '',
    assignedTo: '',
  });

  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await clientsApi.list({ limit: 100, page: 1 });
        setClients(res?.data || []);
      } catch {
        setClients([]);
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, []);

  const updateField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await ticketsApi.create({
        subject: form.subject.trim(),
        description: form.description.trim() || undefined,
        priority: form.priority,
        clientId: form.clientId || undefined,
        assignedTo: form.assignedTo || undefined,
      });

      navigate(`/support/${res?.data?.id || ''}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de créer le ticket');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.12),transparent_30%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--surface-1)))] p-6 shadow-sm md:p-8">
        <div className="absolute right-4 top-4 hidden rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur md:flex dark:border-white/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

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
              <LifeBuoy className="h-3.5 w-3.5" />
              Support
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Nouveau ticket
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Créer une demande support et l’associer à un client si nécessaire
            </p>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Informations du ticket
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Field label="Sujet *" icon={LifeBuoy}>
              <Input
                className="h-11 rounded-2xl pl-10"
                value={form.subject}
                onChange={(e) => updateField('subject', e.target.value)}
                required
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Priorité *" icon={ShieldAlert}>
                <select
                  className="h-11 w-full rounded-2xl border border-input bg-background px-4 pl-10 text-sm"
                  value={form.priority}
                  onChange={(e) => updateField('priority', e.target.value)}
                >
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </Field>

              <Field label="Client" icon={User2}>
                <select
                  className="h-11 w-full rounded-2xl border border-input bg-background px-4 pl-10 text-sm"
                  value={form.clientId}
                  onChange={(e) => updateField('clientId', e.target.value)}
                  disabled={loadingClients}
                >
                  <option value="">Aucun client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Description" icon={FileText}>
              <textarea
                className="min-h-[180px] w-full rounded-2xl border border-input bg-background px-4 py-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </Field>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={() => navigate('/support')}
              >
                Annuler
              </Button>
              <Button type="submit" className="rounded-2xl" disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Enregistrer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children, icon: Icon }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="relative">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        ) : null}
        {children}
      </div>
    </div>
  );
}