/**
 * InfoGrid — renders a key-value grid for detail pages.
 *
 * Props:
 *   items: [{ label: string, value: any, full?: boolean }]
 *   cols?: 2 | 3
 */
export default function InfoGrid({ items = [], cols = 2 }) {
  const colClass = cols === 3 ? 'grid-cols-3' : 'grid-cols-2';
  return (
    <dl className={`grid ${colClass} gap-x-6 gap-y-4 text-sm`}>
      {items.filter(i => i.value !== undefined && i.value !== null && i.value !== '').map((item, idx) => (
        <div key={idx} className={item.full ? 'col-span-full' : ''}>
          <dt className="text-xs text-muted-foreground mb-0.5">{item.label}</dt>
          <dd className="font-medium">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}