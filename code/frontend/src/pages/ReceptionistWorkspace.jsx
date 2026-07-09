import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardStat, EmptyState, LoadingState, StatusBadge } from "../components/DashboardKit";
import { API_BASE, readJson } from "../lib/appShared";
import { useTheme } from "../context/ThemeContext";

function toDateOnly(dateText) {
  const d = new Date(`${dateText}T00:00:00`);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function buildRangeDays(range, dateText) {
  const base = toDateOnly(dateText);
  const days = [];

  if (range === "day") {
    days.push(new Date(base));
    return days;
  }

  if (range === "week") {
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(d);
    }
    return days;
  }

  const monthStart = new Date(base.getFullYear(), base.getMonth(), 1);
  const monthEnd = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  for (let day = 1; day <= monthEnd.getDate(); day += 1) {
    days.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), day));
  }
  return days;
}

function calendarTitle(range, dateText) {
  const base = toDateOnly(dateText);
  if (range === "day") return base.toDateString();
  if (range === "week") return `Week of ${base.toDateString()}`;
  return `${base.toLocaleString("default", { month: "long" })} ${base.getFullYear()}`;
}

export default function ReceptionistWorkspace({ session, onLogout }) {
  const [range, setRange] = useState("day");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [doctorFilter, setDoctorFilter] = useState("");
  const [overview, setOverview] = useState({ doctors: [], patients: [], appointments: [], pendingRequests: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { isDarkMode, toggleTheme } = useTheme();
  const [savingAppointment, setSavingAppointment] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [reports, setReports] = useState([]);
  const [reportPatientId, setReportPatientId] = useState("");
  const [reportPatientSearch, setReportPatientSearch] = useState("");
  const [reportFileName, setReportFileName] = useState("");
  const [appointmentPatientSearch, setAppointmentPatientSearch] = useState("");
  const [appointmentDoctorSearch, setAppointmentDoctorSearch] = useState("");
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: "",
    doctorUsername: "",
    scheduledAt: "",
    reason: "",
    consultationType: "In-Person"
  });

  const token = session?.token;
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const loadOverview = useCallback(
    async ({ signal } = {}) => {
      const params = new URLSearchParams({ range, date });
      if (doctorFilter) params.set("doctor", doctorFilter);
      const res = await fetch(`${API_BASE}/api/reception/overview?${params.toString()}`, { headers, signal });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not load receptionist dashboard");
      setOverview(data);
      return data;
    },
    [date, doctorFilter, headers, range]
  );

  const dayBuckets = useMemo(() => {
    const grouped = new Map();
    for (const day of buildRangeDays(range, date)) {
      grouped.set(formatDateKey(day), []);
    }
    for (const item of overview.appointments || []) {
      const key = String(item.date || "").slice(0, 10);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(item);
    }
    return grouped;
  }, [overview.appointments, range, date]);

  const confirmedAppointments = (overview.appointments || []).filter((item) => item.status === "Confirmed").length;
  const pendingAppointmentRequests = overview.pendingRequests || [];
  const pendingAppointments = pendingAppointmentRequests.length;

  const appointmentPatientOptions = useMemo(
    () =>
      (overview.patients || []).map((patient) => ({
        id: String(patient.id),
        label: `${patient.fullName} (${patient.email})`
      })),
    [overview.patients]
  );

  const appointmentDoctorOptions = useMemo(
    () =>
      (overview.doctors || []).map((doctor) => ({
        username: String(doctor.username),
        label: `${doctor.fullName} (${doctor.username})`
      })),
    [overview.doctors]
  );

  const reportPatientOptions = useMemo(
    () =>
      (overview.patients || []).map((patient) => ({
        id: String(patient.id),
        label: `${patient.fullName} (${patient.email})`
      })),
    [overview.patients]
  );

  const filteredAppointmentPatients = useMemo(() => {
    const needle = appointmentPatientSearch.trim().toLowerCase();
    if (!needle) return appointmentPatientOptions;
    return appointmentPatientOptions.filter((item) => item.label.toLowerCase().includes(needle));
  }, [appointmentPatientOptions, appointmentPatientSearch]);

  const filteredAppointmentDoctors = useMemo(() => {
    const needle = appointmentDoctorSearch.trim().toLowerCase();
    if (!needle) return appointmentDoctorOptions;
    return appointmentDoctorOptions.filter((item) => item.label.toLowerCase().includes(needle));
  }, [appointmentDoctorOptions, appointmentDoctorSearch]);

  const filteredReportPatients = useMemo(() => {
    const needle = reportPatientSearch.trim().toLowerCase();
    if (!needle) return reportPatientOptions;
    return reportPatientOptions.filter((item) => item.label.toLowerCase().includes(needle));
  }, [reportPatientOptions, reportPatientSearch]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const controller = new AbortController();

    async function run() {
      setLoading(true);
      setError("");
      try {
        await loadOverview({ signal: controller.signal });
      } catch (err) {
        if (!cancelled && err.name !== "AbortError") setError(err.message || "Could not load receptionist dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token, loadOverview]);

  useEffect(() => {
    if (!token || !reportPatientId) {
      setReports([]);
      return;
    }
    let cancelled = false;
    async function loadReports() {
      try {
        const res = await fetch(`${API_BASE}/api/reception/patients/${reportPatientId}/reports`, { headers });
        const data = await readJson(res);
        if (!res.ok) throw new Error(data.error || "Could not load reports");
        if (!cancelled) setReports(data.reports || []);
      } catch (err) {
        if (!cancelled) setError(err.message || "Could not load reports");
      }
    }
    loadReports();
    return () => {
      cancelled = true;
    };
  }, [token, reportPatientId, headers]);

  async function createAppointment(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!appointmentForm.patientId || !appointmentForm.doctorUsername) {
      setError("Select a patient and a doctor from the matching list.");
      return;
    }
    setSavingAppointment(true);
    try {
      const res = await fetch(`${API_BASE}/api/reception/appointments`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: Number(appointmentForm.patientId),
          doctorUsername: appointmentForm.doctorUsername,
          scheduledAt: appointmentForm.scheduledAt,
          reason: appointmentForm.reason,
          consultationType: appointmentForm.consultationType
        })
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not create appointment");
      setSuccess("Appointment created.");
      setAppointmentForm((v) => ({ ...v, scheduledAt: "", reason: "", consultationType: "In-Person" }));
      const appointmentDate = String(appointmentForm.scheduledAt || "").slice(0, 10);
      if (appointmentDate && appointmentDate !== date) {
        setDate(appointmentDate);
      } else {
        await loadOverview();
      }
    } catch (err) {
      setError(err.message || "Could not create appointment");
    } finally {
      setSavingAppointment(false);
    }
  }

  async function cancelAppointment(id) {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/api/reception/appointments/${id}/cancel`, {
        method: "PUT",
        headers
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not cancel appointment");
      setSuccess("Appointment removed.");
      await loadOverview();
    } catch (err) {
      setError(err.message || "Could not cancel appointment");
    }
  }

  async function confirmAppointment(id) {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_BASE}/api/reception/appointments/${id}/confirm`, {
        method: "PUT",
        headers
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not confirm appointment");
      setSuccess("Appointment confirmed.");
      await loadOverview();
    } catch (err) {
      setError(err.message || "Could not confirm appointment");
    }
  }

  async function uploadReport(e) {
    e.preventDefault();
    const file = e.target.reportFile?.files?.[0];
    if (!reportPatientId) {
      setError("Select a patient before uploading.");
      return;
    }
    if (!file) {
      setError("Select a PDF file first.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setUploadingReport(true);
      setError("");
      setSuccess("");
      try {
        const res = await fetch(`${API_BASE}/api/reception/reports`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: Number(reportPatientId),
            fileName: file.name,
            mimeType: file.type,
            reportData: String(reader.result || "")
          })
        });
        const data = await readJson(res);
        if (!res.ok) throw new Error(data.error || "Could not upload report");
        setSuccess("Report uploaded.");
        const reportsRes = await fetch(`${API_BASE}/api/reception/patients/${reportPatientId}/reports`, { headers });
        const reportsData = await readJson(reportsRes);
        if (reportsRes.ok) setReports(reportsData.reports || []);
        e.target.reset();
        setReportFileName("");
      } catch (err) {
        setError(err.message || "Could not upload report");
      } finally {
        setUploadingReport(false);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="workspace-layout mx-auto grid w-full max-w-7xl gap-6">
      <section className="workspace-main rounded-3xl p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Receptionist Dashboard</h1>
            <p className="text-sm text-slate-600 font-medium">Logged in as {session?.user?.username || "receptionist"}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="theme-toggle flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-lg"
              onClick={toggleTheme}
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
            <button type="button" onClick={() => onLogout()} className="btn-secondary !m-0">
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-3 md:grid-cols-4">
          <label className="text-sm font-medium text-slate-700">
            View Range
            <select className="field mt-1 w-full" value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Start Date
            <input className="field mt-1 w-full" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="text-sm font-medium text-slate-700">
            Doctor Filter
            <select className="field mt-1 w-full" value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}>
              <option value="">All Doctors</option>
              {(overview.doctors || []).map((doc) => (
                <option key={doc.username} value={doc.username}>
                  {doc.fullName} ({doc.username})
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <p className="w-full rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700">{calendarTitle(range, date)}</p>
          </div>
        </div>

        {loading ? (
          <div className="mt-3">
            <LoadingState label="Loading schedule..." />
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <DashboardStat label="Doctors" value={(overview.doctors || []).length} detail="Available profiles" />
          <DashboardStat label="Patients" value={(overview.patients || []).length} detail="Registered patients" />
          <DashboardStat label="Confirmed" value={confirmedAppointments} detail={`${range} view`} />
          <DashboardStat label="Pending" value={pendingAppointments} detail="Needs approval" />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {(overview.doctors || []).map((doc) => (
            <div key={doc.username} className="glass rounded-2xl p-4">
              <p className="font-semibold text-slate-900">{doc.fullName}</p>
              <p className="text-xs text-slate-600">{doc.specialty}</p>
              <p className="mt-2 text-xs text-slate-700">Available Days: {(doc.availableDays || []).join(", ") || "Not set"}</p>
              <p className="text-xs text-slate-700">Working Hours: {doc.workingHours || "Not set"}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <form onSubmit={createAppointment} className="glass rounded-2xl p-4">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Create Appointment</h2>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Patient
                <input
                  className="field mt-1 w-full"
                  type="text"
                  list="appointment-patient-options"
                  placeholder="Search patient by name or email"
                  value={appointmentPatientSearch}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setAppointmentPatientSearch(nextValue);
                    const match = appointmentPatientOptions.find((item) => item.label === nextValue);
                    setAppointmentForm((v) => ({ ...v, patientId: match ? match.id : "" }));
                  }}
                  required
                />
                <datalist id="appointment-patient-options">
                  {filteredAppointmentPatients.map((patient) => (
                    <option key={patient.id} value={patient.label} />
                  ))}
                </datalist>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Doctor
                <input
                  className="field mt-1 w-full"
                  type="text"
                  list="appointment-doctor-options"
                  placeholder="Search doctor by name"
                  value={appointmentDoctorSearch}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setAppointmentDoctorSearch(nextValue);
                    const match = appointmentDoctorOptions.find((item) => item.label === nextValue);
                    setAppointmentForm((v) => ({ ...v, doctorUsername: match ? match.username : "" }));
                  }}
                  required
                />
                <datalist id="appointment-doctor-options">
                  {filteredAppointmentDoctors.map((doctor) => (
                    <option key={doctor.username} value={doctor.label} />
                  ))}
                </datalist>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Date & Time
                <input
                  className="field mt-1 w-full"
                  type="datetime-local"
                  value={appointmentForm.scheduledAt}
                  onChange={(e) => setAppointmentForm((v) => ({ ...v, scheduledAt: e.target.value }))}
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Consultation Type
                <select
                  className="field mt-1 w-full"
                  value={appointmentForm.consultationType || "In-Person"}
                  onChange={(e) => setAppointmentForm((v) => ({ ...v, consultationType: e.target.value }))}
                  required
                >
                  <option value="In-Person">🏥 In-Person (At Clinic)</option>
                  <option value="Video Consultation">📹 Video Consultation (Telemedicine)</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Reason
                <input
                  className="field mt-1 w-full"
                  type="text"
                  value={appointmentForm.reason}
                  onChange={(e) => setAppointmentForm((v) => ({ ...v, reason: e.target.value }))}
                  placeholder="General consultation"
                />
              </label>
              <button className="btn-primary w-full" type="submit" disabled={savingAppointment}>
                {savingAppointment ? "Saving..." : "Save Appointment"}
              </button>
            </div>
          </form>

          <form onSubmit={uploadReport} className="glass rounded-2xl p-4">
            <h2 className="mb-3 text-lg font-semibold text-slate-900">Upload Lab Report (PDF)</h2>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Patient
                <input
                  className="field mt-1 w-full"
                  type="text"
                  list="report-patient-options"
                  placeholder="Search patient by name or email"
                  value={reportPatientSearch}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setReportPatientSearch(nextValue);
                    const match = reportPatientOptions.find((item) => item.label === nextValue);
                    setReportPatientId(match ? match.id : "");
                  }}
                  required
                />
                <datalist id="report-patient-options">
                  {filteredReportPatients.map((patient) => (
                    <option key={patient.id} value={patient.label} />
                  ))}
                </datalist>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                PDF file
                <div className="field mt-1 flex min-h-[56px] items-center justify-between gap-3 px-3 py-2">
                  <label
                    htmlFor="report-file-input"
                    className="btn-secondary inline-flex cursor-pointer items-center px-4 py-2 text-sm"
                  >
                    Choose File
                  </label>
                  <span className="truncate text-xs text-slate-600 sm:text-sm">
                    {reportFileName || "No file selected"}
                  </span>
                </div>
                <input
                  id="report-file-input"
                  className="sr-only"
                  type="file"
                  name="reportFile"
                  accept="application/pdf"
                  onChange={(e) => setReportFileName(e.target.files?.[0]?.name || "")}
                  required
                />
              </label>
              <button className="btn-primary w-full" type="submit" disabled={uploadingReport}>
                {uploadingReport ? "Uploading..." : "Upload Report"}
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-slate-900">Uploaded reports for selected patient</p>
              {!reports.length ? <EmptyState title="No reports yet" text="Uploaded reports for the selected patient will appear here." /> : null}
              {reports.map((report) => (
                <div key={report.id} className="rounded-xl border border-sky-100 bg-white px-3 py-2 text-xs text-slate-700">
                  <p className="font-semibold">{report.file_name}</p>
                  <p>{String(report.uploaded_at).replace("T", " ").slice(0, 16)}</p>
                </div>
              ))}
            </div>
          </form>
        </div>

        <div className="mt-5 glass rounded-2xl p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Pending Appointment Requests</h2>
              <p className="text-sm text-slate-600">Patient requests need receptionist approval before they reach doctor queues.</p>
            </div>
            <StatusBadge status={`${pendingAppointmentRequests.length} Pending`} />
          </div>

          {!pendingAppointmentRequests.length ? (
            <EmptyState title="No pending requests" text="Patient appointment requests will appear here when they need approval." />
          ) : null}

          <div className="space-y-2">
            {pendingAppointmentRequests.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-3 py-3">
                <div className="text-sm text-slate-700">
                  <p className="font-semibold text-slate-900">
                    {item.patient.fullName} requested {item.date} at {item.time}
                  </p>
                  <p>
                    Doctor: {item.doctorUsername} | Reason: {item.reason}
                  </p>
                  <StatusBadge status={item.status} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-primary" onClick={() => confirmAppointment(item.id)}>
                    Accept
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => cancelAppointment(item.id)}>
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Calendar Appointments</h2>
          {[...dayBuckets.entries()].map(([dayKey, items]) => (
            <div key={dayKey} className="glass rounded-2xl p-4">
              <p className="mb-3 font-semibold text-slate-900">{dayKey}</p>
              {!items.length ? <EmptyState title="No appointments" text="This date has no appointment requests in the selected range." /> : null}
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2">
                    <div className="text-sm text-slate-700">
                      <p className="font-semibold text-slate-900">
                        {item.time} - {item.patient.fullName}
                      </p>
                      <p>
                        Doctor: {item.doctorUsername} | Reason: {item.reason}
                      </p>
                      <StatusBadge status={item.status} />
                    </div>
                    {item.status !== "Cancelled" ? (
                      <div className="flex flex-wrap gap-2">
                        {item.status === "Pending" ? (
                          <button type="button" className="btn-primary" onClick={() => confirmAppointment(item.id)}>
                            Confirm
                          </button>
                        ) : null}
                        <button type="button" className="btn-secondary" onClick={() => cancelAppointment(item.id)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold uppercase text-rose-700">Cancelled</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error ? <p className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}
      </section>
    </div>
  );
}
