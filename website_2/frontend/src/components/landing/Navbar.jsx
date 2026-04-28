import { navItems } from "../../lib/landingContent";

export default function Navbar({ onLogin, onSignup, onNavigate, isWorkspace = false }) {
  return (
    <header className="topbar">
      <div className="brand-block">
        <span className="brand-mark">M</span>
        <div>
          <p className="brand-name">MEDICARE</p>
          <p className="brand-copy">Smart Hospital Management System</p>
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
        <button type="button" className="nav-pill" onClick={onLogin}>
          Login
        </button>
        <button type="button" className="nav-pill nav-pill-accent" onClick={onSignup}>
          Sign Up
        </button>
      </div>
    </header>
  );
}
