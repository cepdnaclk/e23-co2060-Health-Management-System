import { useEffect, useState } from "react";
import Field from "../components/Field";
import StatCard from "../components/StatCard";
import { API_BASE, readJson, titleForPatientView } from "../lib/appShared";

const patientNav = [
  { id: "dashboard", label: "Dashboard" },
  { id: "profile", label: "Profile" },
  { id: "appointments", label: "Appointments" },
  { id: "symptom", label: "Symptom Checker" },
  { id: "reports", label: "Reports" },
  { id: "settings", label: "Settings" }
];

function PatientWorkspace({
  session,
  activeView,
  setActiveView,
  dataLoading,
  initials,
  accountForm,
  setAccountForm,
  profileForm,
  setProfileForm,
  handlePhotoUpload,
  handleAccountSave,
  handleProfileSave,
  savingAccount,
  savingProfile,
  onLogout
}) {
  return (
    <div className="workspace-layout mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="workspace-sidebar rounded-3xl p-4">
        <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-3">
          {accountForm.profilePhotoUrl ? (
            <img src={accountForm.profilePhotoUrl} alt="Profile" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-700">{initials}</div>
          )}
          <div>
            <p className="text-sm font-semibold text-slate-900">{session.user?.fullName || "Patient"}</p>
            <p className="text-xs text-slate-600">{session.user?.email || ""}</p>
          </div>
        </div>

        <nav className="mt-4 space-y-1">
          {patientNav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveView(item.id)}
              className={[
                "w-full rounded-xl px-3 py-2 text-left text-sm font-medium transition",
                activeView === item.id ? "bg-sky-600 text-white" : "text-slate-700 hover:bg-sky-50"
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button type="button" onClick={() => onLogout()} className="btn-secondary mt-5 w-full">
          Logout
        </button>
      </aside>

      <section className="workspace-main rounded-3xl p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 pb-4">
          <h1 className="font-display text-2xl font-bold text-slate-900">{titleForPatientView(activeView)}</h1>
          {dataLoading ? <span className="text-sm text-slate-600">Loading...</span> : null}
        </div>

        {activeView === "dashboard" ? <DashboardView user={session.user} profile={profileForm} /> : null}

        {activeView === "profile" ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <form className="space-y-4" onSubmit={handleAccountSave}>
              <h2 className="text-lg font-semibold text-slate-900">Account Details</h2>
              <div>
                <p className="mb-2 text-sm text-slate-700">Profile Photo</p>
                <div className="flex items-center gap-3">
                  {accountForm.profilePhotoUrl ? (
                    <img src={accountForm.profilePhotoUrl} alt="Profile" className="h-16 w-16 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-700">{initials}</div>
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-xs text-slate-600" />
                </div>
              </div>
              <Field label="Full Name" type="text" value={accountForm.fullName} onChange={(e) => setAccountForm((v) => ({ ...v, fullName: e.target.value }))} />
              <Field label="Email" type="email" value={session.user?.email || ""} disabled />
              <Field label="Phone" type="tel" value={accountForm.phone} onChange={(e) => setAccountForm((v) => ({ ...v, phone: e.target.value }))} />
              <button disabled={savingAccount} className="btn-primary w-full" type="submit">
                {savingAccount ? "Saving..." : "Save Account"}
              </button>
            </form>

            <form className="space-y-4" onSubmit={handleProfileSave}>
              <h2 className="text-lg font-semibold text-slate-900">Medical Profile</h2>
              <Field label="Date of Birth" type="date" value={profileForm.dob} onChange={(e) => setProfileForm((v) => ({ ...v, dob: e.target.value }))} />
              <Field label="Gender" type="text" value={profileForm.gender} onChange={(e) => setProfileForm((v) => ({ ...v, gender: e.target.value }))} />
              <Field label="Address" type="text" value={profileForm.address} onChange={(e) => setProfileForm((v) => ({ ...v, address: e.target.value }))} />
              <Field
                label="Emergency Contact"
                type="text"
                value={profileForm.emergencyContact}
                onChange={(e) => setProfileForm((v) => ({ ...v, emergencyContact: e.target.value }))}
              />
              <Field label="Blood Group" type="text" value={profileForm.bloodGroup} onChange={(e) => setProfileForm((v) => ({ ...v, bloodGroup: e.target.value }))} />
              <Field label="Allergies" type="text" value={profileForm.allergies} onChange={(e) => setProfileForm((v) => ({ ...v, allergies: e.target.value }))} />
              <button disabled={savingProfile} className="btn-primary w-full" type="submit">
                {savingProfile ? "Saving..." : "Save Medical Profile"}
              </button>
            </form>
          </div>
        ) : null}

        {activeView === "appointments" ? <AppointmentsView token={session.token} /> : null}
        {activeView === "symptom" ? <SymptomView token={session.token} /> : null}
        {activeView === "reports" ? <ReportsView token={session.token} /> : null}
        {activeView === "settings" ? <SettingsView /> : null}
      </section>
    </div>
  );
}

function DashboardView({ user, profile }) {
  const completed = [profile.dob, profile.gender, profile.address, profile.emergencyContact, profile.bloodGroup, profile.allergies].filter(Boolean)
    .length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard label="Welcome" value={user?.fullName || "Patient"} />
      <StatCard label="Profile Completion" value={`${Math.round((completed / 6) * 100)}%`} />
      <StatCard label="Blood Group" value={profile.bloodGroup || "Not set"} />
      <div className="glass col-span-full rounded-2xl p-4">
        <p className="text-sm text-slate-700">Use the left navigation to manage profile details, appointments, reports, and settings.</p>
      </div>
    </div>
  );
}

function AppointmentsView({ token }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAppointments() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/patient/appointments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await readJson(res);
        if (!res.ok) throw new Error(data.error || "Could not load appointments");
        if (!cancelled) setAppointments(data.appointments || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load appointments");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAppointments();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Upcoming Appointments</h2>
      {loading ? <p className="text-sm text-slate-600">Loading appointments...</p> : null}
      {error ? <p className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {!loading && !appointments.length ? <div className="glass rounded-2xl p-4 text-sm text-slate-600">No appointments yet.</div> : null}
      <div className="space-y-2">
        {appointments.map((item) => (
          <div key={item.id} className="glass rounded-2xl p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">
              {String(item.scheduledAt).replace("T", " ").slice(0, 16)} - Dr. {item.doctorUsername}
            </p>
            <p>Reason: {item.reason}</p>
            <p className={item.status === "Cancelled" ? "text-rose-700" : "text-sky-700"}>Status: {item.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsView({ token }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/patient/reports`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await readJson(res);
        if (!res.ok) throw new Error(data.error || "Could not load reports");
        if (!cancelled) setReports(data.reports || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load reports");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadReports();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Health Reports</h2>
      {loading ? <p className="text-sm text-slate-600">Loading reports...</p> : null}
      {error ? <p className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {!loading && !reports.length ? <div className="glass rounded-2xl p-4 text-sm text-slate-600">No reports uploaded yet.</div> : null}
      <div className="space-y-2">
        {reports.map((report) => (
          <div key={report.id} className="glass rounded-2xl p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">{report.fileName}</p>
            <p>Uploaded: {String(report.uploadedAt).replace("T", " ").slice(0, 16)}</p>
            <p>Uploaded By: {report.uploadedBy}</p>
            {report.reportData ? (
              <a href={report.reportData} download={report.fileName} className="mt-2 inline-block text-sm font-semibold text-sky-700 underline">
                Download PDF
              </a>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
      <div className="glass rounded-2xl p-4 text-sm text-slate-600">Notification preferences and password change can be added here.</div>
    </div>
  );
}

function SymptomView({ token }) {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/analyzeSymptoms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ symptoms })
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not analyze symptoms");
      setResult(data);
    } catch (err) {
      setError(err.message || "Could not analyze symptoms");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">AI Symptom Checker</h2>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Describe symptoms</span>
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          rows={5}
          className="field w-full resize-none"
          placeholder="Fever, headache for 2 days..."
        />
      </label>
      <button disabled={loading} className="btn-primary" type="submit">
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {error ? <p className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {result ? (
        <div className="glass rounded-2xl p-4 text-sm text-slate-700">
          <p>Primary: {result.primarySpecialty || "-"}</p>
          <p>Secondary: {result.secondarySpecialty || "-"}</p>
          <p>Reason: {result.reason || "-"}</p>
        </div>
      ) : null}
    </form>
  );
}

export default PatientWorkspace;
