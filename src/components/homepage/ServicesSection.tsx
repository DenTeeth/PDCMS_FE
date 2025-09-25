"use client";

import Link from "next/link";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

interface Service {
  icon: string;
  title: string; 
  description: string;
  link: string;
}

const services: Service[] = [
  {
    icon: "👶",
    title: "Pediatric Dentistry",
    description: "Pediatric dentistry is specially designed to ensure infants, children, and adolescents receive the best dental care...",
    link: "/services/pediatric"
  },
  {
    icon: "🦷", 
    title: "Implant Dentistry",
    description: "Implant dentistry replaces missing teeth by surgically placing artificial roots into the jawbone...",
    link: "/services/implants"
  },
  {
    icon: "✨",
    title: "Cosmetic Dentistry", 
    description: "Cosmetic dentistry mainly focuses on improving the appearance of teeth, including whitening...",
    link: "/services/cosmetic"
  },
  {
    icon: "🪥",
    title: "General Checkup", 
    description: "Routine checkups and cleanings to keep your teeth and gums healthy...",
    link: "/services/general"
  },
  {
    icon: "😬",
    title: "Orthodontics", 
    description: "Braces and aligners to correct misaligned teeth and jaws...",
    link: "/services/orthodontics"
  },
  {
    icon: "🦷",
    title: "Root Canal", 
    description: "Treatment to repair and save badly decayed or infected teeth...",
    link: "/services/root-canal"
  }
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Our Services
          </h2>
          <p className="text-xl text-gray-600">
            We provide a full range of dental services and continuously research new technologies
          </p>
        </div>

        <Carousel className="w-full" autoplay intervalMs={2000} pauseOnHover>
          <CarouselContent>
            {services.map((service, idx) => (
              <CarouselItem key={idx}>
                <div className="bg-white rounded-2xl p-8 h-full">
                  <div className="text-4xl mb-6">{service.icon}</div>
                  <h3 className="text-xl font-semibold mb-4">{service.title}</h3>
                  <p className="text-gray-600 mb-6">
                    {service.description}
                  </p>
                  <Link href={service.link} className="text-blue-500 font-medium hover:underline">
                    Details →
                  </Link>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="mt-6 flex items-center justify-center gap-4">
            <CarouselPrevious />
            <CarouselNext />
          </div>
        </Carousel>
      </div>
    </section>
  );
}