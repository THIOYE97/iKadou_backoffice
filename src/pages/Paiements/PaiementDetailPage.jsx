import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Loader2, RefreshCcw } from 'lucide-react';
import { paymentsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/ui/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { PAYMENT_STATUS } from '@/Util/statusConfig';
import { readableDate, readableTimestamp } from '@/Util/readableDate';

const fmt = (amount, currency) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'XOF',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const PROVIDER_LABELS = {
  stripe: 'Stripe',
  danapay: 'DanaPay',
  manual: 'Manuel',
  bank_transfer: 'Virement',
};

const METHOD_LABELS = {
  card: 'Carte',
  sepa_debit: 'SEPA',
  mobile_money: 'Mobile Money',
  wave: 'Wave',
  orange_money: 'Orange Money',
  free_money: 'Free Money',
  moov_money: 'Moov Money',
  bank_transfer: 'Virement',
  cash: 'Cash',
  other: 'Autre',
  mtn_momo: 'MTN MoMo',
};

export default function PaiementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [syncMessage, setSyncMessage] = useState(location.state?.creationResult?.message || '');

  const loadPayment = useCallback(async () => {
    try {
      setError(null);
      const res = await paymentsApi.get(id);
      setPayment(res?.data || null);
    } catch (err) {
      setPayment(null);
      setError(err?.response?.data?.message || 'Impossible de charger le paiement');
    }
  }, [id]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        await loadPayment();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [loadPayment]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('');

    try {
      const res = await paymentsApi.sync(id);
      setSyncMessage(res?.message || 'Sync terminée');
      await loadPayment();
    } catch (err) {
      setSyncMessage(err?.response?.data?.message || 'La synchronisation a échoué');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/paiements')}>
          <ArrowLeft size={18} />
          Retour
        </Button>
        <div className="text-center py-16 text-muted-foreground">
          {error || 'Paiement introuvable.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/paiements')}>
          <ArrowLeft size={18} />
        </Button>

        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold">{payment.ref || 'Paiement'}</h1>
          <p className="text-sm text-muted-foreground">
            Créé le {readableDate(payment.created_at)}
          </p>
        </div>

        <StatusBadge map={PAYMENT_STATUS} value={payment.status} />

        <Button variant="outline" onClick={handleSync} disabled={syncing}>
          {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
          Synchroniser
        </Button>
      </div>

      {syncMessage && (
        <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm">
          {syncMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Info label="Client" value={payment.client_name} />
            <Info label="Email client" value={payment.client_email} />
            <Info label="Téléphone client" value={payment.client_phone} />
            <Info label="Terrain" value={payment.terrain_title} />
            <Info label="Réf. terrain" value={payment.terrain_ref} />
            <Info label="Montant" value={fmt(payment.amount, payment.currency)} />
            <Info label="Provider" value={PROVIDER_LABELS[payment.provider] || payment.provider} />
            <Info label="Type méthode" value={METHOD_LABELS[payment.method_type] || payment.method_type} />
            <Info label="Méthode paiement" value={payment.payment_method} />
            <Info label="Provider ref" value={payment.provider_ref} />
            <Info label="Provider status" value={payment.provider_status} />
            <Info
              label="Échéance"
              value={
                payment.installment_total
                  ? `${payment.installment_num || 1} / ${payment.installment_total}`
                  : '—'
              }
            />
            <Info label="Expire le" value={payment.expires_at ? readableTimestamp(payment.expires_at) : '—'} />

            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="font-medium whitespace-pre-wrap">{payment.notes || '—'}</p>
            </div>

            {!!payment.checkout_url && (
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">Lien de paiement</p>
                <a
                  href={payment.checkout_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline break-all"
                >
                  {payment.checkout_url}
                  <ExternalLink size={14} />
                </a>
              </div>
            )}

            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground">Metadata</p>
              <pre className="mt-1 rounded-md bg-muted p-3 text-xs overflow-x-auto">
                {JSON.stringify(payment.metadata || {}, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Résumé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SummaryRow label="Statut" value={<StatusBadge map={PAYMENT_STATUS} value={payment.status} />} />
            <SummaryRow label="Montant" value={fmt(payment.amount, payment.currency)} />
            <SummaryRow label="Provider" value={PROVIDER_LABELS[payment.provider] || payment.provider || '—'} />
            <SummaryRow label="Créé le" value={readableTimestamp(payment.created_at)} />
            <SummaryRow label="Mis à jour" value={readableTimestamp(payment.updated_at)} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Échéances</CardTitle>
        </CardHeader>
        <CardContent>
          {!payment.installments?.length ? (
            <p className="text-sm text-muted-foreground">Aucune échéance</p>
          ) : (
            <div className="space-y-2">
              {payment.installments.map((item) => (
                <div key={item.id} className="rounded-md border px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">Échéance #{item.installment_num}</p>
                      <p className="text-xs text-muted-foreground">
                        Échéance: {readableDate(item.due_date)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">{fmt(item.amount, item.currency)}</p>
                      <StatusBadge map={PAYMENT_STATUS} value={item.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique</CardTitle>
        </CardHeader>
        <CardContent>
          {!payment.history?.length ? (
            <p className="text-sm text-muted-foreground">Aucun historique</p>
          ) : (
            <div className="space-y-2">
              {payment.history.map((h) => (
                <div key={h.id} className="rounded-md border px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">
                      {h.action || 'Action'} · {h.old_status || '—'} → {h.new_status || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {readableTimestamp(h.created_at)}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {h.author || 'Utilisateur'} {h.comment ? `· ${h.comment}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents liés</CardTitle>
        </CardHeader>
        <CardContent>
          {!payment.documents?.length ? (
            <p className="text-sm text-muted-foreground">Aucun document</p>
          ) : (
            <div className="space-y-2">
              {payment.documents.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-medium">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">{doc.type}</p>
                  </div>
                  <Badge variant="outline">{readableDate(doc.created_at)}</Badge>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium break-words">{value || '—'}</p>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-muted-foreground">{label}</p>
      <div className="font-medium text-right">{value || '—'}</div>
    </div>
  );
}