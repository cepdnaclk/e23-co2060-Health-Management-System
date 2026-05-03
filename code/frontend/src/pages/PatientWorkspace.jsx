import { useEffect, useState } from "react";
import { DashboardStat, EmptyState, LoadingState, RoleSidebar, StatusBadge } from "../components/DashboardKit";
import Field from "../components/Field";
import SymptomChecker from "../components/SymptomChecker";
import { API_BASE, makeInitials, normalizeDateForInput, readJson, titleForPatientView } from "../lib/appShared";

const patientNav = [
  { id: "dashboard", label: "Dashboard", icon: "D" },
  { id: "profile", label: "Profile", icon: "P" },
  { id: "family", label: "Family Risk", icon: "F" },
  { id: "appointments", label: "Appointments", icon: "A" },
  { id: "medical-log", label: "Medical Log", icon: "L" },
  { id: "symptom", label: "Symptom Checker", icon: "AI" },
  { id: "reports", label: "Reports", icon: "R" },
  { id: "settings", label: "Settings", icon: "S" }
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
  familyRiskVersion,
  onLogout
}) {
  return (
    <div className="workspace-layout mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[260px_1fr]">
      <RoleSidebar
        title={session.user?.fullName || "Patient"}
        subtitle={session.user?.email || "Patient account"}
        initials={initials}
        photoUrl={accountForm.profilePhotoUrl}
        navItems={patientNav}
        activeView={activeView}
        onSelectView={setActiveView}
        onLogout={onLogout}
      />

      <section className="workspace-main rounded-3xl p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 pb-4">
          <h1 className="font-display text-2xl font-bold text-slate-900">{titleForPatientView(activeView)}</h1>
          {dataLoading ? <LoadingState /> : null}
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
              <Field label="Patient ID" type="text" value={session.user?.patientId || ""} disabled />
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
              <Field
                label="Known Hereditary Conditions"
                type="text"
                value={profileForm.knownConditions}
                onChange={(e) => setProfileForm((v) => ({ ...v, knownConditions: e.target.value }))}
                placeholder="Diabetes, familial hypercholesterolemia"
              />
              <div className="family-link-fields">
                <ParentIdField
                  label="Mother Patient ID"
                  value={profileForm.motherPatientId}
                  onChange={(value) => setProfileForm((v) => ({ ...v, motherPatientId: value }))}
                />
                <ParentIdField
                  label="Father Patient ID"
                  value={profileForm.fatherPatientId}
                  onChange={(value) => setProfileForm((v) => ({ ...v, fatherPatientId: value }))}
                />
              </div>
              <button disabled={savingProfile} className="btn-primary w-full" type="submit">
                {savingProfile ? "Saving..." : "Save Medical Profile"}
              </button>
            </form>
          </div>
        ) : null}

        {activeView === "family" ? <FamilyRiskView token={session.token} refreshKey={familyRiskVersion} /> : null}
        {activeView === "appointments" ? <AppointmentsView token={session.token} /> : null}
        {activeView === "medical-log" ? <MedicalLogView token={session.token} /> : null}
        {activeView === "symptom" ? <SymptomView token={session.token} /> : null}
        {activeView === "reports" ? <ReportsView token={session.token} /> : null}
        {activeView === "settings" ? <SettingsView /> : null}
      </section>
    </div>
  );
}

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

function FamilyRiskView({ token, refreshKey }) {
  const [familyData, setFamilyData] = useState({ family: null, risks: [], disclaimer: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadFamilyRisk() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/patient/family-risk`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await readJson(res);
        if (!res.ok) throw new Error(data.error || "Could not load family risk");
        if (!cancelled) setFamilyData({ family: data.family, risks: data.risks || [], disclaimer: data.disclaimer || "" });
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load family risk");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFamilyRisk();
    return () => {
      cancelled = true;
    };
  }, [token, refreshKey]);

  const family = familyData.family;
  const parents = [family?.parents?.father, family?.parents?.mother].filter(Boolean);

  return (
    <div className="family-risk-shell">
      <div className="family-risk-header">
        <div>
          <p className="family-kicker">Hereditary Risk</p>
          <h2>Family Tree</h2>
        </div>
        {loading ? <LoadingState label="Calculating family risk..." /> : null}
      </div>

      {error ? <p className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

      {!loading && !error && !parents.length ? (
        <EmptyState title="No parents linked yet" text="Add mother and father patient IDs in your profile to build the tree." />
      ) : null}

      {family ? (
        <div className="family-tree-panel">
          <div className="family-tree">
            <div className="family-generation family-generation-parents">
              <FamilyNode member={family.parents?.father} fallbackLabel="Father" />
              <FamilyNode member={family.parents?.mother} fallbackLabel="Mother" />
            </div>
            <div className="family-connector" aria-hidden="true" />
            <div className="family-generation family-generation-child">
              <FamilyNode member={family.patient} fallbackLabel="Patient" risks={familyData.risks} featured />
            </div>
          </div>

          <div className="risk-summary-panel">
            <p className="family-kicker">AI Estimate</p>
            {familyData.risks.length ? (
              <div className="risk-list">
                {familyData.risks.map((risk) => (
                  <RiskRow key={`${risk.condition}-${risk.inheritedFrom}`} risk={risk} />
                ))}
              </div>
            ) : (
              <p className="risk-empty">No inherited condition was found in the linked family profile.</p>
            )}
            {familyData.disclaimer ? <p className="risk-disclaimer">{familyData.disclaimer}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FamilyNode({ member, fallbackLabel, risks = [], featured = false }) {
  const initials = makeInitials(member?.fullName || fallbackLabel);

  return (
    <article className={featured ? "family-node family-node-featured" : "family-node"}>
      <div className="family-node-image">
        {member?.profilePhotoUrl ? <img src={member.profilePhotoUrl} alt={member.fullName} /> : <span>{initials}</span>}
      </div>
      <p className="family-node-name">{member?.fullName || fallbackLabel}</p>
      <p className="family-node-id">{member?.patientId || "Not linked"}</p>
      {featured && risks.length ? (
        <div className="family-node-risks">
          {risks.slice(0, 3).map((risk) => (
            <span key={`${risk.condition}-${risk.percentage}`}>{risk.percentage}% {risk.condition}</span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function RiskRow({ risk }) {
  return (
    <article className="risk-row">
      <div>
        <p className="risk-title">{risk.condition}</p>
        <p className="risk-note">
          {risk.inheritedFrom} - {risk.note}
        </p>
      </div>
      <div className="risk-meter-wrap">
        <strong>{risk.percentage}%</strong>
        <span className="risk-meter">
          <span style={{ width: `${risk.percentage}%` }} />
        </span>
      </div>
    </article>
  );
}

function DashboardView({ user, profile }) {
  const completed = [profile.dob, profile.gender, profile.address, profile.emergencyContact, profile.bloodGroup, profile.allergies].filter(Boolean).length;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <DashboardStat label="Welcome" value={user?.fullName || "Patient"} detail="Your Medicare workspace" />
      <DashboardStat label="Patient ID" value={user?.patientId || "Pending"} detail="Use this ID for family linking" />
      <DashboardStat label="Profile Completion" value={`${Math.round((completed / 6) * 100)}%`} detail={`${completed} of 6 fields completed`} />
      <DashboardStat label="Blood Group" value={profile.bloodGroup || "Not set"} detail="Used in clinical workflows" />
      <div className="glass col-span-full rounded-2xl p-4">
        <p className="text-sm text-slate-700">Use the left navigation to manage profile details, appointments, reports, and settings.</p>
      </div>
    </div>
  );
}

function AppointmentsView({ token }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ cardName: "", cardNumber: "", expiry: "", cvv: "" });

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

  async function submitPayment(e) {
    e.preventDefault();
    if (!selectedPayment) return;

    const cardNumber = paymentForm.cardNumber.replace(/\D/g, "");
    if (!paymentForm.cardName.trim()) {
      setPaymentError("Name on card is required.");
      return;
    }
    if (cardNumber.length < 4) {
      setPaymentError("Enter at least 4 card number digits for this mock payment.");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(paymentForm.expiry.trim())) {
      setPaymentError("Expiry must be in MM/YY format, for example 01/27.");
      return;
    }
    if (!/^\d{3,4}$/.test(paymentForm.cvv.trim())) {
      setPaymentError("CVV must be 3 or 4 digits.");
      return;
    }

    setPaying(true);
    setPaymentError("");
    setPaymentSuccess("");

    try {
      const res = await fetch(`${API_BASE}/api/patient/appointments/${selectedPayment.id}/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...paymentForm, cardNumber })
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Payment failed");

      setAppointments((items) =>
        items.map((item) =>
          item.id === selectedPayment.id
            ? {
                ...item,
                paymentStatus: data.paymentStatus || "Paid",
                paymentReference: data.paymentReference,
                paidAt: data.paidAt
              }
            : item
        )
      );
      setPaymentSuccess(`Payment completed. Reference: ${data.paymentReference || "Recorded"}`);
      setPaymentForm({ cardName: "", cardNumber: "", expiry: "", cvv: "" });
      setSelectedPayment(null);
    } catch (err) {
      setPaymentError(err.message || "Payment failed");
    } finally {
      setPaying(false);
    }
  }

  function openPayment(item) {
    setSelectedPayment(item);
    setPaymentError("");
    setPaymentSuccess("");
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Upcoming Appointments</h2>
      {loading ? <LoadingState label="Loading appointments..." /> : null}
      {error ? <p className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {paymentError ? <p className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{paymentError}</p> : null}
      {paymentSuccess ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">{paymentSuccess}</p> : null}
      {!loading && !appointments.length ? <EmptyState title="No appointments yet" text="Requested and confirmed appointments will appear here with status and payment details." /> : null}
      <div className="space-y-2">
        {appointments.map((item) => (
          <div key={item.id} className="glass rounded-2xl p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">
              {String(item.scheduledAt).replace("T", " ").slice(0, 16)} - Dr. {item.doctorUsername}
            </p>
            <p>Reason: {item.reason}</p>
            <StatusBadge status={item.status} />
            <div className="payment-row">
              <div>
                <p className="payment-label">Payment</p>
                <p className={item.paymentStatus === "Paid" ? "payment-status payment-paid" : "payment-status"}>
                  {item.paymentStatus || "Unpaid"} · {item.paymentCurrency || "LKR"} {Number(item.paymentAmount || 2500).toFixed(2)}
                </p>
                {item.paymentReference ? <p className="payment-reference">Ref: {item.paymentReference}</p> : null}
              </div>
              {item.status === "Confirmed" && item.paymentStatus !== "Paid" ? (
                <button type="button" className="btn-primary payment-button" onClick={() => openPayment(item)}>
                  Pay Now
                </button>
              ) : item.status === "Pending" ? (
                <span className="text-xs font-semibold uppercase text-slate-500">Waiting for receptionist approval</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {selectedPayment ? (
        <form className="payment-panel" onSubmit={submitPayment}>
          <div>
            <p className="payment-label">Secure Payment</p>
            <h3>Pay {selectedPayment.paymentCurrency || "LKR"} {Number(selectedPayment.paymentAmount || 2500).toFixed(2)}</h3>
          </div>
          <label>
            <span>Name on card</span>
            <input
              className="field"
              value={paymentForm.cardName}
              onChange={(e) => setPaymentForm((form) => ({ ...form, cardName: e.target.value }))}
              placeholder="Apoorwa Fernando"
              required
            />
          </label>
          <label>
            <span>Card number</span>
            <input
              className="field"
              inputMode="numeric"
              maxLength={19}
              value={paymentForm.cardNumber}
              onChange={(e) => setPaymentForm((form) => ({ ...form, cardNumber: e.target.value }))}
              placeholder="4242 4242 4242 4242"
              required
            />
          </label>
          <div className="payment-card-grid">
            <label>
              <span>Expiry</span>
              <input
                className="field"
                maxLength={5}
                value={paymentForm.expiry}
                onChange={(e) => setPaymentForm((form) => ({ ...form, expiry: e.target.value }))}
                placeholder="MM/YY"
                required
              />
            </label>
            <label>
              <span>CVV</span>
              <input
                className="field"
                inputMode="numeric"
                maxLength={4}
                value={paymentForm.cvv}
                onChange={(e) => setPaymentForm((form) => ({ ...form, cvv: e.target.value }))}
                placeholder="123"
                required
              />
            </label>
          </div>
          <div className="payment-actions">
            <button disabled={paying} className="btn-primary" type="submit">
              {paying ? "Processing..." : "Confirm Payment"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setSelectedPayment(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function MedicalLogView({ token }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadMedicalLog() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/patient/diagnosis-logs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await readJson(res);
        if (!res.ok) throw new Error(data.error || "Could not load medical log");
        if (!cancelled) setLogs(data.logs || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load medical log");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMedicalLog();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Medical Log</h2>
      {loading ? <LoadingState label="Loading medical log..." /> : null}
      {error ? <p className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {!loading && !logs.length ? (
        <EmptyState title="No medical log entries yet" text="Doctor diagnosis and treatment updates will appear here after appointments." />
      ) : null}
      <div className="space-y-3">
        {logs.map((log) => (
          <article key={log.id} className="glass rounded-2xl p-4 text-sm text-slate-700">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-slate-900">{normalizeDateForInput(log.visitDate) || log.visitDate}</p>
              <StatusBadge status={log.diagnosis} />
            </div>
            <p><span className="font-semibold text-slate-900">Doctor:</span> Dr. {log.doctorUsername}</p>
            <p className="mt-2"><span className="font-semibold text-slate-900">Health Status:</span> {log.healthStatus}</p>
            {log.treatmentNotes ? (
              <p className="mt-2"><span className="font-semibold text-slate-900">Treatment:</span> {log.treatmentNotes}</p>
            ) : null}
            {log.nextSteps ? (
              <p className="mt-2"><span className="font-semibold text-slate-900">Next Steps:</span> {log.nextSteps}</p>
            ) : null}
          </article>
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
      {loading ? <LoadingState label="Loading reports..." /> : null}
      {error ? <p className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {!loading && !reports.length ? <EmptyState title="No reports uploaded yet" text="Released lab reports will appear here as downloadable PDFs." /> : null}
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
      <EmptyState title="Settings coming next" text="Notification preferences and password changes can be connected here." />
    </div>
  );
}

function SymptomView({ token }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">AI Symptom Checker</h2>
      <SymptomChecker token={token} />
    </div>
  );
}

export default PatientWorkspace;
