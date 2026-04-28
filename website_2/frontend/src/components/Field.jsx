export default function Field({ label, trailing, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <div className="field flex items-center gap-2 pr-3">
        <input {...props} className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-500" />
        {trailing}
      </div>
    </label>
  );
}
