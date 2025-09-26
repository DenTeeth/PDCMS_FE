interface TeamMember {
  name: string;
  position: string;
  description: string;
  avatar: string;
  bgColor: string;
}

const teamMembers: TeamMember[] = [
  {
    name: "Dr. Nguyen Van An",
    position: "Head of Department",
    description: "The most experienced doctor in the team. Patients love him for his carefulness and wisdom.",
    avatar: "👨‍⚕️",
    bgColor: "bg-secondary"
  },
  {
    name: "Dr. Tran Thi Binh", 
    position: "Deputy Head",
    description: "She has provided dental services at the clinic for 10 years. She is thoughtful and professional.",
    avatar: "👩‍⚕️",
    bgColor: "bg-pink-200"
  },
  {
    name: "Dr. Le Van Cuong",
    position: "Doctor", 
    description: "His smile is what patients admire most. He says his dream is to help everyone have the best smile.",
    avatar: "👨‍⚕️",
    bgColor: "bg-green-200"
  },
  {
    name: "Dr. Pham Thi Dieu",
    position: "Doctor",
    description: "She loves children and has a special talent for dealing with them. Most of her patients are children.",
    avatar: "👩‍⚕️", 
    bgColor: "bg-yellow-200"
  }
];

export default function TeamSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Our Expert Team
          </h2>
          <p className="text-xl text-gray-600">
            Over 30 professors, doctors, and other specialists at our clinic
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="text-center bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className={`w-24 h-24 ${member.bgColor} rounded-full mx-auto mb-4 flex items-center justify-center`}>
                <span className="text-2xl">{member.avatar}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">{member.name}</h3>
              <p className="text-primary text-sm mb-2">{member.position}</p>
              <p className="text-gray-600 text-sm">
                {member.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}