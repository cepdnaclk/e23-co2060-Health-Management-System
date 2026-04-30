import { useEffect, useMemo, useState } from "react";
import DoctorWorkspace from "./pages/DoctorWorkspace";
import PatientWorkspace from "./pages/PatientWorkspace";
import AuthScreen from "./pages/AuthScreen";
import DoctorProfilePage from "./pages/DoctorProfilePage";
import LandingPage from "./pages/LandingPage";
import TopicPage from "./pages/TopicPage";
import Navbar from "./components/landing/Navbar";
import ReceptionistWorkspace from "./pages/ReceptionistWorkspace";
import {
  AUTH_STORE_KEY,
  API_BASE,
  makeInitials,
  normalizeDateForInput,
  readJson,
  readStoredSession,
  setErrorNetworkAware
} from "./lib/appShared";
import { getTopicBySlug } from "./lib/landingContent";

const SUCCESS_ALERT_TIMEOUT_MS = 2200;
const initialPatientLogin = { email: "", password: "" };
const initialDoctorLogin = { username: "", password: "" };
const initialReceptionistLogin = { username: "", password: "" };
const initialSignupForm = { fullName: "", email: "", phone: "", password: "", agree: false };
const initialAccountForm = { fullName: "", phone: "", profilePhotoUrl: "" };
const initialProfileForm = { dob: "", gender: "", address: "", emergencyContact: "", bloodGroup: "", allergies: "" };

export default function App() {
  const initialSession = readStoredSession();
  const [screen, setScreen] = useState(initialSession?.token ? "workspace" : "home");
  const [authRole, setAuthRole] = useState("patient");
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [activeView, setActiveView] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [patientLoginForm, setPatientLoginForm] = useState(initialPatientLogin);
  const [doctorLoginForm, setDoctorLoginForm] = useState(initialDoctorLogin);
  const [receptionistLoginForm, setReceptionistLoginForm] = useState(initialReceptionistLogin);
  const [signupForm, setSignupForm] = useState(initialSignupForm);
  const [accountForm, setAccountForm] = useState(initialAccountForm);
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [session, setSession] = useState(initialSession);

  const initials = useMemo(() => makeInitials(session?.user?.fullName), [session?.user?.fullName]);
  const doctorUser = doctorProfile || session?.user || null;

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), SUCCESS_ALERT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!session?.token) return undefined;

    let cancelled = false;

    async function loadSession() {
      setDataLoading(true);
      setError("");

      try {
        if (session.role === "doctor") {
          const res = await fetch(`${API_BASE}/api/doctor/me`, {
            headers: { Authorization: `Bearer ${session.token}` }
          });
          const data = await readJson(res);

          if (!res.ok) {
            if (res.status === 401) {
              handleLogout(false);
              throw new Error("Session expired. Please login again.");
            }
            throw new Error(data.error || "Could not load doctor profile");
          }

          if (cancelled) return;

          const next = { token: session.token, role: "doctor", user: data.user || session.user };
          localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(next));
          setSession(next);
          setDoctorProfile(data.user || null);
          return;
        }

        if (session.role === "receptionist") {
          const next = { token: session.token, role: "receptionist", user: session.user || null };
          localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(next));
          setSession(next);
          return;
        }

        const res = await fetch(`${API_BASE}/api/patient/me`, {
          headers: { Authorization: `Bearer ${session.token}` }
        });
        const data = await readJson(res);

        if (!res.ok) {
          if (res.status === 401) {
            handleLogout(false);
            throw new Error("Session expired. Please login again.");
          }
          throw new Error(data.error || "Could not load patient profile");
        }

        if (cancelled) return;

        const next = { token: session.token, role: "patient", user: data.user || session.user };
        localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(next));
        setSession(next);
        setAccountForm({
          fullName: data.user?.fullName || "",
          phone: data.user?.phone || "",
          profilePhotoUrl: data.user?.profilePhotoUrl || ""
        });
        setProfileForm({
          dob: normalizeDateForInput(data.profile?.dob),
          gender: data.profile?.gender || "",
          address: data.profile?.address || "",
          emergencyContact: data.profile?.emergencyContact || "",
          bloodGroup: data.profile?.bloodGroup || "",
          allergies: data.profile?.allergies || ""
        });
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load profile");
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, [session?.role, session?.token]);

  async function handlePatientLogin(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!patientLoginForm.email.trim() || !patientLoginForm.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patientLoginForm)
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Login failed");

      const next = { token: data.token, role: data.role || "patient", user: data.user };
      localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(next));
      setSession(next);
      setDoctorProfile(null);
      setActiveView("dashboard");
      setScreen("workspace");
      setSuccess("Login successful.");
    } catch (err) {
      setErrorNetworkAware(err, setError);
    } finally {
      setLoading(false);
    }
  }

  async function handleDoctorLogin(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!doctorLoginForm.username.trim() || !doctorLoginForm.password) {
      setError("Doctor username and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/doctor/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doctorLoginForm)
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Doctor login failed");

      const next = { token: data.token, role: "doctor", user: data.user };
      localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(next));
      setSession(next);
      setDoctorProfile(data.user || null);
      setActiveView("dashboard");
      setScreen("workspace");
      setSuccess("Doctor login successful.");
    } catch (err) {
      setErrorNetworkAware(err, setError);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!signupForm.agree) {
      setError("Please agree to the Terms and Privacy Policy.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...signupForm, initialInfo: {} })
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Sign up failed");

      const next = { token: data.token, role: data.role || "patient", user: data.user };
      localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(next));
      setSession(next);
      setDoctorProfile(null);
      setSignupForm(initialSignupForm);
      setActiveView("dashboard");
      setScreen("workspace");
      setSuccess("Account created.");
    } catch (err) {
      setErrorNetworkAware(err, setError);
    } finally {
      setLoading(false);
    }
  }

  async function handleReceptionistLogin(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!receptionistLoginForm.username.trim() || !receptionistLoginForm.password) {
      setError("Receptionist username and password are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reception/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receptionistLoginForm)
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Receptionist login failed");

      const next = { token: data.token, role: "receptionist", user: data.user };
      localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(next));
      setSession(next);
      setDoctorProfile(null);
      setActiveView("dashboard");
      setScreen("workspace");
      setSuccess("Receptionist login successful.");
    } catch (err) {
      setErrorNetworkAware(err, setError);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccountSave(e) {
    e.preventDefault();
    if (!session?.token || session.role !== "patient") return;

    setError("");
    setSuccess("");
    setSavingAccount(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify(accountForm)
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not update account");

      const next = { token: session.token, role: "patient", user: data.user };
      localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(next));
      setSession(next);
      setSuccess("Account details updated.");
    } catch (err) {
      setErrorNetworkAware(err, setError);
    } finally {
      setSavingAccount(false);
    }
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    if (!session?.token || session.role !== "patient") return;

    setError("");
    setSuccess("");
    setSavingProfile(true);

    try {
      const res = await fetch(`${API_BASE}/api/patient/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`
        },
        body: JSON.stringify(profileForm)
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not update profile");
      setSuccess("Medical profile updated.");
    } catch (err) {
      setErrorNetworkAware(err, setError);
    } finally {
      setSavingProfile(false);
    }
  }

  function handlePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 1_000_000) {
      setError("Image must be under 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAccountForm((prev) => ({ ...prev, profilePhotoUrl: String(reader.result || "") }));
      setError("");
    };
    reader.readAsDataURL(file);
  }

  function handleLogout(showMessage = true) {
    localStorage.removeItem(AUTH_STORE_KEY);
    setSession(null);
    setDoctorProfile(null);
    setAccountForm(initialAccountForm);
    setProfileForm(initialProfileForm);
    setPatientLoginForm(initialPatientLogin);
    setDoctorLoginForm(initialDoctorLogin);
    setReceptionistLoginForm(initialReceptionistLogin);
    setActiveView("dashboard");
    setScreen("home");
    setMode("login");
    if (showMessage) setSuccess("Logged out.");
    setError("");
  }

  function openAuth(nextRole = "patient", nextMode = "login") {
    setAuthRole(nextRole);
    setMode(nextMode);
    setError("");
    setSuccess("");
    setScreen("auth");
  }

  function openTopic(slug) {
    const topic = getTopicBySlug(slug);
    if (!topic) return;
    setSelectedTopic(topic);
    setSelectedDoctor(null);
    setScreen("topic");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openDoctor(doctor) {
    setSelectedDoctor(doctor);
    setSelectedTopic(null);
    setScreen("doctor");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function navigateToLandingSection(sectionId) {
    setSelectedTopic(null);
    setSelectedDoctor(null);
    setScreen("home");
    setTimeout(() => {
      if (sectionId === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 0);
  }

  return (
    <main className="app-shell">
      <StatusBanners error={error} success={success} />

      {screen === "workspace" && session ? (
        <div className="workspace-page">
          <Navbar
            isWorkspace
            onNavigate={navigateToLandingSection}
            onLogin={() => openAuth("patient", "login")}
            onSignup={() => openAuth("patient", "signup")}
          />
          <div className="workspace-content">
            {session.role === "doctor" ? (
              <DoctorWorkspace
                doctor={doctorUser}
                activeView={activeView}
                setActiveView={setActiveView}
                onLogout={handleLogout}
                dataLoading={dataLoading}
                token={session.token}
                onDoctorUpdate={(user) => {
                  const next = { token: session.token, role: "doctor", user };
                  localStorage.setItem(AUTH_STORE_KEY, JSON.stringify(next));
                  setSession(next);
                  setDoctorProfile(user);
                }}
              />
            ) : session.role === "receptionist" ? (
              <ReceptionistWorkspace session={session} onLogout={handleLogout} />
            ) : (
              <PatientWorkspace
                session={session}
                activeView={activeView}
                setActiveView={setActiveView}
                dataLoading={dataLoading}
                initials={initials}
                accountForm={accountForm}
                setAccountForm={setAccountForm}
                profileForm={profileForm}
                setProfileForm={setProfileForm}
                handlePhotoUpload={handlePhotoUpload}
                handleAccountSave={handleAccountSave}
                handleProfileSave={handleProfileSave}
                savingAccount={savingAccount}
                savingProfile={savingProfile}
                onLogout={handleLogout}
              />
            )}
          </div>
        </div>
      ) : null}

      {screen === "home" ? (
        <LandingPage
          onLogin={() => openAuth("patient", "login")}
          onSignup={() => openAuth("patient", "signup")}
          onSelectTopic={openTopic}
          onSelectDoctor={openDoctor}
        />
      ) : null}

      {screen === "doctor" && selectedDoctor ? (
        <DoctorProfilePage
          doctor={selectedDoctor}
          onBackHome={() => {
            setSelectedDoctor(null);
            setScreen("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onLogin={() => openAuth("patient", "login")}
        />
      ) : null}

      {screen === "topic" && selectedTopic ? (
        <TopicPage
          topic={selectedTopic}
          onBackHome={() => {
            setScreen("home");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onSelectTopic={openTopic}
          onLogin={() => openAuth("patient", "login")}
        />
      ) : null}

      {screen === "auth" ? (
        <AuthScreen
          authRole={authRole}
          mode={mode}
          loading={loading}
          showPassword={showPassword}
          error={error}
          success={success}
          patientLoginForm={patientLoginForm}
          doctorLoginForm={doctorLoginForm}
          receptionistLoginForm={receptionistLoginForm}
          signupForm={signupForm}
          setAuthRole={setAuthRole}
          setMode={setMode}
          setShowPassword={setShowPassword}
          setPatientLoginForm={setPatientLoginForm}
          setDoctorLoginForm={setDoctorLoginForm}
          setReceptionistLoginForm={setReceptionistLoginForm}
          setSignupForm={setSignupForm}
          onBack={() => setScreen("home")}
          onPatientLogin={handlePatientLogin}
          onDoctorLogin={handleDoctorLogin}
          onReceptionistLogin={handleReceptionistLogin}
          onSignup={handleSignup}
        />
      ) : null}
    </main>
  );
}

function StatusBanners({ error, success }) {
  return (
    <div className="status-stack">
      {error ? <p className="status-banner status-banner-error">{error}</p> : null}
      {success ? <p className="status-banner status-banner-success">{success}</p> : null}
    </div>
  );
}
