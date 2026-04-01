import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
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
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/support')}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-semibold">Nouveau ticket</h1>
          <p className="text-sm text-muted-foreground">Créer une demande support</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations du ticket</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <Field label="Sujet *">
              <Input
                value={form.subject}
                onChange={(e) => updateField('subject', e.target.value)}
                required
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Priorité *">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.priority}
                  onChange={(e) => updateField('priority', e.target.value)}
                >
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </Field>

              <Field label="Client">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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

            <Field label="Description">
              <textarea
                className="min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </Field>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/support')}>
                Annuler
              </Button>
              <Button type="submit" disabled={saving}>
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

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}