import React, { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:3000";

export default function TelehealthRoom({ appointment, token, isDoctor, onClose }) {
  const [localStream, setLocalStream] = useState(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatLog, setChatLog] = useState([
    { sender: "System", text: "Secure encrypted connection established." }
  ]);

  // Doctor diagnosis form states
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState("");

  const localVideoRef = useRef(null);

  // Initialize camera/mic media stream
  useEffect(() => {
    let active = true;
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (active) {
          setLocalStream(stream);
        }
      } catch (err) {
        console.warn("Could not capture local video stream:", err);
        setChatLog((log) => [
          ...log,
          { sender: "System", text: "Camera capture blocked or not detected. Displaying avatar placeholder instead." }
        ]);
      }
    }

    startCamera();

    // Auto opponent simulated greeting
    const timer = setTimeout(() => {
      if (active) {
        const greeting = isDoctor 
          ? `Hello, I'm ready. Let's start the consultation.`
          : `Hello Dr. ${appointment.doctorUsername || "Consultant"}. I am here.`;
        setChatLog((log) => [
          ...log,
          { sender: isDoctor ? "Patient" : "Doctor", text: greeting }
        ]);
      }
    }, 2500);

    return () => {
      active = false;
      clearTimeout(timer);
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Sync stream tracks with UI toggles
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = cameraOn;
      });
    }
  }, [cameraOn, localStream]);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = micOn;
      });
    }
  }, [micOn, localStream]);

  // Bind local stream to video element when it mounts
  useEffect(() => {
    if (localVideoRef.current && localStream && cameraOn) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, cameraOn]);

  function handleSendChat(e) {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const msg = chatMessage;
    setChatLog((log) => [...log, { sender: "You", text: msg }]);
    setChatMessage("");

    // Simulate reply after 2 seconds
    setTimeout(() => {
      const replies = [
        "Let me check your symptoms.",
        "Understood. Let's document this.",
        "Checking clinical records now.",
        "Can you describe the pain or discomfort?",
        "Okay. Let's get this prescription ready."
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      setChatLog((log) => [
        ...log,
        { sender: isDoctor ? "Patient" : "Doctor", text: randomReply }
      ]);
    }, 2000);
  }

  async function handleDoctorComplete(e) {
    e.preventDefault();
    if (!diagnosis.trim()) {
      setCompleteError("A clinical diagnosis is required to complete the appointment.");
      return;
    }

    setCompleting(true);
    setCompleteError("");

    try {
      // 1. Post diagnosis log to patient medical profile records
      const logRes = await fetch(`${API_BASE}/api/doctor/patients/${appointment.patient.id}/diagnosis-logs`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          diagnosis: diagnosis.trim(),
          prescription: prescription.trim() || "No medication prescribed."
        })
      });
      if (!logRes.ok) {
        const errData = await logRes.json().catch(() => ({}));
        throw new Error(errData.error || "Could not save diagnosis log");
      }

      // 2. Complete the appointment status
      const completeRes = await fetch(`${API_BASE}/api/doctor/appointments/${appointment.id}/complete`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!completeRes.ok) {
        const errData = await completeRes.json().catch(() => ({}));
        throw new Error(errData.error || "Could not complete appointment status");
      }

      onClose();
    } catch (err) {
      console.error(err);
      setCompleteError(err.message || "Failed to submit logs and complete call.");
    } finally {
      setCompleting(false);
    }
  }

  const opponentName = isDoctor 
    ? appointment.patient?.fullName || "Patient" 
    : `Dr. ${appointment.doctorUsername || "Consultant"}`;

  return (
    <div className="telehealth-overlay" role="dialog" aria-modal="true">
      <div className={`telehealth-container ${isDoctor ? "doctor-layout" : ""}`}>
        {/* Main call grid */}
        <div className="telehealth-video-pane">
          <div className="telehealth-header">
            <div>
              <span className="live-badge">🔴 LIVE</span>
              <h2>Telemedicine Consultation</h2>
            </div>
            <p className="room-id text-xs opacity-80">Room: APT-{appointment.id}</p>
          </div>

          <div className="video-grid">
            {/* Opponent video */}
            <div className="video-card opponent-video">
              <div className="video-placeholder">
                <div className="avatar-pulse">
                  {opponentName.charAt(0)}
                </div>
                <p>{opponentName}</p>
                <span className="text-xs opacity-75 font-light">Connected (Simulated Feed)</span>
              </div>
            </div>

            {/* Local video (Webcam stream) */}
            <div className="video-card local-video">
              {localStream && cameraOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="video-placeholder bg-slate-900 text-slate-400">
                  <div className="avatar-pulse">
                    You
                  </div>
                  <p>Camera {cameraOn ? "Capturing..." : "Off"}</p>
                </div>
              )}
              <span className="local-name-tag">You (Local Feed)</span>
            </div>
          </div>

          {/* Call Controls Dock */}
          <div className="telehealth-controls">
            <button
              onClick={() => setMicOn(!micOn)}
              className={`control-btn ${!micOn ? "muted" : ""}`}
              title={micOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {micOn ? "🎙️ Mic On" : "🔇 Mic Muted"}
            </button>
            <button
              onClick={() => setCameraOn(!cameraOn)}
              className={`control-btn ${!cameraOn ? "muted" : ""}`}
              title={cameraOn ? "Turn Camera Off" : "Turn Camera On"}
            >
              {cameraOn ? "📷 Video On" : "📹 Video Off"}
            </button>
            <button
              onClick={() => setSharingScreen(!sharingScreen)}
              className={`control-btn ${sharingScreen ? "active" : ""}`}
              title="Share Screen"
            >
              🖥️ {sharingScreen ? "Sharing" : "Share"}
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className={`control-btn ${showChat ? "active" : ""}`}
              title="Toggle Consultation Chat"
            >
              💬 Chat
            </button>
            <button
              onClick={onClose}
              className="control-btn hangup-btn"
              title="Leave Room"
            >
              🛑 Hang Up
            </button>
          </div>

          {/* Chat Side Overlay Panel */}
          {showChat && (
            <div className="telehealth-chat-sidebar">
              <div className="chat-header">
                <h3>Consultation Chat</h3>
                <button onClick={() => setShowChat(false)}>×</button>
              </div>
              <div className="chat-log-box">
                {chatLog.map((log, index) => (
                  <div key={index} className={`chat-message-row ${log.sender === "You" ? "sent" : "received"}`}>
                    <span className="sender">{log.sender}</span>
                    <p className="text">{log.text}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendChat} className="chat-input-bar">
                <input
                  type="text"
                  placeholder="Type clinical inquiry..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                />
                <button type="submit">Send</button>
              </form>
            </div>
          )}
        </div>

        {/* Doctor Consultation Prescription Panel */}
        {isDoctor && (
          <div className="telehealth-clinical-panel">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-3 mb-4">
              📝 Consultation Notes
            </h3>
            <form onSubmit={handleDoctorComplete} className="space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Diagnosis Summary *</label>
                  <input
                    type="text"
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="e.g. Acute seasonal influenza, moderate symptoms"
                    className="field mt-1 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Prescription Details</label>
                  <textarea
                    rows="8"
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    placeholder="Medications, dosage, and intake directions... e.g. Paracetamol 500mg, 1 tablet every 6 hours."
                    className="field mt-1 w-full"
                  />
                </div>
                {completeError && (
                  <p className="text-xs text-rose-600 border border-rose-200 bg-rose-50 p-2.5 rounded-lg">
                    {completeError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={completing}
                className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 mt-4"
              >
                {completing ? "Saving Details..." : "💾 Save & End Consultation"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
