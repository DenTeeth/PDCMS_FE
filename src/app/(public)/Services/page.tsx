"use client";

import Link from "next/link";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbLink, BreadcrumbPage } from "@/components/ui/breadcrumb";
import Navigation from "@/components/layout/Navigation";
import DynamicBreadcrumb from "@/components/ui/DynamicBreadcrumb";
import Footer from "@/components/layout/Footer";
import { useTranslations } from "next-intl";

interface Service {
	title: string;
	description: string;
	link: string;
}

export default function ServicesPage() {
	const t = useTranslations('Services');

	const services: Service[] = [0, 1, 2, 3, 4, 5].map(i => ({
		title: t(`pageCards.${i}.title`),
		description: t(`pageCards.${i}.description`),
		link: t(`pageCards.${i}.link`)
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
								<div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
									<h3 className="text-xl font-semibold mb-2 text-primary">{s.title}</h3>
									<p className="text-gray-600 mb-4">{s.description}</p>
									<Link href={s.link} className="text-primary font-medium hover:underline">{t('moreDetails')}</Link>
								</div>
							))}
						</div>
					</div>
				</section>
				<Footer />
			</main>
		</>
	);
}
