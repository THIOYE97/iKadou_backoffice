import { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  CreditCard,
  Smartphone,
  Link as LinkIcon,
  CheckCircle,
  ExternalLink,
  Copy,
  Sparkles,
} from 'lucide-react';
import { paymentApi } from '@/Api/paymentApi';
import { clientsApi, terrainsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PROVIDERS = [
  {
    key: 'stripe_checkout',
    label: 'Carte bancaire',
    sub: 'Visa, Mastercard, SEPA — Stripe',
    icon: CreditCard,
    color: 'border-blue-300 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10',
    textColor: 'text-blue-700 dark:text-blue-300',
    badge: 'Diaspora',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
    desc: "Idéal pour les clients en Europe et à l'international.",
  },
  {
    key: 'danapay_transfer',
    label: 'Mobile Money (direct)',
    sub: 'Orange Money, Wave, Free Money…',
    icon: Smartphone,
    color: 'border-orange-300 bg-orange-50 dark:border-orange-500/20 dark:bg-orange-500/10',
    textColor: 'text-orange-700 dark:text-orange-300',
    badge: 'Mali / Afrique',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    desc: 'Le client reçoit une demande de paiement directe.',
  },
  {
    key: 'danapay_link',
    label: 'Lien de paiement Mobile',
    sub: 'Client choisit son opérateur',
    icon: LinkIcon,
    color: 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10',
    textColor: 'text-emerald-700 dark:text-emerald-300',
    badge: 'Flexible',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    desc: 'Un lien est généré pour paiement Mobile Money.',
  },
];

const OPERATORS = [
  { key: 'orange_money', label: 'Orange Money', flag: '🟠' },
  { key: 'wave', label: 'Wave', flag: '🔵' },
  { key: 'free_money', label: 'Free Money', flag: '🔴' },
  { key: 'moov_money', label: 'Moov Money', flag: '🟢' },
];

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

export default function CreatePaymentModal({ onClose, onSuccess, prefillClientId, prefillTerrainId }) {
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState('');
  const [clientId, setClientId] = useState(prefillClientId || '');
  const [terrainId, setTerrainId] = useState(prefillTerrainId || '');
  const [amountXof, setAmountXof] = useState('');
  const [currency, setCurrency] = useState('eur');
  const [phone, setPhone] = useState('');
  const [operator, setOperator] = useState('orange_money');
  const [notes, setNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const [clientSearch, setClientSearch] = useState('');
  const [terrainSearch, setTerrainSearch] = useState('');
  const [clients, setClients] = useState([]);
  const [terrains, setTerrains] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTerrain, setSelectedTerrain] = useState(null);

  useEffect(() => {
    if (prefillClientId) {
      clientsApi.get(prefillClientId).then((r) => {
        setSelectedClient(r.data);
        setClientId(r.data.id);
        setPhone(r.data.phone || '');
      }).catch(() => {});
    }

    if (prefillTerrainId) {
      terrainsApi.get(prefillTerrainId).then((r) => {
        setSelectedTerrain(r.data);
        setTerrainId(r.data.id);
        setAmountXof(String(r.data.price));
      }).catch(() => {});
    }
  }, [prefillClientId, prefillTerrainId]);

  useEffect(() => {
    if (clientSearch.length < 2) {
      setClients([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const r = await clientsApi.list({ search: clientSearch, limit: 6 });
        setClients(r.data);
      } catch {}
    }, 300);

    return () => clearTimeout(t);
  }, [clientSearch]);

  useEffect(() => {
    if (terrainSearch.length < 2) {
      setTerrains([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const r = await terrainsApi.list({ search: terrainSearch, limit: 6 });
        setTerrains(r.data);
      } catch {}
    }, 300);

    return () => clearTimeout(t);
  }, [terrainSearch]);

  const canProceed = () => {
    if (step === 1) return !!provider;
    if (step === 2) {
      const base = clientId && terrainId && Number(amountXof) > 0;
      if (provider === 'danapay_transfer') return base && phone;
      return base;
    }
    return true;
  };

  const handleSubmit = async () => {
    setSending(true);
    setError(null);

    try {
      let res;
      const base = { clientId, terrainId, amountXof: Number(amountXof), notes };

      if (provider === 'stripe_checkout') {
        res = await paymentApi.createStripeCheckout({ ...base, currency });
      } else if (provider === 'danapay_transfer') {
        res = await paymentApi.createDanaPayTransfer({ ...base, phone, operator });
      } else if (provider === 'danapay_link') {
        res = await paymentApi.createDanaPayLink(base);
      }

      setResult(res.data);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du paiement');
    } finally {
      setSending(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(result?.checkoutUrl || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedProviderConfig = PROVIDERS.find((p) => p.key === provider);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-[var(--shadow-lg)] animate-fade-in">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/90 px-5 py-4 backdrop-blur">
          <div>
            <h2 className="font-display text-lg font-semibold">Nouveau paiement</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {step === 1 ? 'Choisir le mode de paiement' : step === 2 ? 'Informations du paiement' : 'Résultat'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {error ? (
            <div className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-3">
              {PROVIDERS.map((p) => {
                const Icon = p.icon;
                const selected = provider === p.key;

                return (
                  <button
                    key={p.key}
                    onClick={() => setProvider(p.key)}
                    className={`w-full rounded-[24px] border-2 p-4 text-left transition-all ${
                      selected ? `${p.color} shadow-sm` : 'border-border hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${selected ? 'bg-white/60 dark:bg-white/10' : 'bg-muted'}`}>
                        <Icon size={20} className={selected ? p.textColor : 'text-muted-foreground'} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold">{p.label}</span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${p.badgeColor}`}>
                            {p.badge}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{p.sub}</p>
                        <p className="mt-1.5 text-xs text-muted-foreground">{p.desc}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              {selectedProviderConfig ? (
                <div className={`flex items-center gap-3 rounded-2xl border p-3 ${selectedProviderConfig.color}`}>
                  <selectedProviderConfig.icon size={16} className={selectedProviderConfig.textColor} />
                  <span className={`text-sm font-medium ${selectedProviderConfig.textColor}`}>
                    {selectedProviderConfig.label}
                  </span>
                  <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-bold ${selectedProviderConfig.badgeColor}`}>
                    {selectedProviderConfig.badge}
                  </span>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label>Client *</Label>
                {selectedClient ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                      {selectedClient.first_name?.[0]}{selectedClient.last_name?.[0]}
                    </div>
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{selectedClient.first_name} {selectedClient.last_name}</span>
                      <span className="ml-2 text-muted-foreground">{selectedClient.email || selectedClient.phone}</span>
                    </div>
                    <button onClick={() => { setSelectedClient(null); setClientId(''); }} className="text-muted-foreground hover:text-foreground">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      className="h-11 rounded-2xl"
                      placeholder="Rechercher un client…"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                    />
                    {clients.length > 0 ? (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border bg-card shadow-lg">
                        {clients.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSelectedClient(c);
                              setClientId(c.id);
                              setPhone(c.phone || '');
                              setClientSearch('');
                              setClients([]);
                            }}
                            className="flex w-full items-center gap-2 border-b px-3 py-3 text-left text-sm last:border-0 hover:bg-muted/50"
                          >
                            <span className="font-medium">{c.first_name} {c.last_name}</span>
                            <span className="text-muted-foreground">{c.email || c.phone}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Terrain *</Label>
                {selectedTerrain ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3">
                    <span className="font-mono text-xs font-semibold text-primary">{selectedTerrain.ref}</span>
                    <span className="flex-1 text-sm font-medium">{selectedTerrain.title}</span>
                    <button onClick={() => { setSelectedTerrain(null); setTerrainId(''); }} className="text-muted-foreground hover:text-foreground">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      className="h-11 rounded-2xl"
                      placeholder="Rechercher un terrain…"
                      value={terrainSearch}
                      onChange={(e) => setTerrainSearch(e.target.value)}
                    />
                    {terrains.length > 0 ? (
                      <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border bg-card shadow-lg">
                        {terrains.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setSelectedTerrain(t);
                              setTerrainId(t.id);
                              setAmountXof(String(t.price));
                              setTerrainSearch('');
                              setTerrains([]);
                            }}
                            className="flex w-full items-center gap-2 border-b px-3 py-3 text-left text-sm last:border-0 hover:bg-muted/50"
                          >
                            <span className="font-mono text-xs text-primary">{t.ref}</span>
                            <span className="flex-1 font-medium">{t.title}</span>
                            <span className="text-muted-foreground">{fmt(t.price)} XOF</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Montant (XOF) *</Label>
                  <Input
                    type="number"
                    className="h-11 rounded-2xl"
                    placeholder="15000000"
                    value={amountXof}
                    onChange={(e) => setAmountXof(e.target.value)}
                  />
                  {amountXof ? <p className="text-xs text-muted-foreground">{fmt(amountXof)} XOF</p> : null}
                </div>

                {provider === 'stripe_checkout' ? (
                  <div className="space-y-1.5">
                    <Label>Devise Stripe</Label>
                    <select
                      className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      <option value="eur">EUR (€)</option>
                      <option value="usd">USD ($)</option>
                    </select>
                  </div>
                ) : null}
              </div>

              {provider === 'danapay_transfer' ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Opérateur Mobile Money *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {OPERATORS.map((op) => (
                        <button
                          key={op.key}
                          onClick={() => setOperator(op.key)}
                          className={`rounded-2xl border p-3 text-sm font-medium transition-all ${
                            operator === op.key
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border hover:bg-muted/30'
                          }`}
                        >
                          {op.flag} {op.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Numéro de téléphone *</Label>
                    <Input
                      className="h-11 rounded-2xl"
                      placeholder="+223 70 00 00 00"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label>Notes internes (optionnel)</Label>
                <Input
                  className="h-11 rounded-2xl"
                  placeholder="Référence contrat, acompte, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          {step === 3 && result ? (
            <div className="space-y-4">
              <div className="py-2 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
                  <CheckCircle size={28} className="text-emerald-600 dark:text-emerald-300" />
                </div>
                <p className="text-lg font-semibold">Paiement initié</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Réf. <span className="font-mono font-semibold text-primary">{result.paymentRef}</span>
                </p>
              </div>

              <div className="space-y-3 rounded-2xl border bg-muted/40 p-4 text-sm">
                {result.checkoutUrl ? (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">Lien de paiement</p>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={result.checkoutUrl}
                        className="flex-1 truncate rounded px-2 py-1.5 font-mono text-xs border bg-background"
                      />
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={copyUrl}>
                        {copied ? <CheckCircle size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => window.open(result.checkoutUrl, '_blank')}>
                        <ExternalLink size={14} />
                      </Button>
                    </div>
                  </div>
                ) : null}

                {[
                  ['Montant', `${fmt(result.amountXof)} XOF`],
                  result.amountCents && ['Converti', `${(result.amountCents / 100).toFixed(2)} ${result.currency?.toUpperCase()}`],
                  result.operator && ['Opérateur', result.operator?.replace('_', ' ').toUpperCase()],
                  result.transferId && ['Ref DanaPay', result.transferId],
                  result.sessionId && ['Session Stripe', `${result.sessionId?.substring(0, 20)}…`],
                ]
                  .filter(Boolean)
                  .map(([l, v]) => (
                    <div key={l} className="flex gap-3">
                      <span className="w-28 shrink-0 text-muted-foreground">{l}</span>
                      <span className="font-mono text-xs font-medium">{v}</span>
                    </div>
                  ))}
              </div>
            </div>
          ) : null}

          <div className="flex justify-between border-t pt-2">
            {step > 1 && step < 3 ? (
              <Button variant="outline" className="rounded-2xl" onClick={() => setStep((s) => s - 1)}>
                ← Retour
              </Button>
            ) : (
              <div />
            )}

            {step === 1 ? (
              <Button className="rounded-2xl" onClick={() => setStep(2)} disabled={!canProceed()}>
                Suivant →
              </Button>
            ) : null}

            {step === 2 ? (
              <Button className="rounded-2xl" onClick={handleSubmit} disabled={sending || !canProceed()}>
                {sending ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                {sending ? 'Création…' : 'Créer le paiement'}
              </Button>
            ) : null}

            {step === 3 ? (
              <Button className="rounded-2xl" onClick={() => { onSuccess?.(); onClose(); }}>
                Fermer
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}