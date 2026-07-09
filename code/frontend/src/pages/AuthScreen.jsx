import { useEffect, useState } from "react";
import Field from "../components/Field";
import { API_BASE, readJson } from "../lib/appShared";
import { authDoctorImage, authPatientImage } from "../lib/landingAssets";
import { useTheme } from "../context/ThemeContext";

const roleTabs = [
  { id: "patient", label: "Patient" },
  { id: "doctor", label: "Doctor" },
  { id: "receptionist", label: "Receptionist" }
];

const authTabs = [
  { id: "login", label: "Login" },
  { id: "signup", label: "Sign Up" }
];

function usePatientLookup(patientId) {
  const [lookup, setLookup] = useState({ status: "idle", patient: null, error: "" });

  useEffect(() => {
    const id = String(patientId || "").trim().toUpperCase();
    if (!id) {
      setLookup({ status: "idle", patient: null, error: "" });
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLookup({ status: "loading", patient: null, error: "" });
      try {
        const res = await fetch(`${API_BASE}/api/patients/lookup?patientId=${encodeURIComponent(id)}`);
        const data = await readJson(res);
        if (!res.ok) throw new Error(data.error || "Patient ID not found");
        if (!cancelled) setLookup({ status: "found", patient: data.patient, error: "" });
      } catch (err) {
        if (!cancelled) setLookup({ status: "missing", patient: null, error: err.message || "Patient ID not found" });
      }
    }, 320);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [patientId]);

  return lookup;
}

function ParentIdField({ label, value, onChange }) {
  const lookup = usePatientLookup(value);

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
      <div className="field flex items-center gap-2 pr-3">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-200 outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
          placeholder="PT-DEMO-MOM"
        />
      </div>
      <p className={`parent-lookup parent-lookup-${lookup.status}`} aria-live="polite">
        {!value ? "Optional" : lookup.status === "loading" ? "Checking..." : lookup.patient ? lookup.patient.fullName : lookup.error}
      </p>
    </label>
  );
}

function GoogleAuthButton({ loading, onGoogleLogin, compact = false }) {
  return (
    <div className={compact ? "auth-social-row auth-social-row-compact" : "auth-social-row"}>
      <button type="button" disabled={loading} className="cta-button auth-google-button" onClick={onGoogleLogin}>
        <span className="google-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.35 11.1H12v2.8h5.4c-.24 1.5-1.6 4.4-5.4 4.4-3.24 0-5.9-2.68-5.9-6s2.66-6 5.9-6c1.85 0 3.1.8 3.82 1.5l2.6-2.5C17.8 3.4 15.33 2.2 12 2.2 6.58 2.2 2 6.78 2 12.2s4.58 10 10 10c5.74 0 9.5-4 9.5-9.7 0-.65-.07-1.3-.15-1.4z" fill="#EA4335" />
            <path d="M3.47 7.7l2.8 2.05C7.05 8.02 9.4 6.2 12 6.2c1.86 0 3.1.8 3.82 1.5l2.6-2.5C17.8 3.4 15.33 2.2 12 2.2c-3.34 0-6.12 1.45-8.53 3.5z" fill="#FBBC05" />
            <path d="M12 21.8c3.26 0 5.97-1.08 7.96-2.92l-3.68-3.02C14.68 15.6 13.4 16.2 12 16.2c-3.8 0-5.92-2.9-6.9-4.4l-2.82 2.18C4.1 19.4 7.48 21.8 12 21.8z" fill="#34A853" />
          </svg>
        </span>
        {loading ? "Please wait..." : "Continue with Google"}
      </button>
    </div>
  );
}

export default function AuthScreen(props) {
  const {
    authRole,
    mode,
    loading,
    showPassword,
    error,
    success,
    patientLoginForm,
    doctorLoginForm,
    receptionistLoginForm,
    signupForm,
    doctorSignupForm,
    receptionistSignupForm,
    setAuthRole,
    setMode,
    setShowPassword,
    setPatientLoginForm,
    setDoctorLoginForm,
    setReceptionistLoginForm,
    setSignupForm,
    setDoctorSignupForm,
    setReceptionistSignupForm,
    onBack,
    onPatientLogin,
    onGoogleLogin,
    onDoctorLogin,
    onDoctorSignup,
    onReceptionistLogin,
    onReceptionistSignup,
    onSignup
  } = props;
  const { isDarkMode, toggleTheme } = useTheme();

  const authVisual = authRole === "doctor" ? authDoctorImage : authPatientImage;

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <div className="auth-panel">
          <div className="flex items-center justify-between">
            <button type="button" className="back-link" onClick={onBack}>
              &larr; Back To Home
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

          <div className="auth-header">
            <h1>{mode === "signup" ? "Sign up" : "Login"}</h1>
          </div>

          <div className="auth-tab-row auth-role-row">
            {roleTabs.map((role) => (
              <button
                key={role.id}
                type="button"
                className={authRole === role.id ? "auth-tab auth-tab-active" : "auth-tab"}
                onClick={() => {
                  setAuthRole(role.id);
                  setMode("login");
                }}
              >
                {role.label}
              </button>
            ))}
          </div>

          <div className="auth-form-wrap">
            <div className="auth-tab-row auth-tab-row-secondary">
              {authTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={mode === tab.id ? "auth-tab auth-tab-active" : "auth-tab"}
                  onClick={() => setMode(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {authRole === "patient" && mode === "login" ? (
              <>
                <GoogleAuthButton loading={loading} onGoogleLogin={onGoogleLogin} />
                <form className="auth-form" onSubmit={onPatientLogin}>
                  <Field
                    label="Email or Username"
                    type="text"
                    value={patientLoginForm.email}
                    onChange={(e) => setPatientLoginForm((v) => ({ ...v, email: e.target.value }))}
                  />
                  <Field
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={patientLoginForm.password}
                    onChange={(e) => setPatientLoginForm((v) => ({ ...v, password: e.target.value }))}
                    trailing={
                      <button type="button" className="field-toggle" onClick={() => setShowPassword((v) => !v)}>
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    }
                  />
                  <button disabled={loading} type="submit" className="cta-button auth-submit">
                    {loading ? "Please wait..." : "Login"}
                  </button>
                </form>
              </>
            ) : authRole === "patient" && mode === "signup" ? (
              <form className="auth-form" onSubmit={onSignup}>
                <Field label="Full Name" type="text" value={signupForm.fullName} onChange={(e) => setSignupForm((v) => ({ ...v, fullName: e.target.value }))} />
                <Field label="Email" type="email" value={signupForm.email} onChange={(e) => setSignupForm((v) => ({ ...v, email: e.target.value }))} />
                <Field label="Phone" type="tel" value={signupForm.phone} onChange={(e) => setSignupForm((v) => ({ ...v, phone: e.target.value }))} />
                <Field
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={signupForm.password}
                  onChange={(e) => setSignupForm((v) => ({ ...v, password: e.target.value }))}
                />
                <div className="signup-family-fields">
                  <ParentIdField label="Mother Patient ID" value={signupForm.motherPatientId} onChange={(value) => setSignupForm((v) => ({ ...v, motherPatientId: value }))} />
                  <ParentIdField label="Father Patient ID" value={signupForm.fatherPatientId} onChange={(value) => setSignupForm((v) => ({ ...v, fatherPatientId: value }))} />
                </div>
                <label className="check-row">
                  <input type="checkbox" checked={signupForm.agree} onChange={(e) => setSignupForm((v) => ({ ...v, agree: e.target.checked }))} />
                  <span>I agree to the Terms and Privacy Policy.</span>
                </label>
                <button disabled={loading} type="submit" className="cta-button auth-submit">
                  {loading ? "Please wait..." : "Create Account"}
                </button>
              </form>
            ) : authRole === "doctor" && mode === "login" ? (
              <form className="auth-form" onSubmit={onDoctorLogin}>
                <GoogleAuthButton loading={loading} onGoogleLogin={onGoogleLogin} compact />
                <Field label="Doctor Username" type="text" value={doctorLoginForm.username} onChange={(e) => setDoctorLoginForm((v) => ({ ...v, username: e.target.value }))} />
                <Field
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={doctorLoginForm.password}
                  onChange={(e) => setDoctorLoginForm((v) => ({ ...v, password: e.target.value }))}
                  trailing={
                    <button type="button" className="field-toggle" onClick={() => setShowPassword((v) => !v)}>
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  }
                />
                <button disabled={loading} type="submit" className="cta-button auth-submit">
                  {loading ? "Please wait..." : "Doctor Login"}
                </button>
              </form>
            ) : authRole === "doctor" && mode === "signup" ? (
              <form className="auth-form" onSubmit={onDoctorSignup}>
                <Field label="Doctor Username" type="text" value={doctorSignupForm.username} onChange={(e) => setDoctorSignupForm((v) => ({ ...v, username: e.target.value }))} />
                <Field label="Full Name" type="text" value={doctorSignupForm.fullName} onChange={(e) => setDoctorSignupForm((v) => ({ ...v, fullName: e.target.value }))} />
                <Field label="Email" type="email" value={doctorSignupForm.email} onChange={(e) => setDoctorSignupForm((v) => ({ ...v, email: e.target.value }))} />
                <Field label="Phone" type="tel" value={doctorSignupForm.phone} onChange={(e) => setDoctorSignupForm((v) => ({ ...v, phone: e.target.value }))} />
                <Field label="Password" type={showPassword ? "text" : "password"} value={doctorSignupForm.password} onChange={(e) => setDoctorSignupForm((v) => ({ ...v, password: e.target.value }))} />
                <div className="signup-family-fields">
                  <Field label="Specialty" type="text" value={doctorSignupForm.specialty} onChange={(e) => setDoctorSignupForm((v) => ({ ...v, specialty: e.target.value }))} />
                  <Field label="Qualification" type="text" value={doctorSignupForm.qualification} onChange={(e) => setDoctorSignupForm((v) => ({ ...v, qualification: e.target.value }))} />
                </div>
                <div className="signup-family-fields">
                  <Field label="Experience (Years)" type="number" min="0" max="60" value={doctorSignupForm.experienceYears} onChange={(e) => setDoctorSignupForm((v) => ({ ...v, experienceYears: e.target.value }))} />
                  <Field label="Registration ID" type="text" value={doctorSignupForm.registrationId} onChange={(e) => setDoctorSignupForm((v) => ({ ...v, registrationId: e.target.value }))} />
                </div>
                <Field label="Working Days" type="text" value={doctorSignupForm.availableDays} onChange={(e) => setDoctorSignupForm((v) => ({ ...v, availableDays: e.target.value }))} />
                <Field label="Working Hours" type="text" value={doctorSignupForm.workingHours} onChange={(e) => setDoctorSignupForm((v) => ({ ...v, workingHours: e.target.value }))} />
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Bio</span>
                  <textarea className="field w-full" rows="3" value={doctorSignupForm.bio} onChange={(e) => setDoctorSignupForm((v) => ({ ...v, bio: e.target.value }))} />
                </label>
                <button disabled={loading} type="submit" className="cta-button auth-submit">
                  {loading ? "Please wait..." : "Create Doctor Account"}
                </button>
              </form>
            ) : authRole === "receptionist" && mode === "login" ? (
              <form className="auth-form" onSubmit={onReceptionistLogin}>
                <GoogleAuthButton loading={loading} onGoogleLogin={onGoogleLogin} compact />
                <Field label="Receptionist Username" type="text" value={receptionistLoginForm.username} onChange={(e) => setReceptionistLoginForm((v) => ({ ...v, username: e.target.value }))} />
                <Field
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={receptionistLoginForm.password}
                  onChange={(e) => setReceptionistLoginForm((v) => ({ ...v, password: e.target.value }))}
                  trailing={
                    <button type="button" className="field-toggle" onClick={() => setShowPassword((v) => !v)}>
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  }
                />
                <button disabled={loading} type="submit" className="cta-button auth-submit">
                  {loading ? "Please wait..." : "Receptionist Login"}
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={onReceptionistSignup}>
                <Field label="Receptionist Username" type="text" value={receptionistSignupForm.username} onChange={(e) => setReceptionistSignupForm((v) => ({ ...v, username: e.target.value }))} />
                <Field label="Full Name" type="text" value={receptionistSignupForm.fullName} onChange={(e) => setReceptionistSignupForm((v) => ({ ...v, fullName: e.target.value }))} />
                <Field label="Email" type="email" value={receptionistSignupForm.email} onChange={(e) => setReceptionistSignupForm((v) => ({ ...v, email: e.target.value }))} />
                <Field label="Phone" type="tel" value={receptionistSignupForm.phone} onChange={(e) => setReceptionistSignupForm((v) => ({ ...v, phone: e.target.value }))} />
                <Field label="Password" type={showPassword ? "text" : "password"} value={receptionistSignupForm.password} onChange={(e) => setReceptionistSignupForm((v) => ({ ...v, password: e.target.value }))} />
                <button disabled={loading} type="submit" className="cta-button auth-submit">
                  {loading ? "Please wait..." : "Create Receptionist Account"}
                </button>
              </form>
            )}
          </div>

          {error ? <p className="auth-note auth-note-error">{error}</p> : null}
          {success ? <p className="auth-note auth-note-success">{success}</p> : null}
        </div>

        <aside className="auth-visual-panel">
          <img src={authVisual} alt="Authentication visual" className="auth-visual-image" />
        </aside>
      </div>
    </section>
  );
}
