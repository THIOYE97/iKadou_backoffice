import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { agentsApi, zonesApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function AgentCreatePage() {
  const navigate = useNavigate();

  const [zones, setZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    zoneId: '',
    status: 'active',
    bio: '',
  });

  useEffect(() => {
    const loadZones = async () => {
      try {
        const res = await zonesApi.list();
        setZones(res?.data || []);
      } catch {
        setZones([]);
      } finally {
        setLoadingZones(false);
      }
    };

    loadZones();
  }, []);

  const updateField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        zoneId: form.zoneId || undefined,
        status: form.status,
        bio: form.bio.trim() || undefined,
      };

      const res = await agentsApi.create(payload);
      navigate(`/agents/${res?.data?.id || ''}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible de créer l'agent");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/agents')}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-semibold">Nouvel agent</h1>
          <p className="text-sm text-muted-foreground">Créer un agent commercial</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations générales</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Prénom *">
                <Input
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  required
                />
              </Field>

              <Field label="Nom *">
                <Input
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  required
                />
              </Field>

              <Field label="Email">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </Field>

              <Field label="Téléphone">
                <Input
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </Field>

              <Field label="Zone principale">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.zoneId}
                  onChange={(e) => updateField('zoneId', e.target.value)}
                  disabled={loadingZones}
                >
                  <option value="">Aucune</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Statut">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </Field>
            </div>

            <Field label="Bio">
              <textarea
                className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.bio}
                onChange={(e) => updateField('bio', e.target.value)}
              />
            </Field>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate('/agents')}>
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