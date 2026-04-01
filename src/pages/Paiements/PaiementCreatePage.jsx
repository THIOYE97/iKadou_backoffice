import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { paymentsApi, clientsApi, terrainsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function PaiementCreatePage() {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [terrains, setTerrains] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    clientId: '',
    terrainId: '',
    amount: '',
    currency: 'XOF',
    paymentMethod: '',
    transactionRef: '',
    notes: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [clientsRes, terrainsRes] = await Promise.all([
          clientsApi.list({ page: 1, limit: 100 }).catch(() => ({ data: [] })),
          terrainsApi.list({ page: 1, limit: 100 }).catch(() => ({ data: [] })),
        ]);

        setClients(clientsRes?.data || []);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await paymentsApi.create({
        clientId: form.clientId,
        terrainId: form.terrainId,
        amount: Number(form.amount),
        currency: form.currency,
        paymentMethod: form.paymentMethod || undefined,
        transactionRef: form.transactionRef || undefined,
        notes: form.notes || undefined,
      });

      navigate(`/paiements/${res?.data?.id || ''}`);
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de créer le paiement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/paiements')}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-semibold">Nouveau paiement</h1>
          <p className="text-sm text-muted-foreground">Enregistrer une transaction</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations paiement</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Client *">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form.clientId}
                    onChange={(e) => updateField('clientId', e.target.value)}
                    required
                  >
                    <option value="">Sélectionner</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </option>
                    ))}
                  </select>
                </Field>

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

                <Field label="Montant *">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => updateField('amount', e.target.value)}
                    required
                  />
                </Field>

                <Field label="Devise *">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form.currency}
                    onChange={(e) => updateField('currency', e.target.value)}
                  >
                    <option value="XOF">XOF</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </Field>

                <Field label="Méthode">
                  <Input
                    value={form.paymentMethod}
                    onChange={(e) => updateField('paymentMethod', e.target.value)}
                    placeholder="Virement, cash, mobile money…"
                  />
                </Field>

                <Field label="Référence transaction">
                  <Input
                    value={form.transactionRef}
                    onChange={(e) => updateField('transactionRef', e.target.value)}
                  />
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
                <Button type="button" variant="outline" onClick={() => navigate('/paiements')}>
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>
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