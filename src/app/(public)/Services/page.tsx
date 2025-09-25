import Link from "next/link";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbSeparator, BreadcrumbLink, BreadcrumbPage } from "@/components/ui/breadcrumb";
import Navigation from "@/components/layout/Navigation";
import DynamicBreadcrumb from "@/components/ui/DynamicBreadcrumb";

interface Service {
	title: string;
	description: string;
	icon: string;
	link: string;
}

const services: Service[] = [
	{ title: "Cosmetic Dentistry", description: "Improve the appearance of your teeth, including whitening & veneers.", icon: "✨", link: "/services/cosmetic" },
	{ title: "Pediatric Dentistry", description: "Tailored dental care for infants, children, and teens.", icon: "👶", link: "/services/pediatric" },
	{ title: "Dental Implants", description: "Replace missing teeth with artificial roots implanted in the jaw.", icon: "🦷", link: "/services/implants" },
	{ title: "Orthodontics", description: "Correct misaligned teeth and jaws with braces or aligners.", icon: "😬", link: "/services/orthodontics" },
	{ title: "General Checkup", description: "Regular checkups and cleanings to maintain oral health.", icon: "🪥", link: "/services/general" },
	{ title: "Root Canal", description: "Repair and save badly decayed or infected teeth.", icon: "🦷", link: "/services/root-canal" },
];

export default function ServicesPage() {
	return (
		<>
		<main className="min-h-screen bg-white">
		<Navigation />
			<section className="bg-gradient-to-r from-blue-50 to-blue-100 py-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<DynamicBreadcrumb />

					<h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Services</h1>
					<p className="text-gray-600 mt-2 max-w-2xl">Our clinic offers a wide range of services and constantly studies new technology to add more specialized services.</p>
				</div>
			</section>

			<section className="py-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
						{services.map((s, i) => (
							<div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md transition-shadow">
								<div className="text-4xl mb-4">{s.icon}</div>
								<h3 className="text-xl font-semibold mb-2">{s.title}</h3>
								<p className="text-gray-600 mb-4">{s.description}</p>
								<Link href={s.link} className="text-blue-600 font-medium hover:underline">More Details →</Link>
							</div>
						))}
					</div>
				</div>
			</section>
		</main>
		</>
	);
}
