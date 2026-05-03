import { navItems } from "../../lib/landingContent";
import { useTheme } from "../../context/ThemeContext";

export default function Navbar({ onLogin, onSignup, onLogout, onWorkspace, session, onNavigate, isWorkspace = false }) {
  const { isDarkMode, toggleTheme } = useTheme();
  const isPatient = session?.role === "patient";

  return (
    <header className="topbar">
      <div className="brand-block">
        <span className="brand-mark">M</span>
        <div>
          <p className="brand-name">MEDICARE</p>
        </div>
      </div>

      <nav className="topnav">
        {navItems.map((item) =>
          isWorkspace ? (
            <button key={item.id} type="button" className="topnav-link topnav-button" onClick={() => onNavigate?.(item.id)}>
              {item.label}
            </button>
          ) : (
            <a key={item.id} href={`#${item.id}`} className="topnav-link">
              {item.label}
            </a>
          )
        )}
      </nav>

      <div className="topbar-actions">
        <button type="button" className="theme-toggle" onClick={toggleTheme} title={isDarkMode ? "Light Mode" : "Dark Mode"}>
          {isDarkMode ? "☀️" : "🌙"}
        </button>
        {isPatient ? (
          <>
            <button type="button" className="nav-pill" onClick={onWorkspace}>
              Dashboard
            </button>
            <button type="button" className="nav-pill nav-pill-accent" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <button type="button" className="nav-pill" onClick={onLogin}>
              Login
            </button>
            <button type="button" className="nav-pill nav-pill-accent" onClick={onSignup}>
              Sign Up
            </button>
          </>
        )}
      </div>
    </header>
  );
}
