import React, { useEffect, useMemo, useState } from 'react';
import { paymentMethodConfigsApi } from '../../Api/paymentMethodConfigsApi';

const METHOD_TYPES = [
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'cash', label: 'Cash' },
];

function getDefaultInstructions(code) {
  if (code === 'mobile_money') {
    return {
      accounts: [
        {
          provider: '',
          holder_name: '',
          phone: '',
          note: '',
        },
      ],
    };
  }

  if (code === 'bank_transfer') {
    return {
      accounts: [
        {
          bank_name: '',
          account_name: '',
          iban: '',
          swift: '',
          account_number: '',
          note: '',
        },
      ],
    };
  }

  return {
    locations: [
      {
        label: '',
        address: '',
        hours: '',
        phone: '',
      },
    ],
  };
}

function normalizeListResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export default function PaymentMethodConfigsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    id: null,
    code: 'mobile_money',
    label: 'Mobile Money',
    description: '',
    isActive: true,
    priority: 10,
    countryCode: 'ML',
    currency: 'XOF',
    instructions: getDefaultInstructions('mobile_money'),
    rules: {},
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const existing = items.find(
      (item) =>
        item.code === form.code &&
        (item.country_code || '') === (form.countryCode || '') &&
        (item.currency || 'XOF') === (form.currency || 'XOF')
    );

    if (existing && !form.id) {
      setForm((prev) => ({
        ...prev,
        id: existing.id,
        label: existing.label || prev.label,
        description: existing.description || '',
        isActive: !!existing.is_active,
        priority: existing.priority || prev.priority,
        instructions: existing.instructions_json || getDefaultInstructions(existing.code),
        rules: existing.rules_json || {},
      }));
    }
  }, [form.code, form.countryCode, form.currency, items, form.id]);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const response = await paymentMethodConfigsApi.list();
      const rows = normalizeListResponse(response);
      setItems(rows);
    } catch (e) {
      setError("Impossible de charger les configurations de paiement.");
    } finally {
      setLoading(false);
    }
  }

  const grouped = useMemo(() => {
    return {
      mobile_money: items.filter((i) => i.code === 'mobile_money'),
      bank_transfer: items.filter((i) => i.code === 'bank_transfer'),
      cash: items.filter((i) => i.code === 'cash'),
    };
  }, [items]);

  function resetForm(code = 'mobile_money') {
    const selected = METHOD_TYPES.find((m) => m.value === code);
    setForm({
      id: null,
      code,
      label: selected?.label || '',
      description: '',
      isActive: true,
      priority: code === 'mobile_money' ? 10 : code === 'bank_transfer' ? 20 : 30,
      countryCode: 'ML',
      currency: 'XOF',
      instructions: getDefaultInstructions(code),
      rules: {},
    });
    setMessage('');
    setError('');
  }

  function editItem(item) {
    setForm({
      id: item.id,
      code: item.code,
      label: item.label || '',
      description: item.description || '',
      isActive: !!item.is_active,
      priority: item.priority || 100,
      countryCode: item.country_code || 'ML',
      currency: item.currency || 'XOF',
      instructions: item.instructions_json || getDefaultInstructions(item.code),
      rules: item.rules_json || {},
    });
    setMessage('');
    setError('');
  }

  function setField(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'code' && prev.code !== value) {
        const selected = METHOD_TYPES.find((m) => m.value === value);
        next.id = null;
        next.label = selected?.label || prev.label;
        next.priority = value === 'mobile_money' ? 10 : value === 'bank_transfer' ? 20 : 30;
        next.instructions = getDefaultInstructions(value);
      }

      return next;
    });
  }

  function updateInstructionAt(path, index, field, value) {
    setForm((prev) => {
      const instructions = { ...(prev.instructions || {}) };
      const arr = Array.isArray(instructions[path]) ? [...instructions[path]] : [];
      arr[index] = { ...(arr[index] || {}), [field]: value };
      instructions[path] = arr;
      return { ...prev, instructions };
    });
  }

  function addInstructionRow(path, template) {
    setForm((prev) => {
      const instructions = { ...(prev.instructions || {}) };
      const arr = Array.isArray(instructions[path]) ? [...instructions[path]] : [];
      arr.push(template);
      instructions[path] = arr;
      return { ...prev, instructions };
    });
  }

  function removeInstructionRow(path, index) {
    setForm((prev) => {
      const instructions = { ...(prev.instructions || {}) };
      const arr = Array.isArray(instructions[path]) ? [...instructions[path]] : [];
      instructions[path] = arr.filter((_, i) => i !== index);
      return { ...prev, instructions };
    });
  }

  async function submit(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const payload = {
        code: form.code,
        label: form.label,
        description: form.description,
        isActive: form.isActive,
        priority: Number(form.priority || 100),
        countryCode: form.countryCode || null,
        currency: form.currency || 'XOF',
        instructions: form.instructions || {},
        rules: form.rules || {},
      };

      const existing = items.find(
        (item) =>
          item.code === payload.code &&
          (item.country_code || '') === (payload.countryCode || '') &&
          (item.currency || 'XOF') === (payload.currency || 'XOF')
      );

      if (form.id) {
        await paymentMethodConfigsApi.update(form.id, payload);
        setMessage('Configuration mise à jour avec succès.');
      } else if (existing?.id) {
        await paymentMethodConfigsApi.update(existing.id, payload);
        setMessage('La configuration existait déjà : elle a été mise à jour.');
      } else {
        await paymentMethodConfigsApi.create(payload);
        setMessage('Configuration créée avec succès.');
      }

      await load();
    } catch (e2) {
      setError(
        e2?.response?.data?.message ||
          "Impossible d'enregistrer la configuration."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleItem(item) {
    try {
      await paymentMethodConfigsApi.toggle(item.id, !item.is_active);
      await load();
    } catch (e) {
      setError("Impossible de changer l'état de cette configuration.");
    }
  }

  const hasExistingForCurrentForm = items.some(
    (item) =>
      item.code === form.code &&
      (item.country_code || '') === (form.countryCode || '') &&
      (item.currency || 'XOF') === (form.currency || 'XOF')
  );

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Modes de paiement client</h1>
        <p className="mt-2 text-sm text-slate-500">
          Gérez les comptes et les instructions affichés au client pour Mobile Money,
          virement bancaire et cash.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {loading ? (
            <div className="rounded-3xl border bg-white p-6">Chargement…</div>
          ) : (
            <>
              <MethodSection
                title="Mobile Money"
                items={grouped.mobile_money}
                onEdit={editItem}
                onToggle={toggleItem}
              />
              <MethodSection
                title="Virement bancaire"
                items={grouped.bank_transfer}
                onEdit={editItem}
                onToggle={toggleItem}
              />
              <MethodSection
                title="Cash"
                items={grouped.cash}
                onEdit={editItem}
                onToggle={toggleItem}
              />
            </>
          )}
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {form.id ? 'Modifier la configuration' : 'Nouvelle configuration'}
            </h2>
            <button
              type="button"
              onClick={() => resetForm(form.code)}
              className="rounded-xl border px-3 py-2 text-sm"
            >
              Réinitialiser
            </button>
          </div>

          {hasExistingForCurrentForm ? (
            <div className="mb-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Une configuration existe déjà pour ce mode, ce pays et cette devise.
              L’enregistrement mettra à jour l’existante.
            </div>
          ) : null}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Type</label>
              <select
                value={form.code}
                onChange={(e) => setField('code', e.target.value)}
                className="w-full rounded-xl border px-3 py-3"
              >
                {METHOD_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Label</label>
              <input
                value={form.label}
                onChange={(e) => setField('label', e.target.value)}
                className="w-full rounded-xl border px-3 py-3"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className="w-full rounded-xl border px-3 py-3"
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Priorité</label>
                <input
                  type="number"
                  value={form.priority}
                  onChange={(e) => setField('priority', e.target.value)}
                  className="w-full rounded-xl border px-3 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Pays</label>
                <input
                  value={form.countryCode}
                  onChange={(e) => setField('countryCode', e.target.value)}
                  className="w-full rounded-xl border px-3 py-3"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Devise</label>
                <input
                  value={form.currency}
                  onChange={(e) => setField('currency', e.target.value)}
                  className="w-full rounded-xl border px-3 py-3"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-xl border p-3">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setField('isActive', e.target.checked)}
              />
              <span className="text-sm font-medium">Activer ce mode</span>
            </label>

            <InstructionsEditor
              code={form.code}
              instructions={form.instructions}
              updateInstructionAt={updateInstructionAt}
              addInstructionRow={addInstructionRow}
              removeInstructionRow={removeInstructionRow}
            />

            {message ? (
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving
                ? 'Enregistrement…'
                : form.id || hasExistingForCurrentForm
                ? 'Mettre à jour la configuration'
                : 'Créer la configuration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function MethodSection({ title, items, onEdit, onToggle }) {
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">{title}</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {items.length} configuration(s)
        </span>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-500">
            Aucune configuration.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{item.label}</span>
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                        item.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <div className="text-sm text-slate-500">{item.description || '—'}</div>
                  <div className="text-xs text-slate-400">
                    Pays: {item.country_code || '—'} · Devise: {item.currency || '—'} · Priorité: {item.priority}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="rounded-xl border px-3 py-2 text-sm"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggle(item)}
                    className="rounded-xl border px-3 py-2 text-sm"
                  >
                    {item.is_active ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>

              <ExistingInstructionsPreview item={item} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ExistingInstructionsPreview({ item }) {
  const instructions = item.instructions_json || {};

  if (item.code === 'mobile_money') {
    const accounts = Array.isArray(instructions.accounts) ? instructions.accounts : [];
    if (!accounts.length) return <EmptyPreview text="Aucun compte Mobile Money configuré." />;

    return (
      <div className="space-y-2">
        {accounts.map((acc, index) => (
          <div key={index} className="rounded-xl bg-slate-50 p-3 text-sm">
            <div className="font-semibold">{acc.provider || 'Provider non renseigné'}</div>
            <div className="text-slate-600">{acc.holder_name || 'Titulaire non renseigné'}</div>
            <div className="text-slate-500">{acc.phone || 'Numéro non renseigné'}</div>
            {acc.note ? <div className="mt-1 text-xs text-slate-400">{acc.note}</div> : null}
          </div>
        ))}
      </div>
    );
  }

  if (item.code === 'bank_transfer') {
    const accounts = Array.isArray(instructions.accounts) ? instructions.accounts : [];
    if (!accounts.length) return <EmptyPreview text="Aucun compte bancaire configuré." />;

    return (
      <div className="space-y-2">
        {accounts.map((acc, index) => (
          <div key={index} className="rounded-xl bg-slate-50 p-3 text-sm">
            <div className="font-semibold">{acc.bank_name || 'Banque non renseignée'}</div>
            <div className="text-slate-600">{acc.account_name || 'Titulaire non renseigné'}</div>
            <div className="text-slate-500">
              {acc.account_number || acc.iban || 'Compte non renseigné'}
            </div>
            {acc.swift ? <div className="text-xs text-slate-400">SWIFT: {acc.swift}</div> : null}
            {acc.note ? <div className="mt-1 text-xs text-slate-400">{acc.note}</div> : null}
          </div>
        ))}
      </div>
    );
  }

  const locations = Array.isArray(instructions.locations) ? instructions.locations : [];
  if (!locations.length) return <EmptyPreview text="Aucun point cash configuré." />;

  return (
    <div className="space-y-2">
      {locations.map((loc, index) => (
        <div key={index} className="rounded-xl bg-slate-50 p-3 text-sm">
          <div className="font-semibold">{loc.label || 'Point de paiement'}</div>
          <div className="text-slate-600">{loc.address || 'Adresse non renseignée'}</div>
          {loc.hours ? <div className="text-slate-500">{loc.hours}</div> : null}
          {loc.phone ? <div className="text-xs text-slate-400">{loc.phone}</div> : null}
        </div>
      ))}
    </div>
  );
}

function EmptyPreview({ text }) {
  return (
    <div className="rounded-xl border border-dashed p-3 text-sm text-slate-500">
      {text}
    </div>
  );
}

function InstructionsEditor({
  code,
  instructions,
  updateInstructionAt,
  addInstructionRow,
  removeInstructionRow,
}) {
  if (code === 'mobile_money') {
    const rows = Array.isArray(instructions?.accounts) ? instructions.accounts : [];
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Comptes Mobile Money</h4>
          <button
            type="button"
            onClick={() =>
              addInstructionRow('accounts', {
                provider: '',
                holder_name: '',
                phone: '',
                note: '',
              })
            }
            className="rounded-xl border px-3 py-2 text-sm"
          >
            Ajouter un compte
          </button>
        </div>

        {rows.map((row, index) => (
          <div key={index} className="rounded-2xl border p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                placeholder="Provider"
                value={row.provider || ''}
                onChange={(e) => updateInstructionAt('accounts', index, 'provider', e.target.value)}
                className="w-full rounded-xl border px-3 py-3"
              />
              <input
                placeholder="Nom du titulaire"
                value={row.holder_name || ''}
                onChange={(e) => updateInstructionAt('accounts', index, 'holder_name', e.target.value)}
                className="w-full rounded-xl border px-3 py-3"
              />
              <input
                placeholder="Numéro"
                value={row.phone || ''}
                onChange={(e) => updateInstructionAt('accounts', index, 'phone', e.target.value)}
                className="w-full rounded-xl border px-3 py-3"
              />
              <input
                placeholder="Note"
                value={row.note || ''}
                onChange={(e) => updateInstructionAt('accounts', index, 'note', e.target.value)}
                className="w-full rounded-xl border px-3 py-3"
              />
            </div>

            <button
              type="button"
              onClick={() => removeInstructionRow('accounts', index)}
              className="rounded-xl border px-3 py-2 text-sm text-red-600"
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (code === 'bank_transfer') {
    const rows = Array.isArray(instructions?.accounts) ? instructions.accounts : [];
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Comptes bancaires</h4>
          <button
            type="button"
            onClick={() =>
              addInstructionRow('accounts', {
                bank_name: '',
                account_name: '',
                iban: '',
                swift: '',
                account_number: '',
                note: '',
              })
            }
            className="rounded-xl border px-3 py-2 text-sm"
          >
            Ajouter un compte
          </button>
        </div>

        {rows.map((row, index) => (
          <div key={index} className="rounded-2xl border p-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                placeholder="Banque"
                value={row.bank_name || ''}
                onChange={(e) => updateInstructionAt('accounts', index, 'bank_name', e.target.value)}
                className="w-full rounded-xl border px-3 py-3"
              />
              <input
                placeholder="Titulaire"
                value={row.account_name || ''}
                onChange={(e) => updateInstructionAt('accounts', index, 'account_name', e.target.value)}
                className="w-full rounded-xl border px-3 py-3"
              />
              <input
                placeholder="IBAN"
                value={row.iban || ''}
                onChange={(e) => updateInstructionAt('accounts', index, 'iban', e.target.value)}
                className="w-full rounded-xl border px-3 py-3"
              />
              <input
                placeholder="SWIFT"
                value={row.swift || ''}
                onChange={(e) => updateInstructionAt('accounts', index, 'swift', e.target.value)}
                className="w-full rounded-xl border px-3 py-3"
              />
              <input
                placeholder="N° de compte"
                value={row.account_number || ''}
                onChange={(e) => updateInstructionAt('accounts', index, 'account_number', e.target.value)}
                className="w-full rounded-xl border px-3 py-3"
              />
              <input
                placeholder="Note"
                value={row.note || ''}
                onChange={(e) => updateInstructionAt('accounts', index, 'note', e.target.value)}
                className="w-full rounded-xl border px-3 py-3"
              />
            </div>

            <button
              type="button"
              onClick={() => removeInstructionRow('accounts', index)}
              className="rounded-xl border px-3 py-2 text-sm text-red-600"
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>
    );
  }

  const rows = Array.isArray(instructions?.locations) ? instructions.locations : [];
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Points de paiement cash</h4>
        <button
          type="button"
          onClick={() =>
            addInstructionRow('locations', {
              label: '',
              address: '',
              hours: '',
              phone: '',
            })
          }
          className="rounded-xl border px-3 py-2 text-sm"
        >
          Ajouter un point
        </button>
      </div>

      {rows.map((row, index) => (
        <div key={index} className="rounded-2xl border p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              placeholder="Libellé"
              value={row.label || ''}
              onChange={(e) => updateInstructionAt('locations', index, 'label', e.target.value)}
              className="w-full rounded-xl border px-3 py-3"
            />
            <input
              placeholder="Téléphone"
              value={row.phone || ''}
              onChange={(e) => updateInstructionAt('locations', index, 'phone', e.target.value)}
              className="w-full rounded-xl border px-3 py-3"
            />
            <input
              placeholder="Adresse"
              value={row.address || ''}
              onChange={(e) => updateInstructionAt('locations', index, 'address', e.target.value)}
              className="w-full rounded-xl border px-3 py-3"
            />
            <input
              placeholder="Horaires"
              value={row.hours || ''}
              onChange={(e) => updateInstructionAt('locations', index, 'hours', e.target.value)}
              className="w-full rounded-xl border px-3 py-3"
            />
          </div>

          <button
            type="button"
            onClick={() => removeInstructionRow('locations', index)}
            className="rounded-xl border px-3 py-2 text-sm text-red-600"
          >
            Supprimer
          </button>
        </div>
      ))}
    </div>
  );
}