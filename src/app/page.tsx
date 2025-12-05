import dynamic from "next/dynamic";
import Navigation from "@/components/layout/Navigation";
import HeroSection from "@/components/homepage/HeroSection";
import StatsSection from "@/components/homepage/StatsSection";

// Lazy load below-the-fold components for better initial load performance
const AboutSection = dynamic(() => import("@/components/homepage/AboutSection"), {
  loading: () => <div className="min-h-[400px] bg-background" />,
});

const FeaturesSection = dynamic(() => import("@/components/homepage/FeaturesSection"), {
  loading: () => <div className="min-h-[400px] bg-background" />,
});

const ServicesSection = dynamic(() => import("@/components/homepage/ServicesSection"), {
  loading: () => <div className="min-h-[500px] bg-background" />,
});

const DoctorsSection = dynamic(() => import("@/components/homepage/DoctorsSection"), {
  loading: () => <div className="min-h-[500px] bg-background" />,
});

const TestimonialsSection = dynamic(() => import("@/components/homepage/TestimonialsSection"), {
  loading: () => <div className="min-h-[400px] bg-background" />,
});

const FAQSection = dynamic(() => import("@/components/homepage/FAQSection"), {
  loading: () => <div className="min-h-[500px] bg-background" />,
});

const AppointmentSection = dynamic(() => import("@/components/homepage/AppointmentSection"), {
  loading: () => <div className="min-h-[400px] bg-background" />,
});

const Footer = dynamic(() => import("@/components/layout/Footer"), {
  loading: () => <div className="min-h-[200px] bg-background" />,
});

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <StatsSection />
      <AboutSection />
      <FeaturesSection />
      <ServicesSection />
      <DoctorsSection />
      <TestimonialsSection />
      <AppointmentSection />
      <FAQSection />
      <Footer />
    </div>
  );
}
