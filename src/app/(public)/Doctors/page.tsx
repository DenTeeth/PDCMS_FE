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
		name: "Bác sĩ Nguyễn Văn An",
		specialty: "Chỉnh nha",
		experience: "Hơn 15 năm kinh nghiệm",
		education: "Thạc sĩ Nha khoa - Đại học Y Hà Nội",
		description: "Chuyên gia hàng đầu về chỉnh nha với nhiều năm kinh nghiệm điều trị các ca phức tạp.",
		image: "/api/placeholder/300/300",
		schedule: ["Thứ 2-6: 8:00-17:00", "Thứ 7: 8:00-12:00"],
		languages: ["Tiếng Việt", "Tiếng Anh"]
	},
	{
		id: 2,
		name: "Bác sĩ Trần Thị Bích",
		specialty: "Nha khoa thẩm mỹ",
		experience: "Hơn 12 năm kinh nghiệm",
		education: "Tiến sĩ Nha khoa - Đại học Y Dược TP.HCM",
		description: "Chuyên gia về nha khoa thẩm mỹ, bọc răng sứ và tẩy trắng răng với công nghệ hiện đại.",
		image: "/api/placeholder/300/300",
		schedule: ["Thứ 2-6: 9:00-18:00", "Chủ nhật: 9:00-13:00"],
		languages: ["Tiếng Việt", "Tiếng Anh", "Tiếng Trung"]
	},
	{
		id: 3,
		name: "Bác sĩ Lê Minh Tuấn",
		specialty: "Phẫu thuật hàm mặt",
		experience: "Hơn 18 năm kinh nghiệm",
		education: "Tiến sĩ Y khoa - Đại học Y Huế",
		description: "Bác sĩ chuyên khoa phẫu thuật hàm mặt và cấy ghép răng với kỹ thuật tiên tiến.",
		image: "/api/placeholder/300/300",
		schedule: ["Thứ 3,5,7: 8:00-16:00"],
		languages: ["Tiếng Việt", "Tiếng Anh", "Tiếng Nhật"]
	},
	{
		id: 4,
		name: "Bác sĩ Phạm Thị Mai",
		specialty: "Nha khoa trẻ em",
		experience: "Hơn 10 năm kinh nghiệm",
		education: "Thạc sĩ Nha khoa - Đại học Y Cần Thơ",
		description: "Chuyên gia nha khoa trẻ em với phương pháp điều trị nhẹ nhàng, thân thiện với trẻ.",
		image: "/api/placeholder/300/300",
		schedule: ["Thứ 2-6: 8:30-17:30", "Thứ 7: 8:30-11:30"],
		languages: ["Tiếng Việt", "Tiếng Anh"]
	},
	{
		id: 5,
		name: "Bác sĩ Hoàng Đức Long",
		specialty: "Nội nha",
		experience: "Hơn 14 năm kinh nghiệm",
		education: "Thạc sĩ Nha khoa - Đại học Y Dược TP.HCM",
		description: "Chuyên gia về điều trị tủy răng và bệnh lý răng với công nghệ laser hiện đại.",
		image: "/api/placeholder/300/300",
		schedule: ["Thứ 2,4,6: 13:00-20:00"],
		languages: ["Tiếng Việt", "Tiếng Anh"]
	},
	{
		id: 6,
		name: "Bác sĩ Võ Thị Lan",
		specialty: "Nướu răng",
		experience: "Hơn 11 năm kinh nghiệm",
		education: "Thạc sĩ Nha khoa - Đại học Y Hà Nội",
		description: "Chuyên gia về điều trị bệnh nướu răng, cạo vôi và chăm sóc nướu.",
		image: "/api/placeholder/300/300",
		schedule: ["Thứ 2-6: 7:30-16:30"],
		languages: ["Tiếng Việt"]
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