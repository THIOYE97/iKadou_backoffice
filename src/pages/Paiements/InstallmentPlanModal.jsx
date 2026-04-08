import { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2, Calendar, AlertCircle, Sparkles } from 'lucide-react';
import { paymentApi } from '@/Api/paymentApi';
import { clientsApi, terrainsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (n) => (n ? new Intl.NumberFormat('fr-FR').format(Math.round(n)) : '0');

const addMonths = (dateStr, months) => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
};

const today = () => new Date().toISOString().split('T')[0];

export default function InstallmentPlanModal({ onClose, onSuccess, prefillClientId, prefillTerrainId, prefillAmount }) {
  const [clientId, setClientId] = useState(prefillClientId || '');
  const [terrainId, setTerrainId] = useState(prefillTerrainId || '');
  const [totalAmount, setTotalAmount] = useState(prefillAmount ? String(prefillAmount) : '');
  const [nbInstallments, setNbInstallments] = useState(3);
  const [installments, setInstallments] = useState([]);
  const [notes, setNotes] = useState('');
  const [provider, setProvider] = useState('manual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [clientSearch, setClientSearch] = useState('');
  const [terrainSearch, setTerrainSearch] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [terrainResults, setTerrainResults] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTerrain, setSelectedTerrain] = useState(null);

  useEffect(() => {
    if (prefillClientId) {
      clientsApi.get(prefillClientId).then((r) => {
        setSelectedClient(r.data);
        setClientId(r.data.id);
      }).catch(() => {});
    }
    if (prefillTerrainId) {
      terrainsApi.get(prefillTerrainId).then((r) => {
        setSelectedTerrain(r.data);
        setTerrainId(r.data.id);
        if (!prefillAmount) setTotalAmount(String(r.data.price));
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (clientSearch.length < 2) {
      setClientResults([]);
      return;
    }
    const t = setTimeout(() => {
      clientsApi.list({ search: clientSearch, limit: 6 }).then((r) => setClientResults(r.data)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  useEffect(() => {
    if (terrainSearch.length < 2) {
      setTerrainResults([]);
      return;
    }
    const t = setTimeout(() => {
      terrainsApi.list({ search: terrainSearch, limit: 6 }).then((r) => setTerrainResults(r.data)).catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [terrainSearch]);

  useEffect(() => {
    if (!totalAmount || !nbInstallments) return;
    const total = Number(totalAmount);
    if (isNaN(total) || total <= 0) return;

    const baseAmount = Math.floor(total / nbInstallments);
    const remainder = total - baseAmount * nbInstallments;
    const startDate = addMonths(today(), 1);

    const newInstallments = Array.from({ length: nbInstallments }, (_, i) => ({
      amountXof: i === 0 ? baseAmount + remainder : baseAmount,
      dueDate: addMonths(startDate, i),
    }));

    setInstallments(newInstallments);
  }, [totalAmount, nbInstallments]);

  const updateInstallment = (idx, field, value) => {
    setInstallments((prev) => prev.map((inst, i) => (i === idx ? { ...inst, [field]: value } : inst)));
  };

  const removeInstallment = (idx) => {
    setInstallments((prev) => prev.filter((_, i) => i !== idx));
  };

  const addInstallment = () => {
    const last = installments[installments.length - 1];
    setInstallments((prev) => [
      ...prev,
      {
        amountXof: 0,
        dueDate: last ? addMonths(last.dueDate, 1) : addMonths(today(), 1),
      },
    ]);
  };

  const plannedTotal = installments.reduce((s, i) => s + Number(i.amountXof || 0), 0);
  const difference = Number(totalAmount || 0) - plannedTotal;

  const handleSubmit = async () => {
    if (!clientId || !terrainId) {
      setError('Client et terrain requis');
      return;
    }
    if (!totalAmount || Number(totalAmount) <= 0) {
      setError('Montant total requis');
      return;
    }
    if (installments.length < 2) {
      setError('Minimum 2 échéances');
      return;
    }
    if (Math.abs(difference) > 1) {
      setError(`La somme des échéances (${fmt(plannedTotal)} XOF) ne correspond pas au total (${fmt(totalAmount)} XOF)`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await paymentApi.createPlan({
        clientId,
        terrainId,
        totalAmountXof: Number(totalAmount),
        installments: installments.map((i) => ({
          amountXof: Number(i.amountXof),
          dueDate: i.dueDate,
        })),
        notes: notes || undefined,
        provider,
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du plan');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-[var(--shadow-lg)] animate-fade-in">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/90 px-5 py-4 backdrop-blur">
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Calendar size={18} className="text-primary" />
              Plan de paiement échelonné
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Divise le paiement en plusieurs échéances
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {error ? (
            <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle size={14} />
              {error}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label>Client *</Label>
            {selectedClient ? (
              <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                  {selectedClient.first_name?.[0]}{selectedClient.last_name?.[0]}
                </div>
                <span className="flex-1 text-sm font-medium">
                  {selectedClient.first_name} {selectedClient.last_name}
                </span>
                <button onClick={() => { setSelectedClient(null); setClientId(''); }} className="text-muted-foreground hover:text-foreground">
                  <X size={13} />
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
                {clientResults.length > 0 ? (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border bg-card shadow-lg">
                    {clientResults.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedClient(c);
                          setClientId(c.id);
                          setClientSearch('');
                          setClientResults([]);
                        }}
                        className="flex w-full items-center gap-2 border-b px-3 py-3 text-left text-sm last:border-0 hover:bg-muted/50"
                      >
                        <span className="font-medium">{c.first_name} {c.last_name}</span>
                        <span className="text-xs text-muted-foreground">{c.email || c.phone}</span>
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
                  <X size={13} />
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
                {terrainResults.length > 0 ? (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border bg-card shadow-lg">
                    {terrainResults.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSelectedTerrain(t);
                          setTerrainId(t.id);
                          setTotalAmount(String(t.price));
                          setTerrainSearch('');
                          setTerrainResults([]);
                        }}
                        className="flex w-full items-center gap-2 border-b px-3 py-3 text-left text-sm last:border-0 hover:bg-muted/50"
                      >
                        <span className="font-mono text-xs text-primary">{t.ref}</span>
                        <span className="flex-1 font-medium">{t.title}</span>
                        <span className="text-xs text-muted-foreground">{fmt(t.price)} XOF</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Montant total (XOF) *</Label>
              <Input
                type="number"
                className="h-11 rounded-2xl"
                placeholder="15000000"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Nombre d'échéances</Label>
              <select
                className="flex h-11 w-full rounded-2xl border border-input bg-background px-4 text-sm"
                value={nbInstallments}
                onChange={(e) => setNbInstallments(Number(e.target.value))}
              >
                {[2, 3, 4, 6, 8, 10, 12, 18, 24].map((n) => (
                  <option key={n} value={n}>
                    {n} échéances
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Mode de paiement des échéances</Label>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {[
                { key: 'manual', label: 'Manuel', icon: '✍️' },
                { key: 'stripe', label: 'Stripe', icon: '💳' },
                { key: 'danapay', label: 'DanaPay', icon: '📱' },
                { key: 'bank_transfer', label: 'Virement', icon: '🏦' },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setProvider(p.key)}
                  className={`rounded-2xl border-2 p-3 text-xs font-medium transition-all ${
                    provider === p.key
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:bg-muted/30'
                  }`}
                >
                  <div className="text-lg">{p.icon}</div>
                  <div className="mt-1">{p.label}</div>
                </button>
              ))}
            </div>
          </div>

          {installments.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Échéancier</Label>
                <div
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    Math.abs(difference) <= 1
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  Total planifié : {fmt(plannedTotal)} XOF
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border">
                <div className="grid grid-cols-12 gap-2 bg-muted/50 px-4 py-2 text-xs font-semibold text-muted-foreground">
                  <span className="col-span-1">#</span>
                  <span className="col-span-5">Montant (XOF)</span>
                  <span className="col-span-5">Échéance</span>
                  <span className="col-span-1" />
                </div>

                {installments.map((inst, idx) => (
                  <div key={idx} className="grid grid-cols-12 items-center gap-2 border-t px-4 py-3">
                    <span className="col-span-1 text-xs font-bold text-muted-foreground">{idx + 1}</span>
                    <div className="col-span-5">
                      <Input
                        type="number"
                        className="h-10 rounded-xl text-sm"
                        value={inst.amountXof}
                        onChange={(e) => updateInstallment(idx, 'amountXof', e.target.value)}
                      />
                    </div>
                    <div className="col-span-5">
                      <Input
                        type="date"
                        className="h-10 rounded-xl text-sm"
                        value={inst.dueDate}
                        onChange={(e) => updateInstallment(idx, 'dueDate', e.target.value)}
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {installments.length > 2 ? (
                        <button onClick={() => removeInstallment(idx)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 size={13} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" className="w-full rounded-2xl" onClick={addInstallment}>
                <Plus size={14} />
                Ajouter une échéance
              </Button>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label>Notes internes (optionnel)</Label>
            <Input
              className="h-11 rounded-2xl"
              placeholder="Conditions particulières, référence contrat…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-2">
            <Button variant="outline" className="rounded-2xl" onClick={onClose}>
              Annuler
            </Button>
            <Button className="rounded-2xl" onClick={handleSubmit} disabled={loading || Math.abs(difference) > 1}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
              {loading ? 'Création…' : `Créer le plan (${installments.length} échéances)`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}