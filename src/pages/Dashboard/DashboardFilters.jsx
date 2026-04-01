export default function DashboardFilters({
  filters,
  zones = [],
  onChange,
  onReset,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Filtres</h2>
        <button
          onClick={onReset}
          className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          Réinitialiser
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <label className="mb-2 block text-sm text-slate-300">Période</label>
          <select
            value={filters.period}
            onChange={(e) => onChange('period', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none"
          >
            <option value="today">Aujourd’hui</option>
            <option value="7d">7 derniers jours</option>
            <option value="30d">30 derniers jours</option>
            <option value="90d">90 derniers jours</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Zone</label>
          <select
            value={filters.zoneId}
            onChange={(e) => onChange('zoneId', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none"
          >
            <option value="">Toutes</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Source</label>
          <select
            value={filters.source}
            onChange={(e) => onChange('source', e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none"
          >
            <option value="">Toutes</option>
            <option value="landing_page">Landing page</option>
            <option value="mobile_app">Mobile app</option>
            <option value="referral">Referral</option>
            <option value="social_media">Social media</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Téléphone</option>
            <option value="email">Email</option>
            <option value="agent">Agent</option>
            <option value="other">Autre</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Agent</label>
          <input
            value={filters.agent}
            onChange={(e) => onChange('agent', e.target.value)}
            placeholder="Nom ou ID agent"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Recherche</label>
          <input
            value={filters.search}
            onChange={(e) => onChange('search', e.target.value)}
            placeholder="Mot-clé"
            className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-white placeholder:text-slate-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
}