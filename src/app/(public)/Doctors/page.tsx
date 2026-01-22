"use client";

import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/layout/Navigation";
import DynamicBreadcrumb from "@/components/ui/DynamicBreadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/layout/Footer";
import { useTranslations } from "next-intl";

interface Doctor {
	id: number;
	name: string;
	specialty: string;
	experience: string;
	description: string;
	avatar: string;
}

export default function DoctorsPage() {
	const t = useTranslations('Doctors');

	const doctors: Doctor[] = [0, 1, 2, 3].map(i => ({
		id: i + 1,
		name: t(`homeDoctors.${i}.name`),
		specialty: t(`homeDoctors.${i}.specialty`),
		experience: t(`homeDoctors.${i}.experience`),
		description: t(`homeDoctors.${i}.description`),
		avatar: `/images/doctors/dentist${i + 1}.webp`,
	}));

	return (
		<>
			<main className="min-h-screen bg-white">
				<Navigation />
				<section className="bg-gradient-to-r from-accent to-secondary py-10">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<DynamicBreadcrumb />
						<h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-4">{t('title')}</h1>
						<p className="text-gray-600 mt-2 max-w-2xl">
							{t('subtitle')}
						</p>
					</div>
				</section>

				<section className="py-12">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
							{doctors.map((doctor) => (
								<Card key={doctor.id} className="hover:shadow-lg transition-shadow duration-300 flex flex-col">
									<CardHeader className="text-center">
										<div className="relative w-full h-64 mb-4 rounded-t-lg overflow-hidden">
											<Image
												src={doctor.avatar}
												alt={doctor.name}
												fill
												className="object-cover object-top"
												sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
												quality={85}
											/>
										</div>
										<CardTitle className="text-xl text-gray-900">{doctor.name}</CardTitle>
										<CardDescription className="text-primary font-semibold">
											{doctor.specialty}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4 flex-grow flex flex-col">
										<div className="flex-grow">
											<h4 className="font-semibold text-gray-900 mb-1">{t('description')}</h4>
											<p className="text-gray-600 text-sm">{doctor.description}</p>
										</div>

										<div className="pt-4 mt-auto">
											<Link
												href="/login"
												className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors inline-block text-center"
											>
												{t('bookAppointment')}
											</Link>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</section>

				{/* Statistics Section */}
				<section className="bg-gray-50 py-12">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="text-center mb-8">
							<h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
								Tại sao chọn đội ngũ của chúng tôi?
							</h2>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
							<div className="text-center">
								<div className="text-3xl font-bold text-primary mb-2">15+</div>
								<p className="text-gray-600">Năm kinh nghiệm trung bình</p>
							</div>
							<div className="text-center">
								<div className="text-3xl font-bold text-primary mb-2">10,000+</div>
								<p className="text-gray-600">Bệnh nhân đã điều trị</p>
							</div>
							<div className="text-center">
								<div className="text-3xl font-bold text-primary mb-2">98%</div>
								<p className="text-gray-600">Tỷ lệ hài lòng của khách hàng</p>
							</div>
							<div className="text-center">
								<div className="text-3xl font-bold text-primary mb-2">24/7</div>
								<p className="text-gray-600">Hỗ trợ khẩn cấp</p>
							</div>
						</div>
					</div>
				</section>
			</main>
			<Footer />
		</>
	);
}