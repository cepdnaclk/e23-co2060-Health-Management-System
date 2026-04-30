import { useEffect, useState } from "react";
import Field from "../components/Field";
import StatCard from "../components/StatCard";
import SymptomChecker from "../components/SymptomChecker";
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
      {loading ? <p className="text-sm text-slate-600">Loading appointments...</p> : null}
      {error ? <p className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {paymentError ? <p className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{paymentError}</p> : null}
      {paymentSuccess ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">{paymentSuccess}</p> : null}
      {!loading && !appointments.length ? <div className="glass rounded-2xl p-4 text-sm text-slate-600">No appointments yet.</div> : null}
      <div className="space-y-2">
        {appointments.map((item) => (
          <div key={item.id} className="glass rounded-2xl p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">
              {String(item.scheduledAt).replace("T", " ").slice(0, 16)} - Dr. {item.doctorUsername}
            </p>
            <p>Reason: {item.reason}</p>
            <p className={item.status === "Cancelled" ? "text-rose-700" : "text-sky-700"}>Status: {item.status}</p>
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
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">AI Symptom Checker</h2>
      <SymptomChecker token={token} />
    </div>
  );
}

export default PatientWorkspace;
