import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2, RefreshCw, RotateCcw, ExternalLink, Copy,
  CheckCircle, Tag, Calendar, CreditCard, Smartphone,
  AlertTriangle, FileText, Download,
} from 'lucide-react';
import { paymentApi } from '@/Api/paymentApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/ui/StatusBadge';
import PageHeader from '@/components/custome/PageHeader';
import InfoGrid from '@/components/custome/InfoGrid';
import HistoryTimeline from '@/components/custome/HistoryTimeline';
import { PAYMENT_STATUS } from '@/Util/statusConfig';
import { readableDate, readableTimestamp } from '@/Util/readableDate';
import PaymentStatusModal from './PaymentStatusModal';
import CreatePaymentModal from './CreatePaymentModal';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const fmt = (v, c = 'XOF') =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(v);

const PROVIDER_META = {
  stripe:        { label: 'Stripe',        icon: '💳', color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200' },
  danapay:       { label: 'DanaPay',        icon: '📱', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  manual:        { label: 'Manuel',         icon: '✍️', color: 'text-gray-600',   bg: 'bg-gray-50',   border: 'border-gray-200' },
  bank_transfer: { label: 'Virement bancaire', icon: '🏦', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
};

const METHOD_LABELS = {
  card: 'Carte bancaire', sepa_debit: 'SEPA Direct Debit',
  orange_money: 'Orange Money', wave: 'Wave', free_money: 'Free Money',
  moov_money: 'Moov Money', mtn_momo: 'MTN Mobile Money',
  mobile_money: 'Mobile Money', bank_transfer: 'Virement', cash: 'Espèces', other: 'Autre',
};

export default function PaymentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [syncing, setSyncing]         = useState(false);
  const [showStatus, setShowStatus]   = useState(false);
  const [showRefund, setShowRefund]   = useState(false);
  const [refunding, setRefunding]     = useState(false);
  const [copied, setCopied]           = useState(false);
  const [activeTab, setActiveTab]     = useState('detail');
  const [syncMsg, setSyncMsg]         = useState(null);

  const load = async () => {
    setLoading(true);
    try { const r = await paymentApi.get(id); setPayment(r.data); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const handleSync = async () => {
    setSyncing(true); setSyncMsg(null);
    try {
      const r = await paymentApi.sync(id);
      setSyncMsg(r.synced ? `Statut mis à jour → ${r.data.status}` : 'Déjà à jour');
      await load();
    } catch { setSyncMsg('Erreur de synchronisation'); }
    finally { setSyncing(false); setTimeout(() => setSyncMsg(null), 3000); }
  };

  const handleRefund = async () => {
    setRefunding(true);
    try {
      await paymentApi.refund(id, { reason: 'Remboursement demandé' });
      setShowRefund(false);
      await load();
    } catch {} finally { setRefunding(false); }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(payment?.checkout_url || '');
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="animate-spin text-primary" />
    </div>
  );
  if (!payment) return <div className="text-center py-16 text-muted-foreground">Paiement introuvable.</div>;

  const provider = PROVIDER_META[payment.provider] || PROVIDER_META.manual;
  const canSync   = ['stripe','danapay'].includes(payment.provider) && payment.provider_ref && payment.status === 'pending';
  const canRefund = payment.status === 'confirmed' && payment.provider_ref;
  const canStatus = ['pending','confirmed','failed','partial','cancelled'].includes(payment.status);

  const TABS = [
    { key: 'detail',       label: 'Détail' },
    { key: 'history',      label: `Historique (${payment.history?.length || 0})` },
    ...(payment.installments?.length ? [{ key: 'installments', label: `Échéances (${payment.installments.length})` }] : []),
    ...(payment.documents?.length    ? [{ key: 'documents',    label: `Documents (${payment.documents.length})` }] : []),
  ];

  return (
    <div className="space-y-5 max-w-4xl">

      {/* ── Header ─── */}
      <PageHeader
        title={payment.ref}
        subtitle={`${payment.client_name || '—'} · ${payment.terrain_title || '—'}`}
        backTo="/paiements"
      >
        <StatusBadge map={PAYMENT_STATUS} value={payment.status} />

        {canSync && (
          <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Sync…' : 'Synchroniser'}
          </Button>
        )}

        {canStatus && (
          <Button variant="outline" size="sm" onClick={() => setShowStatus(true)}>
            <Tag size={14} /> Changer statut
          </Button>
        )}

        {canRefund && (
          <Button variant="outline" size="sm" onClick={() => setShowRefund(true)}
            className="border-destructive text-destructive hover:bg-destructive/10">
            <RotateCcw size={14} /> Rembourser
          </Button>
        )}
      </PageHeader>

      {/* Sync feedback */}
      {syncMsg && (
        <div className="flex items-center gap-2 text-sm bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-2">
          <CheckCircle size={14} /> {syncMsg}
        </div>
      )}

      {/* ── Tabs ─── */}
      <div className="flex border-b gap-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════ TAB: DETAIL ══════════════ */}
      {activeTab === 'detail' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Left — main info */}
          <div className="md:col-span-2 space-y-4">

            {/* Provider banner */}
            <div className={`flex items-center gap-4 p-4 rounded-xl border ${provider.bg} ${provider.border}`}>
              <span className="text-3xl">{provider.icon}</span>
              <div className="flex-1">
                <p className={`font-semibold ${provider.color}`}>{provider.label}</p>
                <p className="text-sm text-muted-foreground">{METHOD_LABELS[payment.method_type] || payment.method_type}</p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-display font-bold ${provider.color}`}>{fmt(payment.amount, payment.currency)}</p>
                <p className="text-xs text-muted-foreground">{payment.currency}</p>
              </div>
            </div>

            {/* Core details */}
            <Card>
              <CardHeader><CardTitle className="text-base">Informations du paiement</CardTitle></CardHeader>
              <CardContent>
                <InfoGrid items={[
                  { label: 'Référence interne',  value: payment.ref },
                  { label: 'Montant',            value: fmt(payment.amount, payment.currency) },
                  { label: 'Client',             value: payment.client_name },
                  { label: 'Email client',       value: payment.client_email },
                  { label: 'Téléphone',          value: payment.client_phone },
                  { label: 'Terrain',            value: payment.terrain_title },
                  { label: 'Réf. terrain',       value: payment.terrain_ref },
                  payment.provider_ref && { label: 'Réf. provider',    value: <span className="font-mono text-xs break-all">{payment.provider_ref}</span> },
                  payment.provider_status && { label: 'Statut provider', value: payment.provider_status },
                  payment.notes && { label: 'Notes',              value: payment.notes, full: true },
                ].filter(Boolean)} />
              </CardContent>
            </Card>
          </div>

          {/* Right — sidebar */}
          <div className="space-y-4">

            {/* Checkout link */}
            {payment.checkout_url && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Lien de paiement</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {payment.expires_at ? (
                    new Date(payment.expires_at) > new Date()
                      ? <Badge variant="success">✓ Actif</Badge>
                      : <Badge variant="outline">Expiré</Badge>
                  ) : null}

                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-mono text-muted-foreground truncate">{payment.checkout_url?.substring(0, 45)}…</p>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="flex-1" onClick={copyUrl}>
                        {copied ? <CheckCircle size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        {copied ? 'Copié !' : 'Copier'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => window.open(payment.checkout_url, '_blank')}>
                        <ExternalLink size={13} />
                      </Button>
                    </div>
                  </div>

                  {payment.expires_at && (
                    <p className="text-xs text-muted-foreground">
                      ⏱ {new Date(payment.expires_at) > new Date() ? 'Expire' : 'Expiré'} le {readableDate(payment.expires_at)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Dates */}
            <Card>
              <CardContent className="pt-5 space-y-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Créé le</p><p className="font-medium">{readableDate(payment.created_at)}</p></div>
                <div><p className="text-xs text-muted-foreground">Modifié</p><p>{readableTimestamp(payment.updated_at)}</p></div>
                {payment.installment_total > 1 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Plan échelonné</p>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-primary" />
                      <span className="text-sm font-medium">
                        Échéance {payment.installment_num} / {payment.installment_total}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Actions rapides</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigate(`/clients/${payment.client_id}`)}>
                  <ExternalLink size={13} /> Voir le client
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigate(`/terrains/${payment.terrain_id}`)}>
                  <ExternalLink size={13} /> Voir le terrain
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ══════════════ TAB: HISTORY ══════════════ */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Historique des événements</CardTitle></CardHeader>
          <CardContent>
            <HistoryTimeline entries={payment.history || []} emptyText="Aucun historique pour ce paiement." />
          </CardContent>
        </Card>
      )}

      {/* ══════════════ TAB: INSTALLMENTS ══════════════ */}
      {activeTab === 'installments' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Plan de paiement</CardTitle>
              <div className="text-sm text-muted-foreground">
                Total : <span className="font-semibold text-foreground">{fmt(payment.amount, payment.currency)}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0 overflow-hidden rounded-xl border">
              {payment.installments?.map((inst, i) => {
                const isPast = new Date(inst.due_date) < new Date();
                const isLate = isPast && inst.status === 'pending';
                return (
                  <div key={inst.id} className={`flex items-center gap-4 px-4 py-3 border-b last:border-0 ${isLate ? 'bg-destructive/5' : i % 2 === 0 ? 'bg-muted/20' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      inst.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                      isLate ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'
                    }`}>
                      {inst.installment_num}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{fmt(inst.amount, inst.currency)}</p>
                      <p className={`text-xs ${isLate ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                        {isLate ? '⚠ En retard — ' : ''}Échéance : {readableDate(inst.due_date)}
                      </p>
                    </div>
                    <StatusBadge map={PAYMENT_STATUS} value={inst.status} />
                    {inst.paid_at && <span className="text-xs text-muted-foreground">Payé le {readableDate(inst.paid_at)}</span>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════ TAB: DOCUMENTS ══════════════ */}
      {activeTab === 'documents' && (
        <Card>
          <CardHeader><CardTitle className="text-base">Documents liés</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {payment.documents?.map(d => (
                <div key={d.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <FileText size={16} className="text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{readableDate(d.created_at)}</p>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize flex-shrink-0">{d.type?.replace('_', ' ')}</Badge>
                  <a href={`${BACKEND}${d.url}`} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline flex-shrink-0">
                    <Download size={12} /> Ouvrir
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Modals ─── */}
      {showStatus && (
        <PaymentStatusModal
          payment={payment}
          onClose={() => setShowStatus(false)}
          onSuccess={() => { setShowStatus(false); load(); }}
        />
      )}

      {showRefund && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm p-5 space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertTriangle size={18} className="flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Confirmer le remboursement</p>
                <p className="text-xs mt-0.5">Cette action est irréversible via {payment.provider}.</p>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm">
              <p className="text-muted-foreground text-xs">Montant à rembourser</p>
              <p className="font-display text-xl font-bold text-primary mt-0.5">{fmt(payment.amount, payment.currency)}</p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowRefund(false)}>Annuler</Button>
              <Button variant="destructive" onClick={handleRefund} disabled={refunding}>
                {refunding ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                {refunding ? 'Remboursement…' : 'Confirmer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
