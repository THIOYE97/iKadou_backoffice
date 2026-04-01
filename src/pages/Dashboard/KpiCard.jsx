import { Link } from 'react-router-dom';

export default function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  to,
  loading = false,
}) {
  const content = (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-sm transition hover:border-white/20 hover:bg-[#0f172a]">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <h3 className="mt-2 text-3xl font-bold text-white">
            {loading ? '...' : value}
          </h3>
        </div>

        {Icon ? (
          <div className="rounded-xl bg-slate-800 p-3 text-slate-300">
            <Icon size={20} />
          </div>
        ) : null}
      </div>

      {subtitle ? (
        <p className="text-sm text-slate-400">{subtitle}</p>
      ) : null}
    </div>
  );

  if (to) {
    return <Link to={to}>{content}</Link>;
  }

  return content;
}