"use client";

import Link from "next/link";
import { useState } from "react";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbLink, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navigation from "@/components/layout/Navigation";
import DynamicBreadcrumb from "@/components/ui/DynamicBreadcrumb";
import Footer from "@/components/layout/Footer";
import { useTranslations } from "next-intl";

interface Service {
	title: string;
	description: string;
	link: string;
	price?: string;
	details?: string;
}

export default function ServicesPage() {
	const t = useTranslations('Services');
	const [selectedService, setSelectedService] = useState<Service | null>(null);

	const services: Service[] = [0, 1, 2, 3, 4, 5].map(i => ({
		title: t(`pageCards.${i}.title`),
		description: t(`pageCards.${i}.description`),
		link: t(`pageCards.${i}.link`),
		details: t(`pageCards.${i}.details`, { defaultValue: t(`pageCards.${i}.description`) })
	}));

	return (
		<>
			<main className="min-h-screen bg-background">
				<Navigation />
				<section className="bg-gradient-to-r from-accent to-secondary py-10">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<DynamicBreadcrumb />

						<h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{t('title')}</h1>
						<p className="text-gray-600 mt-2 max-w-2xl">{t('subtitle')}</p>
					</div>
				</section>

				<section className="py-12">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
							{services.map((s, i) => (
								<button
									key={i}
									onClick={() => setSelectedService(s)}
									className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-all text-left w-full hover:border-primary"
								>
									<h3 className="text-xl font-semibold mb-3 text-primary">{s.title}</h3>
									<p className="text-gray-600 mb-4">{s.description}</p>
									<span className="text-primary font-medium hover:underline inline-flex items-center">
										Xem chi tiết
										<svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
										</svg>
									</span>
								</button>
							))}
						</div>
					</div>
				</section>

				{/* Modal chi tiết dịch vụ */}
				<Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle className="text-2xl text-primary">{selectedService?.title}</DialogTitle>
							<DialogDescription className="text-base">
								Thông tin chi tiết về dịch vụ
							</DialogDescription>
						</DialogHeader>
						<div className="space-y-4">
							<div>
								<h4 className="font-semibold text-gray-900 mb-2">Mô tả dịch vụ</h4>
								<p className="text-gray-600 leading-relaxed">{selectedService?.details}</p>
							</div>
							<div className="pt-4 border-t">
								<h4 className="font-semibold text-gray-900 mb-3">Đặt lịch tư vấn</h4>
								<div className="flex flex-col sm:flex-row gap-3">
									<Link
										href="/login"
										className="flex-1 inline-block text-center bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
									>
										Tạo tài khoản
									</Link>
									<a
										href="tel:0764009726"
										className="flex-1 inline-block text-center bg-secondary text-white px-6 py-3 rounded-lg hover:bg-secondary/90 transition-colors font-medium"
									>
										Gọi ngay: 0764009726
									</a>
								</div>
							</div>
						</div>
					</DialogContent>
				</Dialog>
				<Footer />
			</main>
		</>
	);
}
