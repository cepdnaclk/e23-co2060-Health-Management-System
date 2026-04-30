export default function Field({ label, trailing, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <div className="field flex items-center gap-2 pr-3">
        <input {...props} className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-200 outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400" />
        {trailing}
      </div>
    </label>
  );
}
