/**
 * Returns the badge variant and label for a given status
 * Used across all modules for consistent rendering.
 */

export const LEAD_STATUS = {
  new:               { label: 'Nouveau',          variant: 'info' },
  contacted:         { label: 'Contacté',          variant: 'secondary' },
  qualified:         { label: 'Qualifié',          variant: 'info' },
  visit_scheduled:   { label: 'Visite planifiée',  variant: 'warning' },
  visit_done:        { label: 'Visite réalisée',   variant: 'warning' },
  negotiation:       { label: 'En négociation',    variant: 'warning' },
  converted:         { label: 'Converti',          variant: 'success' },
  lost:              { label: 'Perdu',             variant: 'destructive' },
  duplicate:         { label: 'Doublon',           variant: 'outline' },
};

export const CLIENT_STATUS = {
  active:    { label: 'Actif',     variant: 'success' },
  suspended: { label: 'Suspendu',  variant: 'destructive' },
  closed:    { label: 'Fermé',     variant: 'outline' },
};

export const TERRAIN_STATUS = {
  draft: {
    label: 'Brouillon',
    className: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  published: {
    label: 'Publié',
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  reserved: {
    label: 'Réservé',
    className: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  sold: {
    label: 'Vendu',
    className: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  unavailable: {
    label: 'Indisponible',
    className: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  },
};

export const VISIT_STATUS = {
  scheduled:   { label: 'Planifiée',    variant: 'info' },
  confirmed:   { label: 'Confirmée',    variant: 'success' },
  done:        { label: 'Réalisée',     variant: 'success' },
  cancelled:   { label: 'Annulée',      variant: 'destructive' },
  rescheduled: { label: 'Replanifiée',  variant: 'warning' },
  no_show:     { label: 'Non présenté', variant: 'outline' },
};

export const PAYMENT_STATUS = {
  pending:   { label: 'En attente',  variant: 'warning' },
  confirmed: { label: 'Confirmé',    variant: 'success' },
  failed:    { label: 'Échoué',      variant: 'destructive' },
  refunded:  { label: 'Remboursé',   variant: 'secondary' },
  partial:   { label: 'Partiel',     variant: 'info' },
  cancelled: { label: 'Annulé',      variant: 'outline' },
};

export const TICKET_STATUS = {
  open:           { label: 'Ouvert',           variant: 'info' },
  in_progress:    { label: 'En cours',         variant: 'warning' },
  waiting_client: { label: 'Attente client',   variant: 'secondary' },
  resolved:       { label: 'Résolu',           variant: 'success' },
  closed:         { label: 'Fermé',            variant: 'outline' },
};

export const TICKET_PRIORITY = {
  low:    { label: 'Faible',  variant: 'outline' },
  medium: { label: 'Moyen',   variant: 'info' },
  high:   { label: 'Haute',   variant: 'warning' },
  urgent: { label: 'Urgent',  variant: 'destructive' },
};

export const NOTIF_STATUS = {
  sent:      { label: 'Envoyé',    variant: 'success' },
  failed:    { label: 'Échoué',    variant: 'destructive' },
  pending:   { label: 'En attente', variant: 'warning' },
  delivered: { label: 'Livré',     variant: 'success' },
};

export const USER_STATUS = {
  active:    { label: 'Actif',     variant: 'success' },
  inactive:  { label: 'Inactif',   variant: 'outline' },
  suspended: { label: 'Suspendu',  variant: 'destructive' },
};

export const ROLES = {
  super_admin: { label: 'Super Admin', variant: 'destructive' },
  admin:       { label: 'Admin',       variant: 'warning' },
  manager:     { label: 'Manager',     variant: 'info' },
  finance:     { label: 'Finance',     variant: 'secondary' },
  sales:       { label: 'Commercial',  variant: 'default' },
  support:     { label: 'Support',     variant: 'outline' },
  agent:       { label: 'Agent',       variant: 'outline' },
};

/**
 * Generic status resolver
 */
export const getStatusConfig = (map, key) =>
  map[key] || { label: key || '—', variant: 'outline' };
