import { useState, useEffect } from 'react';
import { X, Loader2, CreditCard, Smartphone, Link, CheckCircle, ExternalLink, Copy } from 'lucide-react';
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
    color: 'border-blue-300 bg-blue-50',
    textColor: 'text-blue-700',
    badge: 'Diaspora',
    badgeColor: 'bg-blue-100 text-blue-700',
    desc: 'Idéal pour les clients en Europe et à l\'international. Lien de paiement sécurisé Stripe.',
  },
  {
    key: 'danapay_transfer',
    label: 'Mobile Money (direct)',
    sub: 'Orange Money, Wave, Free Money…',
    icon: Smartphone,
    color: 'border-orange-300 bg-orange-50',
    textColor: 'text-orange-700',
    badge: 'Mali / Afrique',
    badgeColor: 'bg-orange-100 text-orange-700',
    desc: 'Le client reçoit une demande de paiement directement sur son téléphone. Il doit valider avec son code secret.',
  },
  {
    key: 'danapay_link',
    label: 'Lien de paiement Mobile',
    sub: 'Client choisit son opérateur',
    icon: Link,
    color: 'border-emerald-300 bg-emerald-50',
    textColor: 'text-emerald-700',
    badge: 'Flexible',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    desc: 'Un lien est généré. Le client ouvre le lien et choisit son opérateur Mobile Money parmi ceux disponibles.',
  },
];

const OPERATORS = [
  { key: 'orange_money', label: 'Orange Money', flag: '🟠' },
  { key: 'wave',         label: 'Wave',          flag: '🔵' },
  { key: 'free_money',   label: 'Free Money',    flag: '🔴' },
  { key: 'moov_money',   label: 'Moov Money',    flag: '🟢' },
];

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);

export default function CreatePaymentModal({ onClose, onSuccess, prefillClientId, prefillTerrainId }) {
  const [step, setStep]           = useState(1); // 1=provider, 2=details, 3=result
  const [provider, setProvider]   = useState('');
  const [clientId, setClientId]   = useState(prefillClientId || '');
  const [terrainId, setTerrainId] = useState(prefillTerrainId || '');
  const [amountXof, setAmountXof] = useState('');
  const [currency, setCurrency]   = useState('eur');
  const [phone, setPhone]         = useState('');
  const [operator, setOperator]   = useState('orange_money');
  const [notes, setNotes]         = useState('');
  const [sending, setSending]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState(null);
  const [copied, setCopied]       = useState(false);

  // Client/terrain search
  const [clientSearch, setClientSearch]   = useState('');
  const [terrainSearch, setTerrainSearch] = useState('');
  const [clients, setClients]             = useState([]);
  const [terrains, setTerrains]           = useState([]);
  const [selectedClient, setSelectedClient]   = useState(null);
  const [selectedTerrain, setSelectedTerrain] = useState(null);

  // Auto-fill from props
  useEffect(() => {
    if (prefillClientId) {
      clientsApi.get(prefillClientId).then(r => {
        setSelectedClient(r.data);
        setClientId(r.data.id);
        setPhone(r.data.phone || '');
      }).catch(() => {});
    }
    if (prefillTerrainId) {
      terrainsApi.get(prefillTerrainId).then(r => {
        setSelectedTerrain(r.data);
        setTerrainId(r.data.id);
        setAmountXof(String(r.data.price));
      }).catch(() => {});
    }
  }, [prefillClientId, prefillTerrainId]);

  // Search clients
  useEffect(() => {
    if (clientSearch.length < 2) { setClients([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await clientsApi.list({ search: clientSearch, limit: 6 });
        setClients(r.data);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  // Search terrains
  useEffect(() => {
    if (terrainSearch.length < 2) { setTerrains([]); return; }
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
    setSending(true); setError(null);
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
    } finally { setSending(false); }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(result?.checkoutUrl || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedProviderConfig = PROVIDERS.find(p => p.key === provider);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-card z-10">
          <div>
            <h2 className="font-display font-semibold">Nouveau paiement</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step === 1 ? 'Choisir le mode de paiement' : step === 2 ? 'Informations du paiement' : 'Résultat'}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</div>
          )}

          {/* ── Step 1: Provider ── */}
          {step === 1 && (
            <div className="space-y-3">
              {PROVIDERS.map(p => {
                const Icon = p.icon;
                const selected = provider === p.key;
                return (
                  <button key={p.key} onClick={() => setProvider(p.key)}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      selected ? p.color + ' border-opacity-100' : 'border-border hover:bg-muted/30'
                    }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${selected ? 'bg-white/60' : 'bg-muted'}`}>
                      <Icon size={20} className={selected ? p.textColor : 'text-muted-foreground'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{p.label}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.badgeColor}`}>{p.badge}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.sub}</p>
                      <p className="text-xs text-muted-foreground mt-1.5">{p.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 ${selected ? 'border-current bg-current' : 'border-muted-foreground'}`}>
                      {selected && <div className="w-full h-full rounded-full bg-white scale-50" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Step 2: Details ── */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Provider recap */}
              {selectedProviderConfig && (
                <div className={`flex items-center gap-3 p-3 rounded-lg border ${selectedProviderConfig.color}`}>
                  <selectedProviderConfig.icon size={16} className={selectedProviderConfig.textColor} />
                  <span className={`text-sm font-medium ${selectedProviderConfig.textColor}`}>{selectedProviderConfig.label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto ${selectedProviderConfig.badgeColor}`}>
                    {selectedProviderConfig.badge}
                  </span>
                </div>
              )}

              {/* Client */}
              <div className="space-y-1.5">
                <Label>Client *</Label>
                {selectedClient ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                      {selectedClient.first_name?.[0]}{selectedClient.last_name?.[0]}
                    </div>
                    <div className="flex-1 text-sm">
                      <span className="font-medium">{selectedClient.first_name} {selectedClient.last_name}</span>
                      <span className="text-muted-foreground ml-2">{selectedClient.email || selectedClient.phone}</span>
                    </div>
                    <button onClick={() => { setSelectedClient(null); setClientId(''); }} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input placeholder="Rechercher un client…" value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
                    {clients.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-20 bg-card border rounded-lg mt-1 shadow-lg overflow-hidden">
                        {clients.map(c => (
                          <button key={c.id} onClick={() => { setSelectedClient(c); setClientId(c.id); setPhone(c.phone || ''); setClientSearch(''); setClients([]); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/50 border-b last:border-0">
                            <span className="font-medium">{c.first_name} {c.last_name}</span>
                            <span className="text-muted-foreground">{c.email || c.phone}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Terrain */}
              <div className="space-y-1.5">
                <Label>Terrain *</Label>
                {selectedTerrain ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                    <span className="font-mono text-xs text-primary font-semibold">{selectedTerrain.ref}</span>
                    <span className="text-sm font-medium flex-1">{selectedTerrain.title}</span>
                    <button onClick={() => { setSelectedTerrain(null); setTerrainId(''); }} className="text-muted-foreground hover:text-foreground"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input placeholder="Rechercher un terrain…" value={terrainSearch} onChange={e => setTerrainSearch(e.target.value)} />
                    {terrains.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-20 bg-card border rounded-lg mt-1 shadow-lg overflow-hidden">
                        {terrains.map(t => (
                          <button key={t.id} onClick={() => { setSelectedTerrain(t); setTerrainId(t.id); setAmountXof(String(t.price)); setTerrainSearch(''); setTerrains([]); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/50 border-b last:border-0">
                            <span className="font-mono text-xs text-primary">{t.ref}</span>
                            <span className="font-medium flex-1">{t.title}</span>
                            <span className="text-muted-foreground">{fmt(t.price)} XOF</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Montant (XOF) *</Label>
                  <Input type="number" placeholder="15000000" value={amountXof}
                    onChange={e => setAmountXof(e.target.value)} />
                  {amountXof && <p className="text-xs text-muted-foreground">{fmt(amountXof)} XOF</p>}
                </div>
                {provider === 'stripe_checkout' && (
                  <div className="space-y-1.5">
                    <Label>Devise Stripe</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={currency} onChange={e => setCurrency(e.target.value)}>
                      <option value="eur">EUR (€)</option>
                      <option value="usd">USD ($)</option>
                    </select>
                    {amountXof && currency === 'eur' && (
                      <p className="text-xs text-muted-foreground">≈ {(amountXof / 655.957).toFixed(2)} €</p>
                    )}
                    {amountXof && currency === 'usd' && (
                      <p className="text-xs text-muted-foreground">≈ {(amountXof / 609).toFixed(2)} $</p>
                    )}
                  </div>
                )}
              </div>

              {/* DanaPay transfer specifics */}
              {provider === 'danapay_transfer' && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Opérateur Mobile Money *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {OPERATORS.map(op => (
                        <button key={op.key} onClick={() => setOperator(op.key)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-all ${
                            operator === op.key ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/30'
                          }`}>
                          <span>{op.flag}</span> {op.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Numéro de téléphone *</Label>
                    <Input placeholder="+223 70 00 00 00" value={phone} onChange={e => setPhone(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Le client recevra une demande de paiement sur ce numéro</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <Label>Notes internes (optionnel)</Label>
                <Input placeholder="Référence contrat, acompte, etc." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Step 3: Result ── */}
          {step === 3 && result && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={28} className="text-emerald-600" />
                </div>
                <p className="font-display text-lg font-semibold">Paiement initié</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Réf. <span className="font-mono font-semibold text-primary">{result.paymentRef}</span>
                </p>
              </div>

              <div className="rounded-xl bg-muted/50 border p-4 space-y-3 text-sm">
                {result.checkoutUrl && (
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-1.5">Lien de paiement</p>
                    <div className="flex items-center gap-2">
                      <input readOnly value={result.checkoutUrl}
                        className="flex-1 text-xs font-mono bg-background border rounded px-2 py-1.5 truncate" />
                      <Button size="sm" variant="outline" onClick={copyUrl}>
                        {copied ? <CheckCircle size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => window.open(result.checkoutUrl, '_blank')}>
                        <ExternalLink size={14} />
                      </Button>
                    </div>
                    {result.expiresAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ⏱ Expire dans 30 minutes
                      </p>
                    )}
                  </div>
                )}

                {result.message && (
                  <div className="rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 text-xs text-orange-800">
                    📱 {result.message}
                  </div>
                )}

                {[
                  ['Montant', `${fmt(result.amountXof)} XOF`],
                  result.amountCents && ['Converti', `${(result.amountCents / 100).toFixed(2)} ${result.currency?.toUpperCase()}`],
                  result.operator && ['Opérateur', result.operator?.replace('_', ' ').toUpperCase()],
                  result.transferId && ['Ref DanaPay', result.transferId],
                  result.sessionId && ['Session Stripe', result.sessionId?.substring(0, 20) + '…'],
                ].filter(Boolean).map(([l, v]) => (
                  <div key={l} className="flex gap-3">
                    <span className="text-muted-foreground w-28 flex-shrink-0">{l}</span>
                    <span className="font-medium font-mono text-xs">{v}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Le statut sera mis à jour automatiquement via les webhooks Stripe / DanaPay
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2 border-t">
            {step > 1 && step < 3
              ? <Button variant="outline" onClick={() => setStep(s => s - 1)}>← Retour</Button>
              : <div />
            }
            {step === 1 && (
              <Button onClick={() => setStep(2)} disabled={!canProceed()}>Suivant →</Button>
            )}
            {step === 2 && (
              <Button onClick={handleSubmit} disabled={sending || !canProceed()}>
                {sending ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                {sending ? 'Création…' : 'Créer le paiement'}
              </Button>
            )}
            {step === 3 && (
              <Button onClick={() => { onSuccess?.(); onClose(); }}>Fermer</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
