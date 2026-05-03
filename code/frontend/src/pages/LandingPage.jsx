import ExplorerSection from "../components/landing/ExplorerSection";
import AppointmentSection from "../components/landing/AppointmentSection";
import DoctorsSection from "../components/landing/DoctorsSection";
import FooterSection from "../components/landing/FooterSection";
import HeroSection from "../components/landing/HeroSection";
import Navbar from "../components/landing/Navbar";
import NetworkSection from "../components/landing/NetworkSection";
import QualitySection from "../components/landing/QualitySection";
import ServicesSection from "../components/landing/ServicesSection";
import SymptomSection from "../components/landing/SymptomSection";
import WorkflowSection from "../components/landing/WorkflowSection";

export default function LandingPage({ onLogin, onSignup, onLogout, onWorkspace, onBookAppointment, session, onSelectTopic, onSelectDoctor }) {
  return (
    <div className="landing-page">
      <Navbar onLogin={onLogin} onSignup={onSignup} onLogout={onLogout} onWorkspace={onWorkspace} session={session} />
      <HeroSection
        onLogin={onLogin}
        onSignup={onSignup}
        onBookAppointment={onBookAppointment}
        onWorkspace={onWorkspace}
        session={session}
      />
      <SymptomSection />
      <ExplorerSection onSelectTopic={onSelectTopic} />
      <NetworkSection onSelectTopic={onSelectTopic} />
      <DoctorsSection onSelectDoctor={onSelectDoctor} />
      <QualitySection />
      <WorkflowSection onSelectTopic={onSelectTopic} />
      <ServicesSection onSelectTopic={onSelectTopic} />
      <AppointmentSection onLogin={onLogin} onBookAppointment={onBookAppointment} session={session} />
      <FooterSection />
    </div>
  );
}
