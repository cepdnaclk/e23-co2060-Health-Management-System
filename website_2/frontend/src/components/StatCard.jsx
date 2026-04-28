export default function StatCard({ label, value }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
