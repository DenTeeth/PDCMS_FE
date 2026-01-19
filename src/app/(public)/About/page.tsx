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
    <main className="min-h-screen bg-gradient-to-b from-accent via-white to-accent text-foreground">
      <Navigation />
      {/* Header (match Services) */}
      <section className="bg-gradient-to-r from-accent to-secondary py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DynamicBreadcrumb />

          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Giới thiệu về chúng tôi</h1>
          <p className="text-gray-600 mt-2 max-w-2xl">Chúng tôi là một phòng khám nha khoa hiện đại tập trung vào sự thoải mái, chính xác và sức khỏe răng miệng lâu dài.</p>
        </div>
      </section>

      {/* Intro */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-6 py-16">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary ring-1 ring-secondary">
              <FontAwesomeIcon icon={faTooth} className="h-4 w-4" />
              Giới thiệu DenTeeth
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Chăm sóc nụ cười bằng công nghệ hiện đại và trái tim
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-slate-600">
              Chúng tôi kết hợp các nha sĩ giàu kinh nghiệm, thiết bị tiên tiến và tư duy đặt bệnh nhân lên hàng đầu để mang đến cho bạn trải nghiệm yên tâm và tự tin.
            </p>
            <div className="mt-8 inline-flex gap-4">
              <Link href="/" className="inline-flex items-center">
                <Button className="bg-primary hover:bg-primary/90">
                  Đặt lịch hẹn
                  <FontAwesomeIcon icon={faArrowRight} className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/services" className="inline-flex items-center">
                <Button variant="outline" className="border-primary text-primary hover:bg-accent">Khám phá dịch vụ</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Năm kinh nghiệm", value: "12+", icon: faClock },
            { label: "Bác sĩ", value: "18", icon: faUsers },
            { label: "Giải thưởng", value: "9", icon: faAward },
            { label: "Đánh giá", value: "4.9/5", icon: faStar },
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
                <CardTitle>Sứ mệnh của chúng tôi</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600">
                Cung cấp dịch vụ nha khoa chính xác, thoải mái bằng cách kết hợp chuyên môn, sự đồng cảm và công nghệ.
              </CardContent>
            </Card>
          </motion.div>

          <div className="lg:col-span-2 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {[
              {
                title: "Sự thoải mái của bệnh nhân",
                desc: "Chăm sóc minh bạch, nhẹ nhàng ở mọi lần khám.",
                icon: faShieldHalved,
              },
              {
                title: "Đội ngũ giàu kinh nghiệm",
                desc: "Chuyên gia về chỉnh nha, cấy ghép và nhiều hơn nữa.",
                icon: faUsers,
              },
              {
                title: "Công nghệ hiện đại",
                desc: "Chụp ảnh kỹ thuật số, phẫu thuật có hướng dẫn, vệ sinh phòng sạch.",
                icon: faTooth,
              },
              {
                title: "Đảm bảo chất lượng",
                desc: "Kết quả nhất quán được hỗ trợ bởi quy trình và kiểm toán.",
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
            <h2 className="text-2xl font-semibold text-slate-900">Gặp gỡ các bác sĩ của chúng tôi</h2>
            <p className="text-slate-600">Một đội ngũ thân thiện tận tâm với nụ cười của bạn.</p>
          </div>
          <Link href="/services" className="hidden sm:inline-flex">
            <Button variant="outline">Xem toàn bộ đội ngũ</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {["BS. Nguyễn", "BS. Trần", "BS. Lê"].map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Card className="h-full">
                <CardContent className="flex items-center gap-4 p-5">
                  {}
                  <div>
                    <p className="font-semibold text-slate-800">{name}</p>
                    <p className="text-sm text-slate-500">Nha sĩ</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <Card className="overflow-hidden bg-gradient-to-r from-primary to-secondary text-primary-foreground">
          <CardContent className="relative p-8 sm:p-10">
            <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-semibold">Sẵn sàng cho một nụ cười rạng rỡ hơn?</h3>
                <p className="text-primary-foreground/80">
                  Đặt lịch hẹn hôm nay và trải nghiệm dịch vụ nha khoa tốt nhất.
                </p>
              </div>
              <Link href="/">
                <Button variant="secondary" className="text-primary">
                  Đặt lịch ngay
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


