import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Loader2,
  ExternalLink,
  CreditCard,
  Landmark,
  Smartphone,
  User,
  MapPinned,
  BadgeCent,
  FileText,
  ShieldCheck,
  TriangleAlert,
  Sparkles,
  CheckCircle2,
  Receipt,
} from 'lucide-react';
import { paymentsApi, clientsApi, terrainsApi } from '@/Api/resourceApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  clientId: z.string().min(1, 'Client requis'),
  terrainId: z.string().min(1, 'Terrain requis'),
  amountXof: z.coerce.number().positive('Montant invalide'),
  providerAction: z.enum(['stripe_checkout', 'stripe_intent', 'danapay_transfer', 'danapay_link']),
  currency: z.enum(['eur', 'usd']).default('eur'),
  operator: z.enum(['orange_money', 'wave', 'free_money', 'moov_money', 'mtn_momo']).optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

const ACTION_META = {
  stripe_checkout: { label: 'Stripe Checkout', icon: CreditCard },
  stripe_intent: { label: 'Stripe Intent', icon: CreditCard },
  danapay_transfer: { label: 'DanaPay Transfer', icon: Smartphone },
  danapay_link: { label: 'DanaPay Link', icon: Landmark },
};

const OPERATOR_LABELS = {
  orange_money: 'Orange Money',
  wave: 'Wave',
  free_money: 'Free Money',
  moov_money: 'Moov Money',
  mtn_momo: 'MTN MoMo',
};

const fmtAmount = (amount) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));

const makeFakePaymentResult = ({ values, selectedClient, selectedTerrain }) => {
  const ts = Date.now();
  const short = String(ts).slice(-6);

  const paymentId = `mock-payment-${ts}`;
  const paymentRef = `PAY-${short}`;

  if (values.providerAction === 'stripe_checkout') {
    return {
      paymentId,
      paymentRef,
      checkoutUrl: '#',
      sessionId: `cs_test_mock_${short}`,
      amountCents: Math.round(Number(values.amountXof || 0) / 655.957 * 100),
      currency: values.currency || 'eur',
      amountXof: Number(values.amountXof || 0),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      message: 'Paiement simulé côté frontend — backend non connecté.',
      mocked: true,
      providerLabel: 'Stripe Checkout',
      clientName: selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : '—',
      terrainTitle: selectedTerrain?.title || selectedTerrain?.ref || '—',
    };
  }

  if (values.providerAction === 'stripe_intent') {
    return {
      paymentId,
      paymentRef,
      clientSecret: `pi_mock_secret_${short}`,
      paymentIntentId: `pi_mock_${short}`,
      amountCents: Math.round(Number(values.amountXof || 0) / 655.957 * 100),
      currency: values.currency || 'eur',
      amountXof: Number(values.amountXof || 0),
      message: 'Intent simulé côté frontend — backend non connecté.',
      mocked: true,
      providerLabel: 'Stripe Intent',
      clientName: selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : '—',
      terrainTitle: selectedTerrain?.title || selectedTerrain?.ref || '—',
    };
  }

  if (values.providerAction === 'danapay_transfer') {
    return {
      paymentId,
      paymentRef,
      transferId: `dp_transfer_mock_${short}`,
      checkoutUrl: '#',
      status: 'pending',
      operator: values.operator,
      amountXof: Number(values.amountXof || 0),
      message: `Demande simulée sur ${OPERATOR_LABELS[values.operator] || values.operator} — backend non connecté.`,
      mocked: true,
      providerLabel: 'DanaPay Transfer',
      phone: values.phone || selectedClient?.phone || '',
      clientName: selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : '—',
      terrainTitle: selectedTerrain?.title || selectedTerrain?.ref || '—',
    };
  }

  return {
    paymentId,
    paymentRef,
    checkoutUrl: '#',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    amountXof: Number(values.amountXof || 0),
    message: 'Lien DanaPay simulé côté frontend — backend non connecté.',
    mocked: true,
    providerLabel: 'DanaPay Link',
    clientName: selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : '—',
    terrainTitle: selectedTerrain?.title || selectedTerrain?.ref || '—',
  };
};

function Field({ icon: Icon, label, children, error }) {
  return (
    <div className="space-y-1.5">
      <Label className="inline-flex items-center gap-2">
        {Icon ? <Icon size={14} className="text-muted-foreground" /> : null}
        <span>{label}</span>
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export default function PaiementFormModal({ onClose, onSuccess }) {
  const [serverError, setServerError] = useState(null);
  const [clients, setClients] = useState([]);
  const [terrains, setTerrains] = useState([]);
  const [result, setResult] = useState(null);
  const [isMocked, setIsMocked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      clientId: '',
      terrainId: '',
      amountXof: '',
      providerAction: 'stripe_checkout',
      currency: 'eur',
      operator: 'wave',
      phone: '',
      notes: '',
    },
  });

  const providerAction = watch('providerAction');
  const selectedClientId = watch('clientId');
  const selectedTerrainId = watch('terrainId');
  const ActionIcon = ACTION_META[providerAction]?.icon || CreditCard;

  useEffect(() => {
    clientsApi.list({ page: 1, limit: 100 }).then((r) => setClients(r?.data || [])).catch(() => {});
    terrainsApi.list({ page: 1, limit: 100 }).then((r) => setTerrains(r?.data || [])).catch(() => {});
  }, []);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  const selectedTerrain = useMemo(
    () => terrains.find((t) => t.id === selectedTerrainId),
    [terrains, selectedTerrainId]
  );

  const handleCloseAfterConfirmation = () => {
    onSuccess?.(result);
    onClose?.();
  };

  const handleCreateAnother = () => {
    setServerError(null);
    setResult(null);
    setIsMocked(false);
    setIsCompleted(false);
    reset({
      clientId: '',
      terrainId: '',
      amountXof: '',
      providerAction: 'stripe_checkout',
      currency: 'eur',
      operator: 'wave',
      phone: '',
      notes: '',
    });
  };

  const onSubmit = async (values) => {
    setServerError(null);
    setResult(null);
    setIsMocked(false);
    setIsCompleted(false);

    const payloadBase = {
      clientId: values.clientId,
      terrainId: values.terrainId,
      amountXof: Number(values.amountXof),
      notes: values.notes || null,
    };

    try {
      let res;

      switch (values.providerAction) {
        case 'stripe_intent':
          res = await paymentsApi.createStripeIntent({
            ...payloadBase,
            currency: values.currency || 'eur',
          });
          break;

        case 'stripe_checkout':
          res = await paymentsApi.createStripeCheckout({
            ...payloadBase,
            currency: values.currency || 'eur',
          });
          break;

        case 'danapay_transfer':
          res = await paymentsApi.createDanaPayTransfer({
            ...payloadBase,
            operator: values.operator,
            phone: values.phone || selectedClient?.phone || '',
          });
          break;

        case 'danapay_link':
          res = await paymentsApi.createDanaPayLink(payloadBase);
          break;

        default:
          throw new Error('Action non supportée');
      }

      const finalData = {
        ...(res?.data || {}),
        providerLabel: ACTION_META[values.providerAction]?.label,
        clientName: selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : '—',
        terrainTitle: selectedTerrain?.title || selectedTerrain?.ref || '—',
      };

      setResult(finalData);
      setIsMocked(false);
      setIsCompleted(true);
    } catch (err) {
      const fallbackData = makeFakePaymentResult({
        values,
        selectedClient,
        selectedTerrain,
      });

      setServerError(
        err?.response?.data?.message ||
          err?.message ||
          'Backend indisponible — succès simulé côté frontend.'
      );
      setResult(fallbackData);
      setIsMocked(true);
      setIsCompleted(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-y-auto border">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-card">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              {isCompleted ? <CheckCircle2 size={18} /> : <ActionIcon size={18} />}
            </span>
            <div>
              <h2 className="font-display font-semibold">
                {isCompleted ? 'Confirmation du paiement' : 'Nouveau paiement'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isCompleted
                  ? isMocked
                    ? 'Simulation frontend active'
                    : 'Opération traitée'
                  : ACTION_META[providerAction]?.label || 'Paiement'}
              </p>
            </div>
          </div>

          <button onClick={onClose}>
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {!isCompleted ? (
          <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field icon={User} label="Client *" error={errors.clientId?.message}>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  {...register('clientId')}
                >
                  <option value="">— Sélectionner —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field icon={MapPinned} label="Terrain *" error={errors.terrainId?.message}>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  {...register('terrainId')}
                >
                  <option value="">— Sélectionner —</option>
                  {terrains.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title || t.ref || t.id}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field icon={BadgeCent} label="Montant (XOF) *" error={errors.amountXof?.message}>
                <Input type="number" placeholder="1000000" {...register('amountXof')} />
              </Field>

              <Field icon={Sparkles} label="Type d’action *">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  {...register('providerAction')}
                >
                  <option value="stripe_checkout">Stripe Checkout</option>
                  <option value="stripe_intent">Stripe Intent</option>
                  <option value="danapay_transfer">DanaPay Transfer</option>
                  <option value="danapay_link">DanaPay Link</option>
                </select>
              </Field>
            </div>

            {(providerAction === 'stripe_checkout' || providerAction === 'stripe_intent') && (
              <Field icon={CreditCard} label="Devise cible Stripe">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  {...register('currency')}
                >
                  <option value="eur">EUR</option>
                  <option value="usd">USD</option>
                </select>
              </Field>
            )}

            {providerAction === 'danapay_transfer' && (
              <div className="grid grid-cols-2 gap-3">
                <Field icon={Smartphone} label="Opérateur *">
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    {...register('operator')}
                  >
                    <option value="orange_money">Orange Money</option>
                    <option value="wave">Wave</option>
                    <option value="free_money">Free Money</option>
                    <option value="moov_money">Moov Money</option>
                    <option value="mtn_momo">MTN MoMo</option>
                  </select>
                </Field>

                <Field icon={Smartphone} label="Téléphone">
                  <Input
                    placeholder={selectedClient?.phone || 'Numéro client'}
                    {...register('phone')}
                  />
                </Field>
              </div>
            )}

            <Field icon={FileText} label="Notes">
              <textarea
                className="min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                {...register('notes')}
              />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {isSubmitting ? 'Traitement…' : 'Créer'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="p-5 space-y-4">
            {isMocked ? (
              <div className="rounded-md px-3 py-2 text-sm bg-amber-500/10 text-amber-700 border border-amber-200 dark:text-amber-300 dark:border-amber-900/40">
                <div className="flex items-start gap-2">
                  <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Succès simulé côté frontend</p>
                    <p>{serverError || 'Le backend n’a pas validé l’opération, mais la simulation continue pour la démo.'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md px-3 py-2 text-sm bg-emerald-500/10 text-emerald-700 border border-emerald-200 dark:text-emerald-300 dark:border-emerald-900/40">
                <div className="flex items-start gap-2">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Paiement traité avec succès</p>
                    <p>{result?.message || 'Opération terminée.'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-primary" />
                <p className="font-medium">Récapitulatif</p>
              </div>

              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Référence</p>
                  <p className="font-medium">{result?.paymentRef || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Montant</p>
                  <p className="font-medium">{fmtAmount(result?.amountXof)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Client</p>
                  <p className="font-medium">{result?.clientName || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Terrain</p>
                  <p className="font-medium">{result?.terrainTitle || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">{result?.providerLabel || '—'}</p>
                </div>
                {result?.operator ? (
                  <div>
                    <p className="text-muted-foreground">Opérateur</p>
                    <p className="font-medium">{OPERATOR_LABELS[result.operator] || result.operator}</p>
                  </div>
                ) : null}
              </div>

              {result?.checkoutUrl && (
                <a
                  href={result.checkoutUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink size={14} />
                  Ouvrir le lien de paiement
                </a>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleCreateAnother}>
                Créer un autre
              </Button>
              <Button type="button" onClick={handleCloseAfterConfirmation}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}