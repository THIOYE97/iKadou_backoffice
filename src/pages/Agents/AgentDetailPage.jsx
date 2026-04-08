import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Save,
  MapPin,
  Mail,
  Phone,
  User,
  Sparkles,
  Activity,
  ShieldCheck,
} from 'lucide-react';
import { agentsApi, zonesApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { readableDate } from '@/Util/readableDate';

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || '');

export default function AgentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const invalidAgentId = !isUuid(id);

  const [agent, setAgent] = useState(null);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [perfPeriod, setPerfPeriod] = useState('30d');
  const [performance, setPerformance] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingZone, setAddingZone] = useState(false);
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

  const loadAgent = useCallback(async () => {
    if (invalidAgentId) {
      setAgent(null);
      return;
    }

    try {
      const result = await agentsApi.get(id);
      const data = result?.data || result || null;
      setAgent(data);

      if (data) {
        setForm({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          zoneId: data.zone_id || '',
          status: data.status || 'active',
          bio: data.bio || '',
        });
      }
    } catch {
      setAgent(null);
    }
  }, [id, invalidAgentId]);

  const loadPerformance = useCallback(async () => {
    if (invalidAgentId) {
      setPerformance(null);
      return;
    }

    try {
      const result = await agentsApi.getPerformance(id, { period: perfPeriod });
      setPerformance(result?.data || result || null);
    } catch {
      setPerformance(null);
    }
  }, [id, perfPeriod, invalidAgentId]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      try {
        if (invalidAgentId) {
          setAgent(null);
          setPerformance(null);

          const zonesRes = await zonesApi.list().catch(() => ({ data: [] }));
          setZones(zonesRes?.data || []);
          return;
        }

        const [zonesRes] = await Promise.all([
          zonesApi.list().catch(() => ({ data: [] })),
          loadAgent(),
        ]);

        setZones(zonesRes?.data || []);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [loadAgent, invalidAgentId]);

  useEffect(() => {
    if (!invalidAgentId) loadPerformance();
  }, [loadPerformance, invalidAgentId]);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (invalidAgentId) return;

    setSaving(true);
    setError(null);

    try {
      await agentsApi.update(id, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || null,
        phone: form.phone || null,
        zoneId: form.zoneId || null,
        status: form.status,
        bio: form.bio || null,
      });

      await loadAgent();
    } catch (err) {
      setError(err?.response?.data?.message || "Impossible d'enregistrer");
    } finally {
      setSaving(false);
    }
  };

  const handleAddZone = async () => {
    if (!selectedZone || invalidAgentId) return;

    setAddingZone(true);
    try {
      await agentsApi.assignZone(id, selectedZone);
      setSelectedZone('');
      await loadAgent();
    } finally {
      setAddingZone(false);
    }
  };

  const handleRemoveZone = async (zoneId) => {
    if (invalidAgentId) return;

    try {
      await agentsApi.removeZone(id, zoneId);
      await loadAgent();
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (invalidAgentId) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="space-y-3 text-center">
          <p className="text-lg text-muted-foreground">Identifiant agent invalide.</p>
          <Button onClick={() => navigate('/agents')}>Retour à la liste</Button>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex h-72 items-center justify-center">
        <p className="text-lg text-muted-foreground">Agent introuvable.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.12),transparent_30%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--surface-1)))] p-6 shadow-sm md:p-8">
        <div className="absolute right-4 top-4 hidden rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur md:flex dark:border-white/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" className="mt-1 rounded-2xl" onClick={() => navigate('/agents')}>
              <ArrowLeft size={18} />
            </Button>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <User size={14} />
                Fiche agent
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                {agent.first_name} {agent.last_name}
              </h1>

              <p className="mt-2 text-sm text-muted-foreground">
                Créé le {readableDate(agent.created_at)}
              </p>
            </div>
          </div>

          <Badge variant={agent.status === 'active' ? 'success' : 'secondary'}>
            {agent.status === 'active' ? 'Actif' : 'Inactif'}
          </Badge>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm lg:col-span-2">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Informations personnelles
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <form className="space-y-6" onSubmit={handleSave}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Field label="Prénom" icon={<User size={16} />}>
                  <Input
                    value={form.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    placeholder="Ex: Jean"
                    className="h-11 rounded-2xl"
                  />
                </Field>

                <Field label="Nom" icon={<User size={16} />}>
                  <Input
                    value={form.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    placeholder="Ex: Dupont"
                    className="h-11 rounded-2xl"
                  />
                </Field>

                <Field label="Email" icon={<Mail size={16} />}>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="exemple@email.com"
                    className="h-11 rounded-2xl"
                  />
                </Field>

                <Field label="Téléphone" icon={<Phone size={16} />}>
                  <Input
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+223 70 00 00 00"
                    className="h-11 rounded-2xl"
                  />
                </Field>

                <Field label="Zone principale" icon={<MapPin size={16} />}>
                  <select
                    className="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.zoneId}
                    onChange={(e) => updateField('zoneId', e.target.value)}
                  >
                    <option value="">Aucune zone</option>
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Statut" icon={<ShieldCheck size={16} />}>
                  <select
                    className="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.status}
                    onChange={(e) => updateField('status', e.target.value)}
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </Field>
              </div>

              <Field label="Biographie">
                <textarea
                  className="min-h-[140px] w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={form.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  placeholder="Ajouter une description..."
                />
              </Field>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              ) : null}

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={saving} className="h-11 rounded-2xl">
                  {saving ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
                  Enregistrer les modifications
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Performance
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 pt-6">
            <div>
              <label className="mb-2 block text-sm font-medium">Période</label>
              <select
                className="h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={perfPeriod}
                onChange={(e) => setPerfPeriod(e.target.value)}
              >
                <option value="7d">7 jours</option>
                <option value="30d">30 jours</option>
                <option value="3m">3 mois</option>
                <option value="12m">12 mois</option>
              </select>
            </div>

            <div className="space-y-3">
              <MiniStat label="Leads total" value={performance?.leads?.total} />
              <MiniStat label="Leads convertis" value={performance?.leads?.converted} />
              <MiniStat label="Visites total" value={performance?.visits?.total} />
              <MiniStat label="Visites à venir" value={performance?.visits?.upcoming} />
              <MiniStat label="Paiements confirmés" value={performance?.payments?.total_payments} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Zones affectées
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="flex gap-3">
            <select
              className="h-11 min-w-0 flex-1 rounded-2xl border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
            >
              <option value="">Sélectionner une zone à ajouter</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>

            <Button onClick={handleAddZone} disabled={!selectedZone || addingZone} className="h-11 rounded-2xl">
              {addingZone ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Plus size={18} className="mr-2" />}
              Ajouter
            </Button>
          </div>

          {!agent.zones?.length ? (
            <div className="py-8 text-center">
              <MapPin size={32} className="mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">Aucune zone affectée</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agent.zones.map((z) => (
                <div
                  key={z.id}
                  className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-primary" />
                    <div>
                      <p className="text-sm font-medium">{z.name}</p>
                      <p className="text-xs text-muted-foreground">{z.region || '—'}</p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveZone(z.id)}
                    className="h-10 w-10 rounded-xl p-0 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children, icon }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        <label className="text-sm font-semibold text-foreground">{label}</label>
      </div>
      {children}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border bg-card px-4 py-3 transition-colors hover:bg-accent">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value ?? 0}</p>
    </div>
  );
}