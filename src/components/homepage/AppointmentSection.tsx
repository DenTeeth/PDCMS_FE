"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function AppointmentSection() {
  const t = useTranslations('Appointment');

  return (
    <section id="appointment" className="py-20 bg-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Liên hệ với chúng tôi
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Tạo tài khoản để đặt lịch hẹn trực tuyến hoặc gọi ngay cho chúng tôi để được tư vấn.
            </p>

            <div className="space-y-4">
              <Link
                href="/login"
                className="w-full inline-block text-center bg-primary text-white px-8 py-4 rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg shadow-lg"
              >
                Tạo tài khoản ngay
              </Link>

              <a
                href="tel:0764009726"
                className="w-full inline-block text-center bg-secondary text-white px-8 py-4 rounded-lg hover:bg-secondary/90 transition-colors font-semibold text-lg shadow-lg"
              >
                Gọi ngay: 0764009726
              </a>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-semibold mb-6">Thông tin liên hệ</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 text-primary flex-shrink-0 mt-1">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{t('contact.address.label')}</p>
                  <p className="text-gray-600">{t('contact.address.value')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 text-primary flex-shrink-0 mt-1">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{t('contact.hours.label')}</p>
                  <p className="text-gray-600">{t('contact.hours.value')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 text-primary flex-shrink-0 mt-1">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">{t('contact.email.label')}</p>
                  <p className="text-gray-600">{t('contact.email.value')}</p>
                </div>
              </div>
            </div>

            {/* Google Map */}
            <div className="rounded-lg overflow-hidden border-2 border-gray-200">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.2857818793947!2d106.79623631533497!3d10.850888092244415!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175270e6e3e3b45%3A0x4e5c0e8b8e8e8e8e!2zTMO0IEUyYS03LCDEkMaw4budbmcgRDEsIEtodSBDw7RuZyBuZ2jhu4cgY2FvLCBMb25nIFRo4bqhbmggTcO9LCBUSOG7pyDEkOG7qWMsIFRow6BuaCBwaOG7kSBI4buTIENow60gTWluaA!5e0!3m2!1svi!2s!4v1706000000000!5m2!1svi!2s"
                width="100%"
                height="250"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}