import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  Save,
  Sparkles,
  CalendarDays,
  Clock3,
  User2,
  MapPinned,
  FileText,
} from 'lucide-react';
import { visitsApi, clientsApi, leadsApi, agentsApi, terrainsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function VisitCreatePage() {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [terrains, setTerrains] = useState([]);

  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    terrainId: '',
    visitDate: '',
    visitTime: '',
    agentId: '',
    clientId: '',
    leadId: '',
    notes: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsRes, leadsRes, agentsRes, terrainsRes] = await Promise.all([
          clientsApi.list({ page: 1, limit: 100 }).catch(() => ({ data: [] })),
          leadsApi.list({ page: 1, limit: 100 }).catch(() => ({ data: [] })),
          agentsApi.list({ page: 1, limit: 100 }).catch(() => ({ data: [] })),
          terrainsApi.list({ page: 1, limit: 100 }).catch(() => ({ data: [] })),
        ]);

        setClients(clientsRes?.data || []);
        setLeads(leadsRes?.data || []);
        setAgents(agentsRes?.data || []);
        setTerrains(terrainsRes?.data || []);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  const updateField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleClientChange = (value) => {
    setForm((f) => ({
      ...f,
      clientId: value,
      leadId: value ? '' : f.leadId,
    }));
  };

  const handleLeadChange = (value) => {
    setForm((f) => ({
      ...f,
      leadId: value,
      clientId: value ? '' : f.clientId,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await visitsApi.create({
        terrainId: form.terrainId,
        visitDate: form.visitDate,
        visitTime: form.visitTime,
        agentId: form.agentId || undefined,
        clientId: form.clientId || undefined,
        leadId: form.leadId || undefined,
        notes: form.notes || undefined,
      });

      navigate(`/visites/${res?.data?.id || ''}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de planifier la visite');
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
            onClick={() => navigate('/visites')}
          >
            <ArrowLeft size={18} />
          </Button>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <CalendarDays className="h-3.5 w-3.5" />
              Planification
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Nouvelle visite
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Planifie une visite terrain avec client ou lead
            </p>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
        <CardHeader className="border-b border-border/60 pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Planification
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5">
          {loadingData ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <Field label="Terrain *" icon={MapPinned}>
                <select
                  className="h-11 w-full rounded-2xl border border-input bg-background px-4 pl-10 text-sm"
                  value={form.terrainId}
                  onChange={(e) => updateField('terrainId', e.target.value)}
                  required
                >
                  <option value="">Sélectionner</option>
                  {terrains.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title || t.ref || t.id}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Date *" icon={CalendarDays}>
                  <Input
                    type="date"
                    className="h-11 rounded-2xl pl-10"
                    value={form.visitDate}
                    onChange={(e) => updateField('visitDate', e.target.value)}
                    required
                  />
                </Field>

                <Field label="Heure *" icon={Clock3}>
                  <Input
                    type="time"
                    className="h-11 rounded-2xl pl-10"
                    value={form.visitTime}
                    onChange={(e) => updateField('visitTime', e.target.value)}
                    required
                  />
                </Field>

                <Field label="Agent" icon={User2}>
                  <select
                    className="h-11 w-full rounded-2xl border border-input bg-background px-4 pl-10 text-sm"
                    value={form.agentId}
                    onChange={(e) => updateField('agentId', e.target.value)}
                  >
                    <option value="">Aucun</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.first_name} {a.last_name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Client" icon={User2}>
                  <select
                    className="h-11 w-full rounded-2xl border border-input bg-background px-4 pl-10 text-sm"
                    value={form.clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                  >
                    <option value="">Aucun</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Lead" icon={User2}>
                  <select
                    className="h-11 w-full rounded-2xl border border-input bg-background px-4 pl-10 text-sm"
                    value={form.leadId}
                    onChange={(e) => handleLeadChange(e.target.value)}
                  >
                    <option value="">Aucun</option>
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {(l.first_name || '')} {(l.last_name || '')}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Notes" icon={FileText}>
                <textarea
                  className="min-h-[120px] w-full rounded-2xl border border-input bg-background px-4 py-3 pl-10 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                />
              </Field>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" className="rounded-2xl" onClick={() => navigate('/visites')}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="rounded-2xl"
                  disabled={saving || (!form.clientId && !form.leadId)}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Enregistrer
                </Button>
              </div>
            </form>
          )}
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