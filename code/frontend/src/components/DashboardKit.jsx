import { useTheme } from "../context/ThemeContext";

export function RoleSidebar({ title, subtitle, initials, photoUrl, navItems, activeView, onSelectView, onLogout }) {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <aside className="workspace-sidebar role-sidebar rounded-3xl p-4">
      <div className="role-profile-card">
        {photoUrl ? (
          <img src={photoUrl} alt={title} className="role-avatar-img" />
        ) : (
          <div className="role-avatar">{initials}</div>
        )}
        <div>
          <p className="role-title">{title}</p>
          <p className="role-subtitle">{subtitle}</p>
        </div>
      </div>

      <nav className="role-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectView(item.id)}
            className={activeView === item.id ? "role-nav-item role-nav-item-active" : "role-nav-item"}
          >
            <span>{item.icon || item.label.slice(0, 1)}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50">
        <button type="button" onClick={onLogout} className="btn-secondary role-logout grow !m-0">
          Logout
        </button>
        <button
          type="button"
          className="theme-toggle flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-lg"
          onClick={toggleTheme}
          title={isDarkMode ? "Light Mode" : "Dark Mode"}
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>
      </div>
    </aside>
  );
}

export function DashboardStat({ label, value, detail }) {
  return (
    <article className="dashboard-stat">
      <p>{label}</p>
      <strong>{value}</strong>
      {detail ? <span>{detail}</span> : null}
    </article>
  );
}

export function EmptyState({ title, text, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-state-mark">+</div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
      {actionLabel ? (
        <button type="button" className="btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function StatusBadge({ status }) {
  const normalized = String(status || "").toLowerCase();
  const tone = normalized.includes("paid") || normalized.includes("confirmed") || normalized.includes("completed") ? "good" : normalized.includes("cancel") ? "danger" : "neutral";
  return <span className={`status-badge status-badge-${tone}`}>{status || "Pending"}</span>;
}

export function LoadingState({ label = "Loading..." }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
