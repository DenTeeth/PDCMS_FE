"use client";

import Link from "next/link";
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
	education: string;
	description: string;
	image: string;
	schedule: string[];
	languages: string[];
}

const doctors: Doctor[] = [
	{
		id: 1,
		name: "Dr. Nguyen Van An",
		specialty: "Orthodontics",
		experience: "15+ years of experience",
		education: "Master of Dentistry - Hanoi Medical University",
		description: "Leading specialist in orthodontics with many years of experience treating complex cases.",
		image: "/api/placeholder/300/300",
		schedule: ["Mon-Fri: 8:00-17:00", "Sat: 8:00-12:00"],
		languages: ["Vietnamese", "English"]
	},
	{
		id: 2,
		name: "Dr. Tran Thi Bich",
		specialty: "Cosmetic Dentistry",
		experience: "12+ years of experience",
		education: "PhD in Dentistry - Ho Chi Minh City Medical University",
		description: "Specialist in cosmetic dentistry, porcelain crowns and teeth whitening with modern technology.",
		image: "/api/placeholder/300/300",
		schedule: ["Mon-Fri: 9:00-18:00", "Sun: 9:00-13:00"],
		languages: ["Vietnamese", "English", "Chinese"]
	},
	{
		id: 3,
		name: "Dr. Le Minh Tuan",
		specialty: "Oral & Maxillofacial Surgery",
		experience: "18+ years of experience",
		education: "PhD in Medicine - Hue Medical University",
		description: "Specialist doctor in oral and maxillofacial surgery and dental implants with advanced techniques.",
		image: "/api/placeholder/300/300",
		schedule: ["Tue,Thu,Sat: 8:00-16:00"],
		languages: ["Vietnamese", "English", "Japanese"]
	},
	{
		id: 4,
		name: "Dr. Pham Thi Mai",
		specialty: "Pediatric Dentistry",
		experience: "10+ years of experience",
		education: "Master of Dentistry - Can Tho Medical University",
		description: "Pediatric dentistry specialist with gentle treatment methods, friendly with children.",
		image: "/api/placeholder/300/300",
		schedule: ["Mon-Fri: 8:30-17:30", "Sat: 8:30-11:30"],
		languages: ["Vietnamese", "English"]
	},
	{
		id: 5,
		name: "Dr. Hoang Duc Long",
		specialty: "Endodontics",
		experience: "14+ years of experience",
		education: "Master of Dentistry - Ho Chi Minh City University of Medicine and Pharmacy",
		description: "Specialist in root canal treatment and dental diseases with modern laser technology.",
		image: "/api/placeholder/300/300",
		schedule: ["Mon,Wed,Fri: 13:00-20:00"],
		languages: ["Vietnamese", "English"]
	},
	{
		id: 6,
		name: "Dr. Vo Thi Lan",
		specialty: "Periodontics",
		experience: "11+ years of experience",
		education: "Master of Dentistry - Hanoi Medical University",
		description: "Specialist in periodontal disease treatment, scaling and gum care.",
		image: "/api/placeholder/300/300",
		schedule: ["Mon-Fri: 7:30-16:30"],
		languages: ["Vietnamese"]
	}
];

export default function DoctorsPage() {
	const t = useTranslations('Doctors');

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
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
							{doctors.map((doctor) => (
								<Card key={doctor.id} className="hover:shadow-lg transition-shadow duration-300">
									<CardHeader className="text-center">
										<div className="w-32 h-32 mx-auto mb-4 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
											<span className="text-4xl text-white font-bold">
												{doctor.name.split(' ').pop()?.charAt(0)}
											</span>
										</div>
										<CardTitle className="text-xl text-gray-900">{doctor.name}</CardTitle>
										<CardDescription className="text-primary font-semibold">
											{doctor.specialty}
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-4">
										<div>
											<h4 className="font-semibold text-gray-900 mb-1">{t('experience')}</h4>
											<p className="text-gray-600 text-sm">{doctor.experience}</p>
										</div>

										<div>
											<h4 className="font-semibold text-gray-900 mb-1">{t('education')}</h4>
											<p className="text-gray-600 text-sm">{doctor.education}</p>
										</div>

										<div>
											<h4 className="font-semibold text-gray-900 mb-1">{t('description')}</h4>
											<p className="text-gray-600 text-sm">{doctor.description}</p>
										</div>

										<div>
											<h4 className="font-semibold text-gray-900 mb-1">{t('schedule')}</h4>
											<ul className="text-gray-600 text-sm space-y-1">
												{doctor.schedule.map((time, index) => (
													<li key={index}>• {time}</li>
												))}
											</ul>
										</div>

										<div>
											<h4 className="font-semibold text-gray-900 mb-1">{t('languages')}</h4>
											<div className="flex flex-wrap gap-1">
												{doctor.languages.map((lang, index) => (
													<span
														key={index}
														className="px-2 py-1 bg-accent text-primary rounded-full text-xs"
													>
														{lang}
													</span>
												))}
											</div>
										</div>

										<div className="pt-4">
											<Link
												href={`/appointment?doctor=${doctor.id}`}
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
								Why Choose Our Medical Team?
							</h2>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
							<div className="text-center">
								<div className="text-3xl font-bold text-primary mb-2">15+</div>
								<p className="text-gray-600">Years average experience</p>
							</div>
							<div className="text-center">
								<div className="text-3xl font-bold text-primary mb-2">10,000+</div>
								<p className="text-gray-600">Patients treated</p>
							</div>
							<div className="text-center">
								<div className="text-3xl font-bold text-primary mb-2">98%</div>
								<p className="text-gray-600">Customer satisfaction rate</p>
							</div>
							<div className="text-center">
								<div className="text-3xl font-bold text-primary mb-2">24/7</div>
								<p className="text-gray-600">Emergency support</p>
							</div>
						</div>
					</div>
				</section>
			</main>
			<Footer />
		</>
	);
}