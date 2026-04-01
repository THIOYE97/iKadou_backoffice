import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Plus, Trash2, Save } from 'lucide-react';
import { agentsApi, zonesApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/ui/StatusBadge';
import { USER_STATUS } from '@/Util/statusConfig';
import { readableDate } from '@/Util/readableDate';

export default function AgentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

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
    try {
      const res = await agentsApi.get(id);
      const data = res?.data || null;
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
  }, [id]);

  const loadPerformance = useCallback(async () => {
    try {
      const res = await agentsApi.getPerformance(id, { period: perfPeriod });
      setPerformance(res?.data || null);
    } catch {
      setPerformance(null);
    }
  }, [id, perfPeriod]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
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
  }, [loadAgent]);

  useEffect(() => {
    loadPerformance();
  }, [loadPerformance]);

  const updateField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
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
    if (!selectedZone) return;
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
    try {
      await agentsApi.removeZone(id, zoneId);
      await loadAgent();
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!agent) {
    return <div className="text-center py-16 text-muted-foreground">Agent introuvable.</div>;
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/agents')}>
          <ArrowLeft size={18} />
        </Button>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold">
            {agent.first_name} {agent.last_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Créé le {readableDate(agent.created_at)}
          </p>
        </div>
        <StatusBadge map={USER_STATUS} value={agent.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSave}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Prénom">
                  <Input value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} />
                </Field>
                <Field label="Nom">
                  <Input value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} />
                </Field>
                <Field label="Email">
                  <Input value={form.email} onChange={(e) => updateField('email', e.target.value)} />
                </Field>
                <Field label="Téléphone">
                  <Input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
                </Field>
                <Field label="Zone principale">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form.zoneId}
                    onChange={(e) => updateField('zoneId', e.target.value)}
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

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Enregistrer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={perfPeriod}
              onChange={(e) => setPerfPeriod(e.target.value)}
            >
              <option value="7d">7 jours</option>
              <option value="30d">30 jours</option>
              <option value="3m">3 mois</option>
              <option value="12m">12 mois</option>
            </select>

            <MiniStat label="Leads total" value={performance?.leads?.total} />
            <MiniStat label="Leads convertis" value={performance?.leads?.converted} />
            <MiniStat label="Visites total" value={performance?.visits?.total} />
            <MiniStat label="Visites à venir" value={performance?.visits?.upcoming} />
            <MiniStat label="Paiements confirmés" value={performance?.payments?.total_payments} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zones affectées</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <select
              className="h-10 min-w-[220px] rounded-md border border-input bg-background px-3 text-sm"
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
            >
              <option value="">Sélectionner une zone</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
            <Button onClick={handleAddZone} disabled={!selectedZone || addingZone}>
              {addingZone ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Ajouter
            </Button>
          </div>

          {!agent.zones?.length ? (
            <p className="text-sm text-muted-foreground">Aucune zone affectée</p>
          ) : (
            <div className="space-y-2">
              {agent.zones.map((z) => (
                <div
                  key={z.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{z.name}</p>
                    <p className="text-xs text-muted-foreground">{z.region || '—'}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveZone(z.id)}>
                    <Trash2 size={14} />
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

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value ?? 0}</p>
    </div>
  );
}