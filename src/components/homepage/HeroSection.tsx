import Link from "next/link";
import Image from "next/image";
import Hero from "@/img/Hero.jpg";

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-r from-blue-50 to-blue-100 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Professional dental clinic
              <span className="block text-blue-500">with modern technology</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              We believe in providing the best dental services with an experienced team of doctors and the most advanced technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="#appointment"
                className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium text-center"
              >
                Book Appointment
              </Link>
              <Link
                href="#services"
                className="border border-blue-500 text-blue-500 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium text-center"
              >
                View Services
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
              <div className="pointer-events-none absolute -inset-16 -z-10 bg-gradient-to-tr from-cyan-100 to-indigo-100 blur-3xl" />
              <div className="relative aspect-[16/10] sm:aspect-[4/3] lg:aspect-[16/9]">
                <Image
                  src={Hero}
                  alt="Dental Clinic Hero"
                  fill
                  priority
                  sizes="(min-width: 1024px) 560px, (min-width: 640px) 75vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
          </div>
        </div>
    </section>
  );
}