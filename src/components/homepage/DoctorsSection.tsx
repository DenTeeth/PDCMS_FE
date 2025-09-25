import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  experience: string;
  description: string;
  avatar: string;
  bgColor: string;
}

const doctors: Doctor[] = [
  {
    id: 1,
    name: "Dr. Nguyen Van An",
    specialty: "Orthodontics",
    experience: "15+ years of experience",
    description: "Leading specialist in orthodontics with many years of experience treating complex cases.",
    avatar: "👨‍⚕️",
    bgColor: "bg-blue-200"
  },
  {
    id: 2,
    name: "Dr. Tran Thi Bich",
    specialty: "Cosmetic Dentistry",
    experience: "12+ years of experience",
    description: "Specialist in cosmetic dentistry, porcelain crowns and teeth whitening with modern technology.",
    avatar: "👩‍⚕️",
    bgColor: "bg-pink-200"
  },
  {
    id: 3,
    name: "Dr. Le Minh Tuan",
    specialty: "Oral & Maxillofacial Surgery",
    experience: "18+ years of experience",
    description: "Specialist doctor in oral and maxillofacial surgery and dental implants with advanced techniques.",
    avatar: "👨‍⚕️",
    bgColor: "bg-green-200"
  },
  {
    id: 4,
    name: "Dr. Pham Thi Mai",
    specialty: "Pediatric Dentistry",
    experience: "10+ years of experience",
    description: "Pediatric dentistry specialist with gentle treatment methods, friendly with children.",
    avatar: "👩‍⚕️",
    bgColor: "bg-yellow-200"
  }
];

export default function DoctorsSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Professional Medical Team
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Over 20 doctors and specialists with many years of experience in dentistry
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="hover:shadow-lg transition-shadow duration-300 bg-white">
              <CardHeader className="text-center">
                <div className={`w-24 h-24 ${doctor.bgColor} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                  <span className="text-3xl">{doctor.avatar}</span>
                </div>
                <CardTitle className="text-lg text-gray-900">{doctor.name}</CardTitle>
                <CardDescription className="text-blue-600 font-semibold">
                  {doctor.specialty}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-3">
                <p className="text-sm text-gray-500 font-medium">{doctor.experience}</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {doctor.description}
                </p>
                <Link 
                  href={`/appointment?doctor=${doctor.id}`}
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Book Appointment
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Link 
            href="/Doctors"
            className="inline-flex items-center bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            View All Doctors
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}