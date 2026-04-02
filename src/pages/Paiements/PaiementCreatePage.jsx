import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2, Save } from 'lucide-react';
import { paymentsApi, clientsApi, terrainsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const OPERATORS = [
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'wave', label: 'Wave' },
  { value: 'free_money', label: 'Free Money' },
  { value: 'moov_money', label: 'Moov Money' },
  { value: 'mtn_momo', label: 'MTN MoMo' },
];

export default function PaiementCreatePage() {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [terrains, setTerrains] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    clientId: '',
    terrainId: '',
    amountXof: '',
    providerAction: 'stripe_checkout',
    currency: 'eur',
    operator: 'wave',
    phone: '',
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

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === form.clientId),
    [clients, form.clientId]
  );

  const updateField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setResult(null);

    try {
      const payloadBase = {
        clientId: form.clientId,
        terrainId: form.terrainId,
        amountXof: Number(form.amountXof),
        notes: form.notes || undefined,
      };

      let res;

      switch (form.providerAction) {
        case 'stripe_intent':
          res = await paymentsApi.createStripeIntent({
            ...payloadBase,
            currency: form.currency || 'eur',
          });
          break;

        case 'stripe_checkout':
          res = await paymentsApi.createStripeCheckout({
            ...payloadBase,
            currency: form.currency || 'eur',
          });
          break;

        case 'danapay_transfer':
          res = await paymentsApi.createDanaPayTransfer({
            ...payloadBase,
            phone: form.phone || selectedClient?.phone || '',
            operator: form.operator,
          });
          break;

        case 'danapay_link':
          res = await paymentsApi.createDanaPayLink(payloadBase);
          break;

        default:
          throw new Error('Action de paiement non supportée');
      }

      const data = res?.data;
      setResult(data || null);

      if (data?.paymentId) {
        navigate(`/paiements/${data.paymentId}`, {
          state: { creationResult: data },
        });
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Impossible de créer le paiement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/paiements')}>
          <ArrowLeft size={18} />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-semibold">Nouveau paiement</h1>
          <p className="text-sm text-muted-foreground">
            Créer un paiement Stripe ou DanaPay
          </p>
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

                <Field label="Montant (XOF) *">
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={form.amountXof}
                    onChange={(e) => updateField('amountXof', e.target.value)}
                    required
                  />
                </Field>

                <Field label="Action paiement *">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={form.providerAction}
                    onChange={(e) => updateField('providerAction', e.target.value)}
                  >
                    <option value="stripe_checkout">Stripe Checkout</option>
                    <option value="stripe_intent">Stripe Payment Intent</option>
                    <option value="danapay_transfer">DanaPay Transfer</option>
                    <option value="danapay_link">DanaPay Payment Link</option>
                  </select>
                </Field>

                {(form.providerAction === 'stripe_checkout' || form.providerAction === 'stripe_intent') && (
                  <Field label="Devise cible Stripe">
                    <select
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={form.currency}
                      onChange={(e) => updateField('currency', e.target.value)}
                    >
                      <option value="eur">EUR</option>
                      <option value="usd">USD</option>
                    </select>
                  </Field>
                )}

                {form.providerAction === 'danapay_transfer' && (
                  <>
                    <Field label="Opérateur *">
                      <select
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={form.operator}
                        onChange={(e) => updateField('operator', e.target.value)}
                        required
                      >
                        {OPERATORS.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Téléphone client *">
                      <Input
                        value={form.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        placeholder={selectedClient?.phone || 'Numéro mobile money'}
                        required
                      />
                    </Field>
                  </>
                )}
              </div>

              <Field label="Notes">
                <textarea
                  className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                />
              </Field>

              {error && <p className="text-sm text-destructive">{error}</p>}

              {result && (
                <div className="rounded-md border bg-muted/30 p-4 text-sm space-y-2">
                  <p className="font-medium">Paiement créé avec succès</p>
                  <p>Réf. : {result.paymentRef || '—'}</p>
                  {result.paymentId && <p>ID : {result.paymentId}</p>}
                  {result.checkoutUrl && (
                    <a
                      href={result.checkoutUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                      Ouvrir le lien de paiement <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate('/paiements')}>
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Créer le paiement
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