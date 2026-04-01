import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { paymentsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatusBadge from '@/components/ui/StatusBadge';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PAYMENT_STATUS } from '@/Util/statusConfig';
import { readableDate, readableTimestamp } from '@/Util/readableDate';

export default function PaiementDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [status, setStatus] = useState('');
  const [comment, setComment] = useState('');

  const loadPayment = useCallback(async () => {
    try {
      const res = await paymentsApi.get(id);
      const data = res?.data || null;
      setPayment(data);
      setStatus(data?.status || '');
    } catch {
      setPayment(null);
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

  const handleStatusChange = async () => {
    setSavingStatus(true);
    try {
      await paymentsApi.updateStatus(id, {
        status,
        comment: comment || undefined,
      });
      setComment('');
      await loadPayment();
    } finally {
      setSavingStatus(false);
    }
  };

  const fmt = (amount, currency) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'XOF',
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!payment) {
    return <div className="text-center py-16 text-muted-foreground">Paiement introuvable.</div>;
  }

  return (
    <div className="space-y-5 max-w-5xl">
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
      </div>

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
            <Info label="Méthode" value={payment.payment_method} />
            <Info label="Réf. transaction" value={payment.transaction_ref} />
            <div className="md:col-span-2">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="font-medium whitespace-pre-wrap">{payment.notes || '—'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mettre à jour le statut</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmé</option>
              <option value="failed">Échoué</option>
              <option value="refunded">Remboursé</option>
              <option value="partial">Partiel</option>
              <option value="cancelled">Annulé</option>
            </select>

            <Input
              placeholder="Commentaire"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <Button className="w-full" onClick={handleStatusChange} disabled={savingStatus}>
              {savingStatus ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Mettre à jour
            </Button>
          </CardContent>
        </Card>
      </div>

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
                      {h.old_status || '—'} → {h.new_status || '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">{readableTimestamp(h.created_at)}</p>
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
      <p className="font-medium">{value || '—'}</p>
    </div>
  );
}