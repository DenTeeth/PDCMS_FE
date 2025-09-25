"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTooth,
  faUsers,
  faStar,
  faShieldHalved,
  faClock,
  faAward,
  faArrowRight,
} from "@fortawesome/free-solid-svg-icons";
import Navigation from "@/components/layout/Navigation";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbLink, BreadcrumbPage } from "@/components/ui/breadcrumb";
import DynamicBreadcrumb from "@/components/ui/DynamicBreadcrumb";
import Footer from "@/components/layout/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-50 text-slate-800">
        <Navigation />
      {/* Header (match Services) */}
      <section className="bg-gradient-to-r from-blue-50 to-blue-100 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DynamicBreadcrumb />

          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">About Us</h1>
          <p className="text-gray-600 mt-2 max-w-2xl">We are a modern dental clinic focused on comfort, precision, and long-term oral health.</p>
        </div>
      </section>

      {/* Intro */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-6 py-16">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
              <FontAwesomeIcon icon={faTooth} className="h-4 w-4" />
              About DenTeeth
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Caring for smiles with modern technology and heart
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              We combine experienced dentists, advanced equipment, and a patient-first mindset to bring you a calm, confident experience.
            </p>
            <div className="mt-8 inline-flex gap-4">
              <Link href="/" className="inline-flex items-center">
                <Button className="bg-blue-500 hover:bg-blue-600">
                  Book an appointment
                  <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/services" className="inline-flex items-center">
                <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50">Explore services</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Years", value: "12+", icon: faClock },
            { label: "Doctors", value: "18", icon: faUsers },
            { label: "Awards", value: "9", icon: faAward },
            { label: "Rating", value: "4.9/5", icon: faStar },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600/10 text-cyan-700">
                    <FontAwesomeIcon icon={s.icon} className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500">{s.label}</p>
                    <p className="text-lg font-semibold text-slate-800">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mission & Values */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader>
                <CardTitle>Our mission</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600">
                Provide precise, comfortable dental care by blending expertise, empathy, and technology.
              </CardContent>
            </Card>
          </motion.div>

          <div className="lg:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              {
                title: "Patient-first",
                desc: "Transparent, gentle care at every visit.",
                icon: faShieldHalved,
              },
              {
                title: "Experienced team",
                desc: "Specialists across orthodontics, implants, and more.",
                icon: faUsers,
              },
              {
                title: "Modern tech",
                desc: "Digital imaging, guided surgery, clean-room hygiene.",
                icon: faTooth,
              },
              {
                title: "Quality guaranteed",
                desc: "Consistent outcomes backed by protocols and audits.",
                icon: faAward,
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card className="h-full">
                  <CardHeader className="flex-row items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-700">
                      <FontAwesomeIcon icon={f.icon} className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-slate-600">{f.desc}</CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team preview */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Meet our doctors</h2>
            <p className="text-slate-600">A friendly team dedicated to your smile.</p>
          </div>
          <Link href="/services" className="hidden sm:inline-flex">
            <Button variant="outline">See full team</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {["Dr. Nguyen", "Dr. Tran", "Dr. Le"].map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Card className="h-full">
                <CardContent className="flex items-center gap-4 p-5">
                  {/* <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-white shadow">
                    <Image
                      src={`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                        name
                      )}`}
                      alt={name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div> */}
                  <div>
                    <p className="font-semibold text-slate-800">{name}</p>
                    <p className="text-sm text-slate-500">Dentist</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <Card className="overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-500 text-white">
          <CardContent className="relative p-8 sm:p-10">
            <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-semibold">Ready for a brighter smile?</h3>
                <p className="text-white/80">
                  Book an appointment today and experience the best in dental care.
                </p>
              </div>
              <Link href="/">
                <Button variant="secondary" className="text-blue-700">
                  Book now
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
      <Footer />
    </main>
  );
}


