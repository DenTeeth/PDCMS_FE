import Navigation from "@/components/layout/Navigation";
import HeroSection from "@/components/homepage/HeroSection";
import FeaturesSection from "@/components/homepage/FeaturesSection";
import ServicesSection from "@/components/homepage/ServicesSection";
import DoctorsSection from "@/components/homepage/DoctorsSection";
import TeamSection from "@/components/homepage/TeamSection";
import AppointmentSection from "@/components/homepage/AppointmentSection";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <ServicesSection />
      <DoctorsSection />
      <AppointmentSection />
      <Footer />
    </div>
  );
}
