import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Save,
  Sparkles,
  User2,
  Mail,
  Phone,
  MapPinned,
  ShieldCheck,
  FileText,
} from 'lucide-react';
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
    <div className="max-w-4xl space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.12),transparent_30%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--surface-1)))] p-6 shadow-sm md:p-8">
        <div className="absolute right-4 top-4 hidden rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur md:flex dark:border-white/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="mt-1 rounded-2xl" onClick={() => navigate('/agents')}>
            <ArrowLeft size={18} />
          </Button>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <User2 className="h-3.5 w-3.5" />
              Création
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Nouvel agent
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Créer un agent commercial et l’associer à une zone principale
            </p>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Informations générales
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Prénom *" icon={User2}>
                <Input
                  className="h-11 rounded-2xl pl-10"
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  required
                />
              </Field>

              <Field label="Nom *" icon={User2}>
                <Input
                  className="h-11 rounded-2xl pl-10"
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  required
                />
              </Field>

              <Field label="Email" icon={Mail}>
                <Input
                  type="email"
                  className="h-11 rounded-2xl pl-10"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </Field>

              <Field label="Téléphone" icon={Phone}>
                <Input
                  className="h-11 rounded-2xl pl-10"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </Field>

              <Field label="Zone principale" icon={MapPinned}>
                <select
                  className="h-11 w-full rounded-2xl border border-input bg-background px-4 pl-10 text-sm"
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

              <Field label="Statut" icon={ShieldCheck}>
                <select
                  className="h-11 w-full rounded-2xl border border-input bg-background px-4 pl-10 text-sm"
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </Field>
            </div>

            <Field label="Bio" icon={FileText}>
              <textarea
                className="min-h-[140px] w-full rounded-2xl border border-input bg-background px-4 py-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                value={form.bio}
                onChange={(e) => updateField('bio', e.target.value)}
              />
            </Field>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-2xl" onClick={() => navigate('/agents')}>
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