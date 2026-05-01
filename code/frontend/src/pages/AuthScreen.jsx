import { useEffect, useState } from "react";
import Field from "../components/Field";
import { API_BASE, readJson } from "../lib/appShared";
import { authDoctorImage, authPatientImage } from "../lib/landingAssets";

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
    setAuthRole,
    setMode,
    setShowPassword,
    setPatientLoginForm,
    setDoctorLoginForm,
    setReceptionistLoginForm,
    setSignupForm,
    onBack,
    onPatientLogin,
    onDoctorLogin,
    onReceptionistLogin,
    onSignup
  } = props;

  const authVisual = authRole === "doctor" ? authDoctorImage : authPatientImage;

  return (
    <section className="auth-page">
      <div className="auth-shell">
        <div className="auth-panel">
          <button type="button" className="back-link" onClick={onBack}>
            &larr; Back To Home
          </button>

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

          {authRole === "patient" ? (
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

              {mode === "login" ? (
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
              ) : (
                <form className="auth-form" onSubmit={onSignup}>
                  <Field
                    label="Full Name"
                    type="text"
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm((v) => ({ ...v, fullName: e.target.value }))}
                  />
                  <Field
                    label="Email"
                    type="email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm((v) => ({ ...v, email: e.target.value }))}
                  />
                  <Field
                    label="Phone"
                    type="tel"
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm((v) => ({ ...v, phone: e.target.value }))}
                  />
                  <Field
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    value={signupForm.password}
                    onChange={(e) => setSignupForm((v) => ({ ...v, password: e.target.value }))}
                  />
                  <div className="signup-family-fields">
                    <ParentIdField
                      label="Mother Patient ID"
                      value={signupForm.motherPatientId}
                      onChange={(value) => setSignupForm((v) => ({ ...v, motherPatientId: value }))}
                    />
                    <ParentIdField
                      label="Father Patient ID"
                      value={signupForm.fatherPatientId}
                      onChange={(value) => setSignupForm((v) => ({ ...v, fatherPatientId: value }))}
                    />
                  </div>
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={signupForm.agree}
                      onChange={(e) => setSignupForm((v) => ({ ...v, agree: e.target.checked }))}
                    />
                    <span>I agree to the Terms and Privacy Policy.</span>
                  </label>
                  <button disabled={loading} type="submit" className="cta-button auth-submit">
                    {loading ? "Please wait..." : "Create Account"}
                  </button>
                </form>
              )}
            </div>
          ) : authRole === "doctor" ? (
            <form className="auth-form" onSubmit={onDoctorLogin}>
              <Field
                label="Doctor Username"
                type="text"
                value={doctorLoginForm.username}
                onChange={(e) => setDoctorLoginForm((v) => ({ ...v, username: e.target.value }))}
              />
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
          ) : (
            <form className="auth-form" onSubmit={onReceptionistLogin}>
              <Field
                label="Receptionist Username"
                type="text"
                value={receptionistLoginForm.username}
                onChange={(e) => setReceptionistLoginForm((v) => ({ ...v, username: e.target.value }))}
              />
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
          )}

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
