import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Loader2,
  RefreshCw,
  RotateCcw,
  ExternalLink,
  Copy,
  CheckCircle,
  Tag,
  AlertTriangle,
  FileText,
  Download,
  Sparkles,
  CreditCard,
  Check,
  X,
  Eye,
} from 'lucide-react';
import { paymentApi } from '@/Api/paymentApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/ui/StatusBadge';
import { PAYMENT_STATUS } from '@/Util/statusConfig';
import { readableDate, readableTimestamp } from '@/Util/readableDate';
import PaymentStatusModal from './PaymentStatusModal';
import HistoryTimeline from '@/components/custome/HistoryTimeline';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const fmt = (v, c = 'XOF') =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: c,
    maximumFractionDigits: 0,
  }).format(v);

const PROVIDER_META = {
  stripe: { label: 'Stripe', icon: '💳', color: 'text-blue-600 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20' },
  danapay: { label: 'DanaPay', icon: '📱', color: 'text-orange-600 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20' },
  manual: { label: 'Manuel', icon: '✍️', color: 'text-gray-600 dark:text-white/70', bg: 'bg-gray-50 dark:bg-white/5', border: 'border-gray-200 dark:border-white/10' },
  bank_transfer: { label: 'Virement bancaire', icon: '🏦', color: 'text-violet-600 dark:text-violet-300', bg: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-200 dark:border-violet-500/20' },
};

const METHOD_LABELS = {
  card: 'Carte bancaire',
  sepa_debit: 'SEPA Direct Debit',
  orange_money: 'Orange Money',
  wave: 'Wave',
  free_money: 'Free Money',
  moov_money: 'Moov Money',
  mtn_momo: 'MTN Mobile Money',
  mobile_money: 'Mobile Money',
  bank_transfer: 'Virement',
  cash: 'Espèces',
  other: 'Autre',
};

function InfoCard({ label, value, full = false }) {
  if (!value && value !== 0) return null;

  return (
    <div className={`rounded-2xl border bg-background/60 p-4 ${full ? 'md:col-span-2' : ''}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function StatMini({ label, value }) {
  return (
    <div className="rounded-2xl border bg-background/60 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}

function ProofStatusBadge({ status }) {
  const map = {
    submitted: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20',
    under_review: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20',
    rejected: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${map[status] || 'bg-muted text-muted-foreground border-border'}`}>
      {status || '—'}
    </span>
  );
}

function ProofReviewModal({ proof, action, loading, onClose, onSubmit }) {
  const [reviewNote, setReviewNote] = useState('');

  useEffect(() => {
    setReviewNote('');
  }, [proof?.id, action]);

  if (!proof || !action) return null;

  const isReject = action === 'rejected';
  const title = isReject ? 'Rejeter la preuve' : action === 'approved' ? 'Valider la preuve' : 'Mettre en revue';
  const buttonLabel = isReject ? 'Confirmer le rejet' : action === 'approved' ? 'Confirmer la validation' : 'Confirmer';
  const buttonClass = isReject ? 'bg-destructive text-white hover:bg-destructive/90' : 'bg-emerald-600 text-white hover:bg-emerald-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-[28px] border bg-card p-5 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isReject ? 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'}`}>
            {isReject ? <X size={18} /> : <Check size={18} />}
          </div>
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">
              Soumise le {readableTimestamp(proof.submitted_at)}
            </p>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border bg-muted/30 p-4">
          <p className="text-sm font-medium">Preuve #{proof.id?.slice?.(0, 8) || '—'}</p>
          {proof.note ? (
            <p className="mt-2 text-sm text-muted-foreground">{proof.note}</p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Aucune note client.</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            {isReject ? 'Motif de rejet *' : 'Commentaire interne (optionnel)'}
          </label>
          <textarea
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
            placeholder={isReject ? 'Expliquez pourquoi la preuve est rejetée…' : 'Ajoutez une note interne…'}
            className="min-h-[110px] w-full rounded-2xl border bg-background px-4 py-3 text-sm outline-none ring-0 transition focus:border-primary"
          />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="outline" className="rounded-2xl" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            className={`rounded-2xl ${buttonClass}`}
            disabled={loading || (isReject && !reviewNote.trim())}
            onClick={() => onSubmit(reviewNote)}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {buttonLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('detail');
  const [syncMsg, setSyncMsg] = useState(null);

  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewAction, setReviewAction] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await paymentApi.get(id);
      setPayment(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const r = await paymentApi.sync(id);
      setSyncMsg(r.synced ? `Statut mis à jour → ${r.data.status}` : 'Déjà à jour');
      await load();
    } catch {
      setSyncMsg('Erreur de synchronisation');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 3000);
    }
  };

  const handleRefund = async () => {
    setRefunding(true);
    try {
      await paymentApi.refund(id, { reason: 'Remboursement demandé' });
      setShowRefund(false);
      await load();
    } catch {}
    finally {
      setRefunding(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(payment?.checkout_url || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openProofReview = (proof, action) => {
    setReviewTarget(proof);
    setReviewAction(action);
  };

  const closeProofReview = () => {
    setReviewTarget(null);
    setReviewAction(null);
  };

  const submitProofReview = async (reviewNote) => {
    if (!reviewTarget || !reviewAction) return;

    setReviewLoading(true);
    try {
      await paymentApi.reviewProof(reviewTarget.id, {
        status: reviewAction,
        reviewNote: reviewNote?.trim() || undefined,
      });
      closeProofReview();
      await load();
      setActiveTab('proofs');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] py-16 text-center text-muted-foreground shadow-sm">
        Paiement introuvable.
      </div>
    );
  }

  const provider = PROVIDER_META[payment.provider] || PROVIDER_META.manual;
  const canSync = ['stripe', 'danapay'].includes(payment.provider) && payment.provider_ref && payment.status === 'pending';
  const canRefund = payment.status === 'confirmed' && payment.provider_ref;
  const canStatus = ['pending', 'confirmed', 'failed', 'partial', 'cancelled'].includes(payment.status);

  const TABS = [
    { key: 'detail', label: 'Détail' },
    { key: 'history', label: `Historique (${payment.history?.length || 0})` },
    ...(payment.installments?.length ? [{ key: 'installments', label: `Échéances (${payment.installments.length})` }] : []),
    ...(payment.proofs?.length ? [{ key: 'proofs', label: `Preuves (${payment.proofs.length})` }] : []),
    ...(payment.documents?.length ? [{ key: 'documents', label: `Documents (${payment.documents.length})` }] : []),
  ];

  return (
    <div className="max-w-6xl space-y-6">
      <section className="relative overflow-hidden rounded-[32px] border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,107,0,0.12),transparent_30%),linear-gradient(135deg,hsl(var(--card)),hsl(var(--surface-1)))] p-6 shadow-sm md:p-8">
        <div className="absolute right-4 top-4 hidden rounded-full border border-white/20 bg-white/10 p-3 backdrop-blur md:flex dark:border-white/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <CreditCard className="h-3.5 w-3.5" />
              Fiche paiement
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              {payment.ref}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {payment.client_name || '—'} · {payment.terrain_title || '—'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge map={PAYMENT_STATUS} value={payment.status} />

            {canSync ? (
              <Button variant="outline" size="sm" className="rounded-xl" onClick={handleSync} disabled={syncing}>
                <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Sync…' : 'Synchroniser'}
              </Button>
            ) : null}

            {canStatus ? (
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowStatus(true)}>
                <Tag size={14} />
                Changer statut
              </Button>
            ) : null}

            {canRefund ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => setShowRefund(true)}
              >
                <RotateCcw size={14} />
                Rembourser
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {syncMsg ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle size={14} />
          {syncMsg}
        </div>
      ) : null}

      <section className="rounded-[28px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] p-2 shadow-sm">
        <div className="flex gap-1 overflow-x-auto scrollbar-thin">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                activeTab === t.key
                  ? 'bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(var(--primary-deep)))] text-white shadow-[0_12px_24px_hsl(var(--primary)/0.18)]'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'detail' ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="space-y-4 xl:col-span-2">
            <div className={`flex items-center gap-4 rounded-[24px] border p-4 ${provider.bg} ${provider.border}`}>
              <span className="text-3xl">{provider.icon}</span>
              <div className="flex-1">
                <p className={`font-semibold ${provider.color}`}>{provider.label}</p>
                <p className="text-sm text-muted-foreground">
                  {METHOD_LABELS[payment.method_type] || payment.method_type}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${provider.color}`}>{fmt(payment.amount, payment.currency)}</p>
                <p className="text-xs text-muted-foreground">{payment.currency}</p>
              </div>
            </div>

            <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="text-lg font-semibold tracking-tight">
                  Informations du paiement
                </CardTitle>
              </CardHeader>

              <CardContent className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
                <InfoCard label="Référence interne" value={payment.ref} />
                <InfoCard label="Montant" value={fmt(payment.amount, payment.currency)} />
                <InfoCard label="Client" value={payment.client_name} />
                <InfoCard label="Email client" value={payment.client_email} />
                <InfoCard label="Téléphone" value={payment.client_phone} />
                <InfoCard label="Terrain" value={payment.terrain_title} />
                <InfoCard label="Réf. terrain" value={payment.terrain_ref} />
                <InfoCard label="Statut preuve" value={payment.latest_proof_status || payment.proof_status} />
                {payment.provider_ref ? (
                  <InfoCard label="Réf. provider" value={<span className="break-all font-mono text-xs">{payment.provider_ref}</span>} />
                ) : null}
                {payment.provider_status ? (
                  <InfoCard label="Statut provider" value={payment.provider_status} />
                ) : null}
                {payment.notes ? <InfoCard label="Notes" value={payment.notes} full /> : null}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {payment.checkout_url ? (
              <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
                <CardHeader className="border-b border-border/60 pb-4">
                  <CardTitle className="text-sm">Lien de paiement</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3 p-5">
                  {payment.expires_at ? (
                    new Date(payment.expires_at) > new Date() ? (
                      <Badge variant="success">✓ Actif</Badge>
                    ) : (
                      <Badge variant="outline">Expiré</Badge>
                    )
                  ) : null}

                  <div className="flex flex-col gap-1.5">
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {payment.checkout_url?.substring(0, 45)}…
                    </p>

                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="flex-1 rounded-xl" onClick={copyUrl}>
                        {copied ? <CheckCircle size={13} className="text-emerald-600" /> : <Copy size={13} />}
                        {copied ? 'Copié !' : 'Copier'}
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl" onClick={() => window.open(payment.checkout_url, '_blank')}>
                        <ExternalLink size={13} />
                      </Button>
                    </div>
                  </div>

                  {payment.expires_at ? (
                    <p className="text-xs text-muted-foreground">
                      ⏱ {new Date(payment.expires_at) > new Date() ? 'Expire' : 'Expiré'} le {readableDate(payment.expires_at)}
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
              <CardContent className="space-y-4 p-5">
                <StatMini label="Créé le" value={readableDate(payment.created_at)} />
                <StatMini label="Modifié" value={readableTimestamp(payment.updated_at)} />
                {payment.installment_total > 1 ? (
                  <StatMini label="Plan échelonné" value={`Échéance ${payment.installment_num} / ${payment.installment_total}`} />
                ) : null}
              </CardContent>
            </Card>

            <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="text-sm">Actions rapides</CardTitle>
              </CardHeader>

              <CardContent className="space-y-2 p-5">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start rounded-xl"
                  onClick={() => navigate(`/clients/${payment.client_id}`)}
                >
                  <ExternalLink size={13} />
                  Voir le client
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start rounded-xl"
                  onClick={() => navigate(`/terrains/${payment.terrain_id}`)}
                >
                  <ExternalLink size={13} />
                  Voir le terrain
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {activeTab === 'history' ? (
        <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Historique des événements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <HistoryTimeline entries={payment.history || []} emptyText="Aucun historique pour ce paiement." />
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'installments' ? (
        <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold tracking-tight">
                Plan de paiement
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Total : <span className="font-semibold text-foreground">{fmt(payment.amount, payment.currency)}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-5">
            <div className="overflow-hidden rounded-2xl border">
              {payment.installments?.map((inst, i) => {
                const isPast = new Date(inst.due_date) < new Date();
                const isLate = isPast && inst.status === 'pending';

                return (
                  <div
                    key={inst.id}
                    className={`flex items-center gap-4 border-b px-4 py-4 last:border-0 ${
                      isLate ? 'bg-destructive/5' : i % 2 === 0 ? 'bg-muted/20' : ''
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                        inst.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : isLate
                          ? 'bg-destructive/20 text-destructive'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {inst.installment_num}
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-semibold">{fmt(inst.amount, inst.currency)}</p>
                      <p className={`text-xs ${isLate ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>
                        {isLate ? '⚠ En retard — ' : ''}Échéance : {readableDate(inst.due_date)}
                      </p>
                    </div>

                    <StatusBadge map={PAYMENT_STATUS} value={inst.status} />

                    {inst.paid_at ? (
                      <span className="text-xs text-muted-foreground">
                        Payé le {readableDate(inst.paid_at)}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'proofs' ? (
        <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Preuves de paiement client
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 p-5">
            {payment.proofs?.map((proof) => (
              <div key={proof.id} className="rounded-2xl border bg-background/60 p-4">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">
                        Soumise le {readableTimestamp(proof.submitted_at)}
                      </p>
                      <ProofStatusBadge status={proof.status} />
                    </div>

                    {proof.reviewed_at ? (
                      <p className="text-xs text-muted-foreground">
                        Revue le {readableTimestamp(proof.reviewed_at)}
                        {proof.reviewed_by_name ? ` par ${proof.reviewed_by_name}` : ''}
                      </p>
                    ) : null}

                    {proof.note ? (
                      <div className="rounded-xl border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                        {proof.note}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {proof.status !== 'approved' ? (
                      <Button
                        size="sm"
                        className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => openProofReview(proof, 'approved')}
                      >
                        <Check size={14} />
                        Valider la preuve
                      </Button>
                    ) : null}

                    {proof.status !== 'rejected' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl border-destructive text-destructive hover:bg-destructive/10"
                        onClick={() => openProofReview(proof, 'rejected')}
                      >
                        <X size={14} />
                        Rejeter la preuve
                      </Button>
                    ) : null}

                    {proof.status !== 'under_review' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => openProofReview(proof, 'under_review')}
                      >
                        <Eye size={14} />
                        Mettre en revue
                      </Button>
                    ) : null}
                  </div>
                </div>

                {proof.files?.length ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {proof.files.map((file) => {
                      const isImage =
                        String(file.file_type || file.mime_type || '').startsWith('image/');
                      const fileUrl = file.file_url || `${BACKEND}${file.url || ''}`;

                      return (
                        <a
                          key={file.id}
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="group overflow-hidden rounded-2xl border bg-card hover:border-primary/40"
                        >
                          <div className="aspect-[4/3] bg-muted">
                            {isImage ? (
                              <img
                                src={fileUrl}
                                alt="Preuve de paiement"
                                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-3 px-3 py-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {file.file_type || file.mime_type || 'Fichier'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {readableDate(file.created_at)}
                              </p>
                            </div>

                            <div className="flex shrink-0 items-center gap-1 text-xs text-primary">
                              <ExternalLink size={12} />
                              Ouvrir
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">Aucun fichier joint.</p>
                )}
              </div>
            ))}

            {!payment.proofs?.length ? (
              <div className="rounded-2xl border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
                Aucune preuve soumise pour ce paiement.
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === 'documents' ? (
        <Card className="overflow-hidden rounded-[30px] border bg-[linear-gradient(180deg,hsl(var(--card)),hsl(var(--surface-1)))] shadow-sm">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-lg font-semibold tracking-tight">
              Documents liés
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-2">
              {payment.documents?.map((d) => (
                <div key={d.id} className="flex items-center gap-3 border-b py-3 last:border-0">
                  <FileText size={16} className="shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{readableDate(d.created_at)}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs capitalize">
                    {d.type?.replace('_', ' ')}
                  </Badge>
                  <a
                    href={`${BACKEND}${d.url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Download size={12} />
                    Ouvrir
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {showStatus ? (
        <PaymentStatusModal
          payment={payment}
          onClose={() => setShowStatus(false)}
          onSuccess={() => {
            setShowStatus(false);
            load();
          }}
        />
      ) : null}

      {showRefund ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm animate-fade-in rounded-[28px] border bg-card p-5 shadow-xl">
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
              <AlertTriangle size={18} className="shrink-0" />
              <div>
                <p className="text-sm font-semibold">Confirmer le remboursement</p>
                <p className="mt-0.5 text-xs">Cette action est irréversible via {payment.provider}.</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-muted/50 px-4 py-3 text-sm">
              <p className="text-xs text-muted-foreground">Montant à rembourser</p>
              <p className="mt-0.5 text-xl font-bold text-primary">{fmt(payment.amount, payment.currency)}</p>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" className="rounded-2xl" onClick={() => setShowRefund(false)}>
                Annuler
              </Button>
              <Button variant="destructive" className="rounded-2xl" onClick={handleRefund} disabled={refunding}>
                {refunding ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                {refunding ? 'Remboursement…' : 'Confirmer'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {reviewTarget && reviewAction ? (
        <ProofReviewModal
          proof={reviewTarget}
          action={reviewAction}
          loading={reviewLoading}
          onClose={closeProofReview}
          onSubmit={submitProofReview}
        />
      ) : null}
    </div>
  );
}