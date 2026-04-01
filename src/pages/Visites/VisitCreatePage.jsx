import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
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
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/visites')}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-semibold">Nouvelle visite</h1>
          <p className="text-sm text-muted-foreground">Planifier une visite terrain</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Planification</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <Field label="Terrain *">
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Date *">
                  <Input
                    type="date"
                    value={form.visitDate}
                    onChange={(e) => updateField('visitDate', e.target.value)}
                    required
                  />
                </Field>

                <Field label="Heure *">
                  <Input
                    type="time"
                    value={form.visitTime}
                    onChange={(e) => updateField('visitTime', e.target.value)}
                    required
                  />
                </Field>

                <Field label="Agent">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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

                <Field label="Client">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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

                <Field label="Lead">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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

              <Field label="Notes">
                <textarea
                  className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                />
              </Field>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate('/visites')}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={saving || !form.clientId && !form.leadId}
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

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}