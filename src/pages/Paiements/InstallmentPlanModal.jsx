import { useState, useEffect } from 'react';
import { X, Loader2, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { paymentApi } from '@/Api/paymentApi';
import { clientsApi, terrainsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (n) => n ? new Intl.NumberFormat('fr-FR').format(Math.round(n)) : '0';

// Add N months to a date string (YYYY-MM-DD)
const addMonths = (dateStr, months) => {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
};

const today = () => new Date().toISOString().split('T')[0];

export default function InstallmentPlanModal({ onClose, onSuccess, prefillClientId, prefillTerrainId, prefillAmount }) {
  const [clientId, setClientId]   = useState(prefillClientId || '');
  const [terrainId, setTerrainId] = useState(prefillTerrainId || '');
  const [totalAmount, setTotalAmount] = useState(prefillAmount ? String(prefillAmount) : '');
  const [nbInstallments, setNbInstallments] = useState(3);
  const [installments, setInstallments] = useState([]);
  const [notes, setNotes]         = useState('');
  const [provider, setProvider]   = useState('manual');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // Client/terrain search
  const [clientSearch, setClientSearch]   = useState('');
  const [terrainSearch, setTerrainSearch] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [terrainResults, setTerrainResults] = useState([]);
  const [selectedClient, setSelectedClient]   = useState(null);
  const [selectedTerrain, setSelectedTerrain] = useState(null);

  // Auto-load prefill
  useEffect(() => {
    if (prefillClientId) {
      clientsApi.get(prefillClientId).then(r => { setSelectedClient(r.data); setClientId(r.data.id); }).catch(() => {});
    }
    if (prefillTerrainId) {
      terrainsApi.get(prefillTerrainId).then(r => { setSelectedTerrain(r.data); setTerrainId(r.data.id); if (!prefillAmount) setTotalAmount(String(r.data.price)); }).catch(() => {});
    }
  }, []);

  // Search
  useEffect(() => {
    if (clientSearch.length < 2) { setClientResults([]); return; }
    const t = setTimeout(() => clientsApi.list({ search: clientSearch, limit: 6 }).then(r => setClientResults(r.data)).catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [clientSearch]);

  useEffect(() => {
    if (terrainSearch.length < 2) { setTerrainResults([]); return; }
    const t = setTimeout(() => terrainsApi.list({ search: terrainSearch, limit: 6 }).then(r => setTerrainResults(r.data)).catch(() => {}), 300);
    return () => clearTimeout(t);
  }, [terrainSearch]);

  // Auto-generate installments whenever total or nb changes
  useEffect(() => {
    if (!totalAmount || !nbInstallments) return;
    const total = Number(totalAmount);
    if (isNaN(total) || total <= 0) return;

    const baseAmount  = Math.floor(total / nbInstallments);
    const remainder   = total - (baseAmount * nbInstallments);
    const startDate   = addMonths(today(), 1);

    const newInstallments = Array.from({ length: nbInstallments }, (_, i) => ({
      amountXof: i === 0 ? baseAmount + remainder : baseAmount,
      dueDate:   addMonths(startDate, i),
    }));

    setInstallments(newInstallments);
  }, [totalAmount, nbInstallments]);

  const updateInstallment = (idx, field, value) => {
    setInstallments(prev => prev.map((inst, i) => i === idx ? { ...inst, [field]: value } : inst));
  };

  const removeInstallment = (idx) => {
    setInstallments(prev => prev.filter((_, i) => i !== idx));
  };

  const addInstallment = () => {
    const last = installments[installments.length - 1];
    setInstallments(prev => [...prev, {
      amountXof: 0,
      dueDate: last ? addMonths(last.dueDate, 1) : addMonths(today(), 1),
    }]);
  };

  const plannedTotal = installments.reduce((s, i) => s + Number(i.amountXof || 0), 0);
  const difference   = Number(totalAmount || 0) - plannedTotal;

  const handleSubmit = async () => {
    if (!clientId || !terrainId) { setError('Client et terrain requis'); return; }
    if (!totalAmount || Number(totalAmount) <= 0) { setError('Montant total requis'); return; }
    if (installments.length < 2) { setError('Minimum 2 échéances'); return; }
    if (Math.abs(difference) > 1) { setError(`La somme des échéances (${fmt(plannedTotal)} XOF) ne correspond pas au total (${fmt(totalAmount)} XOF)`); return; }

    setLoading(true); setError(null);
    try {
      await paymentApi.createPlan({
        clientId,
        terrainId,
        totalAmountXof: Number(totalAmount),
        installments: installments.map(i => ({
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

  const selCls = 'flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-card z-10">
          <div>
            <h2 className="font-display font-semibold flex items-center gap-2">
              <Calendar size={18} className="text-primary" /> Plan de paiement échelonné
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Divisez le paiement en plusieurs échéances</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              <AlertCircle size={14} /> {error}
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
                <span className="flex-1 text-sm font-medium">{selectedClient.first_name} {selectedClient.last_name}</span>
                <button onClick={() => { setSelectedClient(null); setClientId(''); }} className="text-muted-foreground hover:text-foreground"><X size={13} /></button>
              </div>
            ) : (
              <div className="relative">
                <Input placeholder="Rechercher un client…" value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
                {clientResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 bg-card border rounded-lg mt-1 shadow-lg overflow-hidden">
                    {clientResults.map(c => (
                      <button key={c.id} onClick={() => { setSelectedClient(c); setClientId(c.id); setClientSearch(''); setClientResults([]); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/50 border-b last:border-0">
                        <span className="font-medium">{c.first_name} {c.last_name}</span>
                        <span className="text-muted-foreground text-xs">{c.email || c.phone}</span>
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
                <span className="flex-1 text-sm font-medium">{selectedTerrain.title}</span>
                <button onClick={() => { setSelectedTerrain(null); setTerrainId(''); }} className="text-muted-foreground hover:text-foreground"><X size={13} /></button>
              </div>
            ) : (
              <div className="relative">
                <Input placeholder="Rechercher un terrain…" value={terrainSearch} onChange={e => setTerrainSearch(e.target.value)} />
                {terrainResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 bg-card border rounded-lg mt-1 shadow-lg overflow-hidden">
                    {terrainResults.map(t => (
                      <button key={t.id} onClick={() => { setSelectedTerrain(t); setTerrainId(t.id); setTotalAmount(String(t.price)); setTerrainSearch(''); setTerrainResults([]); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/50 border-b last:border-0">
                        <span className="font-mono text-xs text-primary">{t.ref}</span>
                        <span className="flex-1 font-medium">{t.title}</span>
                        <span className="text-muted-foreground text-xs">{fmt(t.price)} XOF</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Amount + nb installments */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Montant total (XOF) *</Label>
              <Input type="number" placeholder="15000000" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} />
              {totalAmount && <p className="text-xs text-muted-foreground">{fmt(totalAmount)} XOF</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Nombre d'échéances</Label>
              <select className={selCls} value={nbInstallments} onChange={e => setNbInstallments(Number(e.target.value))}>
                {[2,3,4,6,8,10,12,18,24].map(n => <option key={n} value={n}>{n} échéances</option>)}
              </select>
            </div>
          </div>

          {/* Provider */}
          <div className="space-y-1.5">
            <Label>Mode de paiement des échéances</Label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'manual',        label: 'Manuel',        icon: '✍️' },
                { key: 'stripe',        label: 'Stripe',        icon: '💳' },
                { key: 'danapay',       label: 'DanaPay',       icon: '📱' },
                { key: 'bank_transfer', label: 'Virement',      icon: '🏦' },
              ].map(p => (
                <button key={p.key} onClick={() => setProvider(p.key)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-xs font-medium transition-all ${
                    provider === p.key ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:bg-muted/30'
                  }`}>
                  <span className="text-lg">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Installments editor */}
          {installments.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Échéancier</Label>
                <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                  Math.abs(difference) <= 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive'
                }`}>
                  Total planifié : {fmt(plannedTotal)} XOF
                  {Math.abs(difference) > 1 && ` (écart : ${difference > 0 ? '+' : ''}${fmt(difference)})`}
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 text-xs font-semibold text-muted-foreground bg-muted/50 px-4 py-2 gap-2">
                  <span className="col-span-1">#</span>
                  <span className="col-span-5">Montant (XOF)</span>
                  <span className="col-span-5">Échéance</span>
                  <span className="col-span-1" />
                </div>

                {installments.map((inst, idx) => (
                  <div key={idx} className="grid grid-cols-12 px-4 py-2 gap-2 items-center border-t">
                    <span className="col-span-1 text-xs font-bold text-muted-foreground">{idx + 1}</span>
                    <div className="col-span-5">
                      <Input
                        type="number"
                        value={inst.amountXof}
                        onChange={e => updateInstallment(idx, 'amountXof', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-5">
                      <Input
                        type="date"
                        value={inst.dueDate}
                        onChange={e => updateInstallment(idx, 'dueDate', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {installments.length > 2 && (
                        <button onClick={() => removeInstallment(idx)}
                          className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" onClick={addInstallment} className="w-full">
                <Plus size={14} /> Ajouter une échéance
              </Button>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes internes (optionnel)</Label>
            <Input placeholder="Conditions particulières, référence contrat…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={onClose}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={loading || Math.abs(difference) > 1}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
              {loading ? 'Création…' : `Créer le plan (${installments.length} échéances)`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
