export const navItems = [
  { id: "home", label: "Home" },
  { id: "explore", label: "Explore" },
  { id: "network", label: "Centres" },
  { id: "doctors", label: "Doctors" },
  { id: "quality", label: "Quality" },
  { id: "workflows", label: "Workflows" },
  { id: "services", label: "Services" },
  { id: "contact", label: "Contact" }
];

export const networkList = [
  "Medicare Medical",
  "Medicare Surgical",
  "Medicare Central",
  "Medicare Matara",
  "Medicare Galle",
  "Medicare Kandy",
  "Medicare Laboratories"
];

export const careTiles = [
  {
    slug: "heart-centres",
    icon: "HE",
    tone: "sky",
    kind: "Centre Of Excellence",
    title: "Heart Centres",
    summary: "Cardiology, prevention, intervention, and follow-up care in one coordinated stream.",
    description:
      "Medicare Heart Centres combine diagnostics, interventional support, specialist consultations, and recovery planning so cardiac patients move through care with less delay and clearer communication.",
    focus: ["Chest pain and emergency escalation", "Long-term hypertension and rhythm review", "Recovery planning after procedures"],
    support: ["Appointment requests and confirmed slot tracking", "Doctor diagnosis notes and prescriptions", "Lab and imaging results released under policy"],
    requirements: ["REQ-FN-011 to REQ-FN-029", "REQ-FN-030 to REQ-FN-039", "REQ-NF-SEC-001 to REQ-NF-USA-003"],
    related: ["consultation-bookings", "patient-journey", "diagnosis-prescriptions"]
  },
  {
    slug: "brain-and-spine",
    icon: "NS",
    tone: "sky",
    kind: "Centre Of Excellence",
    title: "Brain & Spine",
    summary: "Neurology and spine care supported by clinical coordination and digital records.",
    description:
      "The Brain & Spine programme brings together neurological assessments, follow-up scheduling, and doctor-approved care plans so patients can understand the pathway from consultation to recovery.",
    focus: ["Headache, seizure, and nerve symptom review", "Spinal pain and mobility assessments", "Doctor-approved care pathways"],
    support: ["Patient profile and medical history access", "Confirmed appointment scheduling", "AI-supported routine and diet suggestions for doctor review"],
    requirements: ["REQ-FN-006 to REQ-FN-010", "REQ-FN-021 to REQ-FN-025", "REQ-FN-040 to REQ-FN-046"],
    related: ["ai-decision-support", "doctor-workflow", "wellness-packages"]
  },
  {
    slug: "bone-marrow",
    icon: "BM",
    tone: "sky",
    kind: "Centre Of Excellence",
    title: "Bone Marrow",
    summary: "High-coordination cancer and transplant support with lab-linked workflows.",
    description:
      "Bone marrow care depends on precise scheduling, lab requests, and result handling. This page highlights how the system supports specialist reviews and time-sensitive clinical coordination.",
    focus: ["Specialist referrals and appointment confirmation", "Linked lab test requests and result uploads", "Follow-up notes, prescriptions, and audit traceability"],
    support: ["Doctor-to-lab request pipeline", "Notification history for critical updates", "Secure patient-only result visibility after release"],
    requirements: ["REQ-FN-015 to REQ-FN-020", "REQ-FN-030 to REQ-FN-039", "REQ-FN-047 to REQ-FN-048"],
    related: ["lab-workflow-results", "notifications-history", "download-lab-reports"]
  },
  {
    slug: "stroke-centre",
    icon: "SC",
    tone: "sky",
    kind: "Centre Of Excellence",
    title: "Stroke Centre",
    summary: "Rapid response, imaging, rehabilitation planning, and progress visibility.",
    description:
      "The Stroke Centre experience focuses on urgent coordination. Clear scheduling, doctor actions, and result-sharing matter, so the interface emphasizes speed, visibility, and timely updates.",
    focus: ["Urgent patient routing", "Imaging and lab coordination", "Post-event monitoring and rehabilitation review"],
    support: ["Receptionist and doctor workflow alignment", "Protected role-based access control", "Notification and audit coverage for critical actions"],
    requirements: ["REQ-FN-001 to REQ-FN-005", "REQ-FN-015 to REQ-FN-025", "REQ-FN-047 to REQ-NF-REL-002"],
    related: ["receptionist-scheduling", "authentication-rbac", "notifications-history"]
  },
  {
    slug: "radiology",
    icon: "IR",
    tone: "sky",
    kind: "Centre Of Excellence",
    title: "Radiology",
    summary: "Imaging requests, scheduling, and result communication aligned to specialist care.",
    description:
      "Radiology services often sit between diagnosis and follow-up. Medicare keeps those steps visible through linked appointments, requests, doctor review, and patient-safe report release.",
    focus: ["Imaging request tracking", "Technician schedule awareness", "Doctor review before patient release"],
    support: ["Lab-style request and completion statuses", "Approved report visibility for patients", "Doctor notifications when new results are uploaded"],
    requirements: ["REQ-FN-030 to REQ-FN-039", "REQ-NF-SEC-004 to REQ-NF-SEC-006", "REQ-NF-REL-001 to REQ-NF-MNT-002"],
    related: ["download-lab-reports", "lab-technician-workflow", "notifications-history"]
  },
  {
    slug: "mother-and-baby",
    icon: "MB",
    tone: "sky",
    kind: "Centre Of Excellence",
    title: "Mother & Baby",
    summary: "Consultations, packages, test scheduling, and guided follow-up for family care.",
    description:
      "Mother & Baby care combines recurring appointments, wellness planning, diagnostics, and communication. The interface explains these services with clearer digital steps and supportive information.",
    focus: ["Consultant appointments and schedule visibility", "Pre-registration and package guidance", "Results and medication follow-up"],
    support: ["Appointment requests and confirmation", "Doctor-approved recommendations", "Online payment and pharmacy-friendly handoff"],
    requirements: ["REQ-FN-011 to REQ-FN-020", "REQ-FN-026 to REQ-FN-029", "REQ-FN-040 to REQ-FN-045"],
    related: ["pre-registration", "wellness-packages", "online-pharmacy"]
  },
  {
    slug: "kidney-transplant",
    icon: "KT",
    tone: "sky",
    kind: "Centre Of Excellence",
    title: "Kidney Transplant",
    summary: "A coordination-heavy programme supported by records, labs, scheduling, and alerts.",
    description:
      "Kidney transplant pathways involve specialist consultations, lab schedules, result review, and post-visit monitoring. This topic page shows how the system brings those threads together.",
    focus: ["Linked doctor and lab workflows", "Status visibility across requests", "Prescription and monitoring support"],
    support: ["Secure patient records with update history", "Doctor scheduling and lab-result notifications", "Audit logging for critical actions"],
    requirements: ["REQ-FN-006 to REQ-FN-010", "REQ-FN-021 to REQ-FN-039", "REQ-FN-047 to REQ-NF-SEC-006"],
    related: ["patient-profiles-history", "lab-workflow-results", "audit-security"]
  },
  {
    slug: "urology-services",
    icon: "UR",
    tone: "sky",
    kind: "Centre Of Excellence",
    title: "Urology Services",
    summary: "Specialist appointments, records, procedures, and post-consultation support.",
    description:
      "Urology care needs clear preparation, scheduling, and medication guidance. Medicare presents the pathway with specialist access, patient-friendly explanations, and role-based workflow support.",
    focus: ["Consultation requests and schedule resolution", "Procedure follow-up planning", "Prescription visibility after confirmation"],
    support: ["Receptionist scheduling controls", "Doctor record updates and prescription creation", "Patient read-only access to released items"],
    requirements: ["REQ-FN-011 to REQ-FN-029", "REQ-NF-SEC-001 to REQ-NF-SEC-005", "REQ-NF-USA-001 to REQ-NF-REL-001"],
    related: ["appointment-requests", "diagnosis-prescriptions", "patient-feedback"]
  },
  {
    slug: "cancer-care",
    icon: "ON",
    tone: "teal",
    kind: "Centre Of Excellence",
    title: "Cancer Care",
    summary: "Longitudinal care journeys supported by records, labs, prescriptions, and communication.",
    description:
      "Cancer care is not a single visit. The digital platform supports continuing reviews, result availability, approved care advice, and visibility across specialist and laboratory steps.",
    focus: ["Recurring specialist reviews", "Medication and test coordination", "Doctor-approved patient-facing advice"],
    support: ["Read-only patient prescription and result access", "Notification history and follow-up visibility", "AI-assisted routines and diet planning subject to doctor approval"],
    requirements: ["REQ-FN-026 to REQ-FN-046", "REQ-FN-047 to REQ-FN-048", "REQ-NF-USA-003 to REQ-NF-PRT-001"],
    related: ["ai-decision-support", "download-lab-reports", "doctor-workflow"]
  },
  {
    slug: "ivf-and-fertility",
    icon: "IV",
    tone: "rose",
    kind: "Centre Of Excellence",
    title: "IVF & Fertility",
    summary: "Specialist consultations, planning, testing, and patient communication in one path.",
    description:
      "IVF and fertility support requires recurring visits, packages, test results, and sensitive communication. The platform keeps those interactions consistent with the same homepage design language.",
    focus: ["Follow-up consultation scheduling", "Package guidance and diagnostic coordination", "Secure visibility of doctor-approved updates"],
    support: ["Patient appointment request workflow", "Lab result release and notifications", "Online payment and service navigation"],
    requirements: ["REQ-FN-011 to REQ-FN-020", "REQ-FN-030 to REQ-FN-039", "REQ-NF-USA-001 to REQ-NF-USA-003"],
    related: ["consultation-bookings", "payment-portal", "patient-journey"]
  }
];

export const qualityStats = [
  { value: "94.82%", label: "Patient Satisfaction Rate on Services" },
  { value: "97.30%", label: "Correct Patient Identification Compliance" },
  { value: "88.33%", label: "Hand Hygiene Compliance" },
  { value: "0.09%", label: "Hospital Acquired Infections" },
  { value: "0.17%", label: "Adverse Drug Reaction" },
  { value: "0.00%", label: "Hospital Acquired Bed Sores" }
];

export const impactStats = [
  { value: "800+", label: "Consultants" },
  { value: "3500+", label: "Consultations Per Day" },
  { value: "4250+", label: "Tests Offered" },
  { value: "14500+", label: "Tests Per Day" },
  { value: "800+", label: "Beds" }
];

export const roleCards = [
  {
    slug: "patient-journey",
    icon: "PT",
    tone: "navy",
    kind: "User Role",
    title: "Patient Journey",
    summary: "Request appointments, view status, see approved prescriptions and released lab results.",
    description:
      "The patient-facing experience in the SRS focuses on clarity and trust. Patients need access to appointment requests, confirmation updates, their own profile data, read-only prescriptions, released lab results, and doctor-approved recommendations.",
    focus: ["Request appointments and track statuses", "Manage personal profile details", "Read simple, approved care guidance"],
    support: ["Patient login and logout", "Appointment request lifecycle visibility", "Notifications, prescriptions, and result access under policy"],
    requirements: ["REQ-FN-001, REQ-FN-004, REQ-FN-009", "REQ-FN-011 to REQ-FN-014", "REQ-FN-028, REQ-FN-036, REQ-FN-037, REQ-FN-045"],
    related: ["appointment-requests", "download-lab-reports", "patient-feedback"]
  },
  {
    slug: "receptionist-workflow",
    icon: "RC",
    tone: "navy",
    kind: "User Role",
    title: "Receptionist Workflow",
    summary: "Review pending bookings, resolve schedules, confirm slots, reject, or request rescheduling.",
    description:
      "Reception and admin staff coordinate demand and doctor availability. The UI supports pending booking review, final slot assignment, rejection handling, reschedule requests, and the prevention of double-bookings.",
    focus: ["Pending request queue visibility", "Slot assignment and conflict prevention", "Patient notifications after resolution"],
    support: ["Basic patient details for scheduling", "Booking timeline controls", "Audit-friendly decision history"],
    requirements: ["REQ-FN-008", "REQ-FN-015 to REQ-FN-020", "REQ-FN-047 to REQ-FN-048"],
    related: ["receptionist-scheduling", "notifications-history", "authentication-rbac"]
  },
  {
    slug: "doctor-workflow",
    icon: "DR",
    tone: "navy",
    kind: "User Role",
    title: "Doctor Workflow",
    summary: "View schedules, open patient records, write diagnoses, send prescriptions, request tests, review AI suggestions.",
    description:
      "Doctors need one connected workspace for appointments, patient records, notes, prescriptions, lab requests, and AI-assisted suggestions that still require human approval before sharing.",
    focus: ["Upcoming confirmed appointments", "Patient record review and updates", "Diagnosis, prescription, and AI approval flow"],
    support: ["Schedule view linked to patient records", "Prescription confirmation and pharmacy handoff", "Lab-result notifications and editable AI outputs"],
    requirements: ["REQ-FN-021 to REQ-FN-029", "REQ-FN-030, REQ-FN-035", "REQ-FN-040 to REQ-FN-046"],
    related: ["diagnosis-prescriptions", "lab-workflow-results", "ai-decision-support"]
  },
  {
    slug: "lab-technician-workflow",
    icon: "LT",
    tone: "navy",
    kind: "User Role",
    title: "Lab Technician Workflow",
    summary: "Review schedules, mark test progress, upload results, and keep patient-result links accurate.",
    description:
      "Lab technicians depend on accurate request linkage and safe result handling. The interface reflects the SRS need for schedules, in-progress updates, completed statuses, and correct patient-result attachment.",
    focus: ["Scheduled test queue visibility", "In-progress and completed statuses", "Result uploads tied to the correct request and patient"],
    support: ["Protected result management", "Doctor notifications after submission", "Release-based patient visibility"],
    requirements: ["REQ-FN-032 to REQ-FN-036", "REQ-FN-038 to REQ-FN-039", "REQ-NF-SEC-004 to REQ-NF-REL-002"],
    related: ["lab-workflow-results", "download-lab-reports", "audit-security"]
  }
];

export const moduleCards = [
  {
    slug: "authentication-rbac",
    icon: "AU",
    tone: "surface",
    kind: "Core Module",
    title: "Authentication & RBAC",
    summary: "Secure login, logout, single-role access, and protected resources.",
    description:
      "The SRS starts with secure authentication and role-based access control. Every protected screen must respect role boundaries so patients, doctors, receptionists, and lab staff only see what they are allowed to use.",
    focus: ["Login with valid credentials", "One role per user", "Protected resources denied when unauthenticated"],
    support: ["Token-based sessions", "Clear logout behavior", "Role-aware screen access"],
    requirements: ["REQ-FN-001 to REQ-FN-005", "REQ-NF-SEC-001 to REQ-NF-SEC-003"],
    related: ["patient-journey", "receptionist-workflow", "doctor-workflow"]
  },
  {
    slug: "patient-profiles-history",
    icon: "PH",
    tone: "surface",
    kind: "Core Module",
    title: "Patient Profiles & History",
    summary: "Store core details, let doctors update records, and track who changed what.",
    description:
      "Profiles are the foundation for safe care. The system keeps patient basics, medical history, and record-change traceability so scheduling staff, doctors, and patients each get the right level of visibility.",
    focus: ["Store patient details and identifiers", "Allow doctor updates to medical history", "Track timestamps and editor identity"],
    support: ["Role-specific data visibility", "Reliable retrieval of profile information", "Update history for important changes"],
    requirements: ["REQ-FN-006 to REQ-FN-010", "REQ-NF-SEC-004", "REQ-NF-MNT-001 to REQ-NF-MNT-002"],
    related: ["doctor-workflow", "patient-journey", "audit-security"]
  },
  {
    slug: "appointment-requests",
    icon: "AP",
    tone: "surface",
    kind: "Core Module",
    title: "Appointment Requests",
    summary: "Patients request visits, choose doctors, and monitor status changes.",
    description:
      "Appointment requests sit at the heart of the patient experience. The interface needs a clean request form, status tracking, and safe cancellation while requests remain pending.",
    focus: ["Doctor selection and preferred time range", "Status values such as Pending and Confirmed", "Patient-side status and cancellation visibility"],
    support: ["Straightforward booking forms", "Status cards and timelines", "Integration with scheduling staff decisions"],
    requirements: ["REQ-FN-011 to REQ-FN-014", "REQ-NF-USA-001 to REQ-NF-USA-003"],
    related: ["patient-journey", "receptionist-scheduling", "consultation-bookings"]
  },
  {
    slug: "receptionist-scheduling",
    icon: "SC",
    tone: "surface",
    kind: "Core Module",
    title: "Receptionist Scheduling",
    summary: "Resolve bookings, assign slots, avoid double-booking, and trigger patient updates.",
    description:
      "The scheduling module supports the operational side of appointments. It needs pending queues, slot resolution, conflict prevention, rejection reasons, and reschedule requests.",
    focus: ["Pending request list", "Final slot confirmation", "Double-booking prevention and reschedule handling"],
    support: ["Calendar-style visibility", "Conflict-aware actions", "Notifications after booking changes"],
    requirements: ["REQ-FN-015 to REQ-FN-020", "REQ-NF-PERF-001 to REQ-NF-REL-001"],
    related: ["receptionist-workflow", "appointment-requests", "notifications-history"]
  },
  {
    slug: "diagnosis-prescriptions",
    icon: "DX",
    tone: "surface",
    kind: "Core Module",
    title: "Diagnosis & Prescriptions",
    summary: "Doctor notes, next steps, prescription generation, and pharmacy handoff.",
    description:
      "Doctors must move from appointment to diagnosis and then to medication orders without losing context. This module keeps those steps connected and time-stamped.",
    focus: ["Create diagnosis entries linked to appointments", "Attach notes and next steps", "Confirm prescriptions before patient visibility"],
    support: ["Read-only patient access after approval", "Doctor identity and timestamp recording", "Connected clinical record updates"],
    requirements: ["REQ-FN-023 to REQ-FN-029", "REQ-NF-REL-002", "REQ-NF-MNT-001"],
    related: ["doctor-workflow", "online-pharmacy", "patient-profiles-history"]
  },
  {
    slug: "lab-workflow-results",
    icon: "LB",
    tone: "surface",
    kind: "Core Module",
    title: "Lab Workflow & Results",
    summary: "Doctor test requests, technician schedules, result uploads, and safe release to patients.",
    description:
      "Lab operations span multiple roles. The system covers request creation, technician-facing schedules, in-progress and completed states, doctor notifications, and patient result visibility only after release.",
    focus: ["Doctor lab requests", "Technician status updates and uploads", "Doctor and patient result visibility rules"],
    support: ["Request-to-result linkage", "Notifications after uploads", "Policy-based patient access"],
    requirements: ["REQ-FN-030, REQ-FN-032 to REQ-FN-036", "REQ-FN-038", "REQ-NF-SEC-004 to REQ-NF-REL-002"],
    related: ["lab-technician-workflow", "download-lab-reports", "radiology"]
  },
  {
    slug: "notifications-history",
    icon: "NT",
    tone: "surface",
    kind: "Core Module",
    title: "Notifications & History",
    summary: "Status alerts for patients and doctors with a readable history per user.",
    description:
      "Notifications turn background workflow changes into clear updates. Patients should know when bookings change, and doctors should know when results arrive.",
    focus: ["Patient booking status alerts", "Doctor alerts for new lab results", "Notification history per user"],
    support: ["Clear message history", "Timely workflow awareness", "Reduced communication gaps"],
    requirements: ["REQ-FN-037 to REQ-FN-039", "REQ-NF-USA-001", "REQ-NF-REL-001"],
    related: ["receptionist-scheduling", "lab-workflow-results", "patient-feedback"]
  },
  {
    slug: "ai-decision-support",
    icon: "AI",
    tone: "surface",
    kind: "Core Module",
    title: "AI Decision Support",
    summary: "Generate routine and diet suggestions, but keep final decisions with the doctor.",
    description:
      "The AI feature in the SRS is explicitly decision support only. Doctors enter complaint text, review AI suggestions, and accept, reject, or edit items before sharing approved recommendations with patients.",
    focus: ["Doctor-entered current complaint text", "Routine and diet plan suggestions", "Doctor approval before patient visibility"],
    support: ["Clear labels on AI output", "Approval and edit controls", "Generated and approved timestamps"],
    requirements: ["REQ-FN-040 to REQ-FN-046", "REQ-NF-SEC-006", "REQ-NF-USA-003"],
    related: ["doctor-workflow", "brain-and-spine", "cancer-care"]
  },
  {
    slug: "audit-security",
    icon: "AD",
    tone: "surface",
    kind: "Core Module",
    title: "Audit, Security & Reliability",
    summary: "Critical action logs, secure inputs, stable access, and maintainable structure.",
    description:
      "Beyond visible screens, the SRS requires traceability, secure endpoint behavior, safe password handling, reliable storage, and modular architecture. This topic summarizes those cross-cutting requirements.",
    focus: ["Audit log review for critical actions", "Secure and sanitized data handling", "Graceful failure and maintainable architecture"],
    support: ["User ID and timestamp logging", "Reliability and availability expectations", "Cloud-friendly deployment posture"],
    requirements: ["REQ-FN-047 to REQ-FN-048", "REQ-NF-PERF-001 to REQ-NF-PRT-001"],
    related: ["authentication-rbac", "patient-profiles-history", "lab-technician-workflow"]
  }
];

export const serviceCards = [
  {
    slug: "download-lab-reports",
    icon: "LR",
    tone: "light",
    kind: "Digital Service",
    title: "Download Lab Reports",
    text: "Access your laboratory test results quickly from home.",
    summary: "Patients can view released reports through a secure read-only flow.",
    description:
      "Lab reports should only be visible after the hospital releases them. This page explains the patient-safe report experience and the staff workflows behind it.",
    focus: ["Approved-result only visibility", "Doctor and technician coordination", "Clear patient-facing access"],
    support: ["Secure patient login", "Result release policy", "Notification history after submission"],
    requirements: ["REQ-FN-034 to REQ-FN-039", "REQ-FN-036", "REQ-NF-SEC-004"],
    related: ["lab-workflow-results", "patient-journey", "radiology"]
  },
  {
    slug: "consultation-bookings",
    icon: "CB",
    tone: "light",
    kind: "Digital Service",
    title: "Consultation Bookings",
    text: "Schedule doctor visits and manage appointment times.",
    summary: "Booking tools connect patient requests, receptionist scheduling, and doctor availability.",
    description:
      "Consultation booking is more than a form. It spans request submission, time-slot resolution, doctor availability, and patient confirmation messages.",
    focus: ["Easy request submission", "Status updates after scheduling decisions", "Reduced manual booking confusion"],
    support: ["Doctor selection and date preferences", "Receptionist conflict handling", "Booking notifications"],
    requirements: ["REQ-FN-011 to REQ-FN-020", "REQ-FN-037", "REQ-NF-PERF-001"],
    related: ["appointment-requests", "receptionist-scheduling", "patient-journey"]
  },
  {
    slug: "queue-tracking",
    icon: "QT",
    tone: "light",
    kind: "Digital Service",
    title: "Queue Tracking",
    text: "Check your ongoing number before you arrive at the hospital.",
    summary: "A lightweight operational feature that improves the waiting experience.",
    description:
      "Queue tracking gives patients better arrival timing and reduces crowding. It complements appointment visibility without replacing formal scheduling.",
    focus: ["Live queue awareness", "Better patient arrival planning", "Reduced waiting-room uncertainty"],
    support: ["Clear interface cues", "Fast status refresh", "Integration-ready operational widget"],
    requirements: ["REQ-NF-PERF-001", "REQ-NF-USA-001", "REQ-NF-REL-001"],
    related: ["consultation-bookings", "patient-feedback", "patient-journey"]
  },
  {
    slug: "pre-registration",
    icon: "PR",
    tone: "light",
    kind: "Digital Service",
    title: "Pre-Registration",
    text: "Complete registration details in advance and reduce waiting time.",
    summary: "Collect the right basic details before a hospital visit begins.",
    description:
      "Pre-registration supports faster front-desk handling by collecting profile details ahead of time while keeping role-based access and clear validation in mind.",
    focus: ["Patient detail capture", "Lower front-desk delay", "Cleaner scheduling handoff"],
    support: ["Profile creation and validation", "Clear error messaging", "Role-aware staff access"],
    requirements: ["REQ-FN-006 to REQ-FN-010", "REQ-NF-SEC-005", "REQ-NF-USA-001"],
    related: ["patient-profiles-history", "receptionist-workflow", "mother-and-baby"]
  },
  {
    slug: "online-pharmacy",
    icon: "RX",
    tone: "light",
    kind: "Digital Service",
    title: "Online Pharmacy",
    text: "Order prescribed medication and coordinate delivery.",
    summary: "Supports the doctor-confirmed prescription flow described in the SRS.",
    description:
      "This service starts after a doctor confirms a prescription. Patients see a read-only version and can move into medication fulfilment through a connected pharmacy experience.",
    focus: ["Prescription-linked ordering", "Read-only patient view after confirmation", "Simple medication guidance handoff"],
    support: ["Doctor confirmation first", "Prescription timestamp and prescriber tracking", "Convenient next-step action for patients"],
    requirements: ["REQ-FN-026 to REQ-FN-029", "REQ-NF-USA-003", "REQ-NF-REL-002"],
    related: ["diagnosis-prescriptions", "patient-journey", "payment-portal"]
  },
  {
    slug: "wellness-packages",
    icon: "WL",
    tone: "light",
    kind: "Digital Service",
    title: "Wellness Packages",
    text: "Browse preventive healthcare packages and routine checkups.",
    summary: "Provides a gentle entry point into preventive and follow-up care planning.",
    description:
      "Wellness packages bring together preventive care, screening, and doctor-guided next steps. They pair naturally with AI-assisted routines and long-term patient engagement.",
    focus: ["Preventive care exploration", "Simple package explanations", "Connection to follow-up appointments"],
    support: ["Package discovery", "Doctor-approved guidance", "Family-friendly care planning"],
    requirements: ["REQ-FN-040 to REQ-FN-045", "REQ-NF-USA-003", "REQ-NF-USA-002"],
    related: ["ai-decision-support", "mother-and-baby", "ivf-and-fertility"]
  },
  {
    slug: "payment-portal",
    icon: "PY",
    tone: "light",
    kind: "Digital Service",
    title: "Payment Portal",
    text: "Handle hospital bill payments through a secure online flow.",
    summary: "A convenience feature that fits the same theme without making the experience too heavy.",
    description:
      "The payment portal reduces unnecessary desk visits and gives patients a clean follow-up step after appointments, diagnostics, or package bookings.",
    focus: ["Simpler post-visit payment flow", "Secure-looking and consistent interface", "Convenient next step from services or bookings"],
    support: ["Linked service actions", "Patient confidence through clear UI", "Future-ready billing integration"],
    requirements: ["REQ-NF-SEC-001 to REQ-NF-SEC-005", "REQ-NF-USA-001", "REQ-NF-PRT-001"],
    related: ["consultation-bookings", "online-pharmacy", "ivf-and-fertility"]
  },
  {
    slug: "patient-feedback",
    icon: "FB",
    tone: "light",
    kind: "Digital Service",
    title: "Patient Feedback",
    text: "Share your experience and help improve patient care.",
    summary: "A small but useful loop for quality and service improvement.",
    description:
      "Feedback helps Medicare refine patient-visible flows, uncover friction in scheduling or communication, and keep the experience aligned with usability requirements.",
    focus: ["Structured patient feedback", "Service quality visibility", "Continuous improvement support"],
    support: ["Simple submission experience", "Follow-up quality review", "Patient trust and transparency"],
    requirements: ["REQ-NF-USA-001 to REQ-NF-USA-003", "REQ-NF-REL-001", "REQ-NF-MNT-002"],
    related: ["queue-tracking", "notifications-history", "patient-journey"]
  }
];

export const nonFunctionalCards = [
  { code: "REQ-NF-PERF-001 to 002", title: "Performance", text: "Main pages should load within 3 seconds and support at least 50 concurrent active users." },
  { code: "REQ-NF-SEC-001 to 006", title: "Security", text: "RBAC, token-based auth, secure password storage, input validation, and patient data isolation." },
  { code: "REQ-NF-USA-001 to 003", title: "Usability", text: "Clear errors, desktop-browser support, and simple language for patient-facing recommendations." },
  { code: "REQ-NF-REL-001 to 002", title: "Reliability", text: "Failures should be handled gracefully without losing confirmed appointments, prescriptions, or lab data." },
  { code: "REQ-NF-MNT-001 to 002", title: "Maintainability", text: "Modular architecture and useful server-side logging for debugging and long-term maintenance." },
  { code: "REQ-NF-PRT-001", title: "Portability", text: "Deployable on common cloud platforms that support Node.js and MySQL." }
];

export const footerColumns = [
  {
    title: "Medicare Health Network",
    items: ["Medicare Medical", "Medicare Surgical", "Medicare Central", "Medicare Matara", "Medicare Kandy", "Medicare Galle"]
  },
  {
    title: "Centres Of Excellence",
    items: ["Heart Centres", "Brain & Spine", "Kidney Transplant", "Urology Services", "Mother & Baby", "IVF & Fertility"]
  },
  {
    title: "Quick Contacts",
    items: ["Medicare Central: +94 11 466 5500", "Medicare Surgical: +94 11 452 4400", "Medicare Medical: +94 11 452 3300", "Emergency Hotline: 1313"]
  }
];

export const featuredTopics = [...careTiles.slice(0, 4), ...serviceCards.slice(0, 4)];
export const allTopics = [...careTiles, ...serviceCards, ...roleCards, ...moduleCards];
export const topicMap = Object.fromEntries(allTopics.map((topic) => [topic.slug, topic]));

export function getTopicBySlug(slug) {
  return topicMap[slug] || null;
}
