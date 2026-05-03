import { useEffect, useState } from "react";
import { DashboardStat, EmptyState, LoadingState, RoleSidebar, StatusBadge } from "../components/DashboardKit";
import Field from "../components/Field";
import {
  API_BASE,
  makeInitials,
  normalizeDateForInput,
  readJson,
  setErrorNetworkAware,
  titleForDoctorView
} from "../lib/appShared";

const doctorNav = [
  { id: "dashboard", label: "Dashboard", icon: "D" },
  { id: "profile", label: "Doctor Profile", icon: "P" },
  { id: "appointments", label: "Appointments", icon: "A" },
  { id: "diagnosis", label: "Diagnosis", icon: "Dx" },
  { id: "prescriptions", label: "Prescriptions", icon: "Rx" }
];

function DoctorWorkspace({ doctor, activeView, setActiveView, onLogout, dataLoading, token, onDoctorUpdate }) {
  const initials = makeInitials(doctor?.fullName || doctor?.username || "DR");

  return (
    <div className="workspace-layout mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[260px_1fr]">
      <RoleSidebar
        title={doctor?.fullName || "Doctor"}
        subtitle={doctor?.specialty || `@${doctor?.username || "doctor"}`}
        initials={initials}
        navItems={doctorNav}
        activeView={activeView}
        onSelectView={setActiveView}
        onLogout={onLogout}
      />

      <section className="workspace-main rounded-3xl p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 pb-4">
          <h1 className="font-display text-2xl font-bold text-slate-900">{titleForDoctorView(activeView)}</h1>
          {dataLoading ? <LoadingState /> : null}
        </div>

        {activeView === "dashboard" ? <DoctorDashboardView doctor={doctor} /> : null}
        {activeView === "profile" ? <DoctorProfileView doctor={doctor} token={token} onDoctorUpdate={onDoctorUpdate} /> : null}
        {activeView === "appointments" ? <DoctorAppointmentsView token={token} onFinishAppointment={() => setActiveView("profile")} /> : null}
        {activeView === "diagnosis" ? <DoctorDiagnosisView token={token} /> : null}
        {activeView === "prescriptions" ? <DoctorPrescriptionsView /> : null}
      </section>
    </div>
  );
}

function DoctorDashboardView({ doctor }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <DashboardStat label="Doctor" value={doctor?.fullName || "Doctor"} detail={doctor?.registrationId || "Registration pending"} />
      <DashboardStat label="Specialty" value={doctor?.specialty || "General Practice"} detail={doctor?.qualification || "Qualification not set"} />
      <DashboardStat label="Experience" value={`${doctor?.experienceYears || 0} years`} detail={doctor?.workingHours || "Hours not set"} />
      <div className="glass col-span-full rounded-2xl p-4 text-sm text-slate-700">
        Keep your profile details up to date so patients and staff always see current information.
      </div>
    </div>
  );
} 

function DoctorProfileView({ doctor, token, onDoctorUpdate }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(() => ({
    fullName: doctor?.fullName || "",
    username: doctor?.username || "",
    registrationId: doctor?.registrationId || "",
    specialty: doctor?.specialty || "",
    qualification: doctor?.qualification || "",
    experienceYears: String(doctor?.experienceYears ?? 0),
    email: doctor?.email || "",
    phone: doctor?.phone || "",
    availableDays: Array.isArray(doctor?.availableDays) ? doctor.availableDays.join(", ") : "",
    workingHours: doctor?.workingHours || "",
    bio: doctor?.bio || ""
  }));

  useEffect(() => {
    setForm({
      fullName: doctor?.fullName || "",
      username: doctor?.username || "",
      registrationId: doctor?.registrationId || "",
      specialty: doctor?.specialty || "",
      qualification: doctor?.qualification || "",
      experienceYears: String(doctor?.experienceYears ?? 0),
      email: doctor?.email || "",
      phone: doctor?.phone || "",
      availableDays: Array.isArray(doctor?.availableDays) ? doctor.availableDays.join(", ") : "",
      workingHours: doctor?.workingHours || "",
      bio: doctor?.bio || ""
    });
  }, [doctor]);

  async function saveDoctorProfile(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch(`${API_BASE}/api/doctor/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fullName: form.fullName,
          registrationId: form.registrationId,
          specialty: form.specialty,
          qualification: form.qualification,
          experienceYears: Number(form.experienceYears || 0),
          email: form.email,
          phone: form.phone,
          availableDays: form.availableDays
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          workingHours: form.workingHours,
          bio: form.bio
        })
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || `Could not update doctor profile (${res.status})`);

      setSuccess("Doctor profile updated.");
      onDoctorUpdate?.(data.user);
    } catch (err) {
      setErrorNetworkAware(err, setError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={saveDoctorProfile} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Full Name"
          type="text"
          value={form.fullName}
          onChange={(e) => setForm((v) => ({ ...v, fullName: e.target.value }))}
        />
        <Field label="Username" type="text" value={form.username} disabled />
        <Field
          label="Registration ID"
          type="text"
          value={form.registrationId}
          onChange={(e) => setForm((v) => ({ ...v, registrationId: e.target.value }))}
        />
        <Field
          label="Specialty"
          type="text"
          value={form.specialty}
          onChange={(e) => setForm((v) => ({ ...v, specialty: e.target.value }))}
        />
        <Field
          label="Qualification"
          type="text"
          value={form.qualification}
          onChange={(e) => setForm((v) => ({ ...v, qualification: e.target.value }))}
        />
        <Field
          label="Experience (Years)"
          type="number"
          min="0"
          max="60"
          value={form.experienceYears}
          onChange={(e) => setForm((v) => ({ ...v, experienceYears: e.target.value }))}
        />
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))}
        />
        <Field
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((v) => ({ ...v, phone: e.target.value }))}
        />
      </div>

      <Field
        label="Working Days (comma-separated)"
        type="text"
        value={form.availableDays}
        onChange={(e) => setForm((v) => ({ ...v, availableDays: e.target.value }))}
      />
      <Field
        label="Working Hours"
        type="text"
        value={form.workingHours}
        onChange={(e) => setForm((v) => ({ ...v, workingHours: e.target.value }))}
      />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Bio</span>
        <textarea
          value={form.bio}
          onChange={(e) => setForm((v) => ({ ...v, bio: e.target.value }))}
          rows={4}
          className="field w-full resize-none"
          placeholder="Write a short professional bio"
        />
      </label>

      <button disabled={saving} className="btn-primary w-full sm:w-auto" type="submit">
        {saving ? "Saving..." : "Save Doctor Profile"}
      </button>

      {error ? <p className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}
    </form>
  );
}

function DoctorAppointmentsView({ token, onFinishAppointment }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [savingPatient, setSavingPatient] = useState(false);
  const [completingAppointment, setCompletingAppointment] = useState(false);
  const [error, setError] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [patientForm, setPatientForm] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAppointments() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/doctor/appointments`, {
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

  async function openPatient(appointment) {
    setLoadingPatient(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/doctor/patients/${appointment.patient.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not load patient profile");

      setSelectedAppointment(appointment);
      setPatientForm({
        patient: {
          id: data.patient?.id,
          fullName: data.patient?.fullName || "",
          email: data.patient?.email || "",
          phone: data.patient?.phone || ""
        },
        profile: {
          dob: normalizeDateForInput(data.profile?.dob),
          gender: data.profile?.gender || "",
          address: data.profile?.address || "",
          emergencyContact: data.profile?.emergencyContact || "",
          bloodGroup: data.profile?.bloodGroup || "",
          allergies: data.profile?.allergies || ""
        }
      });
    } catch (err) {
      setError(err.message || "Could not load patient profile");
    } finally {
      setLoadingPatient(false);
    }
  }

  async function finishAppointment() {
    if (!selectedAppointment?.id) return;

    setCompletingAppointment(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/doctor/appointments/${selectedAppointment.id}/complete`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not finish appointment");

      setAppointments((items) => items.filter((item) => item.id !== selectedAppointment.id));
      setSelectedAppointment(null);
      setPatientForm(null);
      onFinishAppointment();
    } catch (err) {
      setError(err.message || "Could not finish appointment");
    } finally {
      setCompletingAppointment(false);
    }
  }

  async function savePatient(e) {
    e.preventDefault();
    if (!patientForm?.patient?.id) return;

    setSavingPatient(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/doctor/patients/${patientForm.patient.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patient: {
            fullName: patientForm.patient.fullName,
            phone: patientForm.patient.phone
          },
          profile: patientForm.profile
        })
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not save patient profile");

      setPatientForm({
        patient: {
          id: data.patient?.id,
          fullName: data.patient?.fullName || "",
          email: data.patient?.email || "",
          phone: data.patient?.phone || ""
        },
        profile: {
          dob: normalizeDateForInput(data.profile?.dob),
          gender: data.profile?.gender || "",
          address: data.profile?.address || "",
          emergencyContact: data.profile?.emergencyContact || "",
          bloodGroup: data.profile?.bloodGroup || "",
          allergies: data.profile?.allergies || ""
        }
      });
    } catch (err) {
      setError(err.message || "Could not save patient profile");
    } finally {
      setSavingPatient(false);
    }
  }

  if (patientForm && selectedAppointment) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-sky-50 p-3">
          <p className="text-sm text-slate-700">
            Editing patient record for appointment {selectedAppointment.time} ({selectedAppointment.status})
          </p>
          <button
            type="button"
            className="btn-secondary"
            onClick={finishAppointment}
            disabled={completingAppointment}
          >
            {completingAppointment ? "Finishing..." : "Finish Appointment & Return to My Profile"}
          </button>
        </div>

        <form onSubmit={savePatient} className="grid gap-6 xl:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Patient Account</h2>
            <Field
              label="Full Name"
              type="text"
              value={patientForm.patient.fullName}
              onChange={(e) => setPatientForm((v) => ({ ...v, patient: { ...v.patient, fullName: e.target.value } }))}
            />
            <Field label="Email" type="email" value={patientForm.patient.email} disabled />
            <Field
              label="Phone"
              type="tel"
              value={patientForm.patient.phone}
              onChange={(e) => setPatientForm((v) => ({ ...v, patient: { ...v.patient, phone: e.target.value } }))}
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Medical Profile (Editable)</h2>
            <Field
              label="Date of Birth"
              type="date"
              value={patientForm.profile.dob}
              onChange={(e) => setPatientForm((v) => ({ ...v, profile: { ...v.profile, dob: e.target.value } }))}
            />
            <Field
              label="Gender"
              type="text"
              value={patientForm.profile.gender}
              onChange={(e) => setPatientForm((v) => ({ ...v, profile: { ...v.profile, gender: e.target.value } }))}
            />
            <Field
              label="Address"
              type="text"
              value={patientForm.profile.address}
              onChange={(e) => setPatientForm((v) => ({ ...v, profile: { ...v.profile, address: e.target.value } }))}
            />
            <Field
              label="Emergency Contact"
              type="text"
              value={patientForm.profile.emergencyContact}
              onChange={(e) => setPatientForm((v) => ({ ...v, profile: { ...v.profile, emergencyContact: e.target.value } }))}
            />
            <Field
              label="Blood Group"
              type="text"
              value={patientForm.profile.bloodGroup}
              onChange={(e) => setPatientForm((v) => ({ ...v, profile: { ...v.profile, bloodGroup: e.target.value } }))}
            />
            <Field
              label="Allergies"
              type="text"
              value={patientForm.profile.allergies}
              onChange={(e) => setPatientForm((v) => ({ ...v, profile: { ...v.profile, allergies: e.target.value } }))}
            />
            <button type="submit" className="btn-primary w-full" disabled={savingPatient}>
              {savingPatient ? "Saving..." : "Save Patient Record"}
            </button>
          </div>
        </form>
        {error ? <p className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Upcoming Confirmed Appointments</h2>
      {loading ? <LoadingState label="Loading appointments..." /> : null}
      {loadingPatient ? <LoadingState label="Opening patient profile..." /> : null}
      {error ? <p className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {!loading && !appointments.length ? (
        <EmptyState title="No appointments right now" text="Confirmed patient appointments will appear here for review and completion." />
      ) : null}
      <div className="space-y-2">
        {appointments.map((slot) => (
          <button
            key={slot.appointmentId}
            type="button"
            onClick={() => openPatient(slot)}
            className="glass w-full rounded-2xl p-4 text-left text-sm text-slate-700 transition hover:bg-sky-50"
          >
            <p className="font-semibold text-slate-900">
              {slot.time} - {slot.patient?.fullName || "Patient"}
            </p>
            <p>{slot.reason}</p>
            <StatusBadge status={slot.status} />
          </button>
        ))}
      </div>
    </div>
  );
}

function DoctorDiagnosisView({ token }) {
  const today = new Date().toISOString().slice(0, 10);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [patientRecord, setPatientRecord] = useState(null);
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({
    visitDate: today,
    diagnosis: "",
    healthStatus: "",
    treatmentNotes: "",
    nextSteps: ""
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPatients() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/api/doctor/patients`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await readJson(res);
        if (!res.ok) throw new Error(data.error || "Could not load patients");
        if (cancelled) return;
        const loadedPatients = data.patients || [];
        setPatients(loadedPatients);
        if (loadedPatients[0]?.id) {
          setSelectedPatientId(String(loadedPatients[0].id));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load patients");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPatients();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!selectedPatientId) return;
    let cancelled = false;

    async function loadPatientHistory() {
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const [patientRes, logRes] = await Promise.all([
          fetch(`${API_BASE}/api/doctor/patients/${selectedPatientId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_BASE}/api/doctor/patients/${selectedPatientId}/diagnosis-logs`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const patientData = await readJson(patientRes);
        const logData = await readJson(logRes);
        if (!patientRes.ok) throw new Error(patientData.error || "Could not load patient medical history");
        if (!logRes.ok) throw new Error(logData.error || "Could not load diagnosis logs");
        if (cancelled) return;

        setPatientRecord(patientData);
        setLogs(logData.logs || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load diagnosis history");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPatientHistory();
    return () => {
      cancelled = true;
    };
  }, [selectedPatientId, token]);

  async function saveDiagnosisLog(e) {
    e.preventDefault();
    if (!selectedPatientId) return;

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/api/doctor/patients/${selectedPatientId}/diagnosis-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not save diagnosis log");

      setLogs(data.logs || []);
      setForm({
        visitDate: today,
        diagnosis: "",
        healthStatus: "",
        treatmentNotes: "",
        nextSteps: ""
      });
      setSuccess("Diagnosis log added to patient medical history.");
    } catch (err) {
      setErrorNetworkAware(err, setError);
    } finally {
      setSaving(false);
    }
  }

  const profile = patientRecord?.profile || {};
  const patient = patientRecord?.patient || {};

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-slate-900">Diagnosis</h2>
      {loading ? <LoadingState label="Loading diagnosis history..." /> : null}
      {error ? <p className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
      {success ? <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Patient</span>
        <select
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className="field w-full text-sm text-slate-800"
        >
          <option value="">Select a patient</option>
          {patients.map((item) => (
            <option key={item.id} value={item.id}>
              {item.fullName} {item.patientId ? `(${item.patientId})` : ""}
            </option>
          ))}
        </select>
      </label>

      {!patients.length && !loading ? (
        <EmptyState title="No patients found" text="Patients will appear here after accounts are created." />
      ) : null}

      {patientRecord ? (
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="glass rounded-2xl p-4">
            <h3 className="mb-3 text-base font-semibold text-slate-900">Medical History</h3>
            <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <p><span className="font-semibold text-slate-900">Name:</span> {patient.fullName || "Not set"}</p>
              <p><span className="font-semibold text-slate-900">Patient ID:</span> {patient.patientId || "Not set"}</p>
              <p><span className="font-semibold text-slate-900">DOB:</span> {normalizeDateForInput(profile.dob) || "Not set"}</p>
              <p><span className="font-semibold text-slate-900">Gender:</span> {profile.gender || "Not set"}</p>
              <p><span className="font-semibold text-slate-900">Blood Group:</span> {profile.bloodGroup || "Not set"}</p>
              <p><span className="font-semibold text-slate-900">Emergency:</span> {profile.emergencyContact || "Not set"}</p>
              <p className="sm:col-span-2"><span className="font-semibold text-slate-900">Allergies:</span> {profile.allergies || "None recorded"}</p>
              <p className="sm:col-span-2"><span className="font-semibold text-slate-900">Known Conditions:</span> {profile.knownConditions || "None recorded"}</p>
            </div>
          </section>

          <form onSubmit={saveDiagnosisLog} className="glass space-y-4 rounded-2xl p-4">
            <h3 className="text-base font-semibold text-slate-900">Add Treatment Log</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Date"
                type="date"
                required
                value={form.visitDate}
                onChange={(e) => setForm((v) => ({ ...v, visitDate: e.target.value }))}
              />
              <Field
                label="Diagnosis"
                type="text"
                required
                placeholder="Example: Viral fever"
                value={form.diagnosis}
                onChange={(e) => setForm((v) => ({ ...v, diagnosis: e.target.value }))}
              />
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Health Status</span>
              <textarea
                required
                rows={3}
                value={form.healthStatus}
                onChange={(e) => setForm((v) => ({ ...v, healthStatus: e.target.value }))}
                className="field w-full resize-none text-sm text-slate-800"
                placeholder="Current symptoms, vitals, severity, and patient condition"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Treatment Notes</span>
              <textarea
                rows={3}
                value={form.treatmentNotes}
                onChange={(e) => setForm((v) => ({ ...v, treatmentNotes: e.target.value }))}
                className="field w-full resize-none text-sm text-slate-800"
                placeholder="Medication, treatment given, advice, or observations"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Next Steps</span>
              <textarea
                rows={2}
                value={form.nextSteps}
                onChange={(e) => setForm((v) => ({ ...v, nextSteps: e.target.value }))}
                className="field w-full resize-none text-sm text-slate-800"
                placeholder="Follow-up date, tests, referrals, or monitoring plan"
              />
            </label>
            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={saving}>
              {saving ? "Saving..." : "Add Diagnosis Log"}
            </button>
          </form>
        </div>
      ) : null}

      {patientRecord ? (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-slate-900">Patient Health Log</h3>
          {!logs.length ? (
            <EmptyState title="No diagnosis logs yet" text="After treatment, dated health status entries will appear here." />
          ) : null}
          <div className="space-y-3">
            {logs.map((log) => (
              <article key={log.id} className="glass rounded-2xl p-4 text-sm text-slate-700">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{normalizeDateForInput(log.visitDate) || log.visitDate}</p>
                  <StatusBadge status={log.diagnosis} />
                </div>
                <p><span className="font-semibold text-slate-900">Health Status:</span> {log.healthStatus}</p>
                {log.treatmentNotes ? (
                  <p className="mt-2"><span className="font-semibold text-slate-900">Treatment:</span> {log.treatmentNotes}</p>
                ) : null}
                {log.nextSteps ? (
                  <p className="mt-2"><span className="font-semibold text-slate-900">Next Steps:</span> {log.nextSteps}</p>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">Added by Dr. {log.doctorUsername}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function DoctorPrescriptionsView() {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Prescriptions</h2>
      <EmptyState title="Prescription workflow ready" text="Prescription creation and pharmacy handoff can be connected here." />
    </div>
  );
}

export default DoctorWorkspace;
