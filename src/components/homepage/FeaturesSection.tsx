interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: "💎",
    title: "Exclusive membership packages",
    description: "Save costs with annual membership examination and treatment packages"
  },
  {
    icon: "💳", 
    title: "Flexible payment",
    description: "Various payment methods and convenient installment plans"
  },
  {
    icon: "🕒",
    title: "24/7 Service", 
    description: "Emergency dental support and 24-hour consultation"
  },
  {
    icon: "👨‍⚕️",
    title: "15 years of experience",
    description: "A team of doctors with over 15 years of experience in the field"
  },
  {
    icon: "🔬",
    title: "Modern technology",
    description: "The most advanced treatment equipment and technology"
  },
  {
    icon: "🏆",
    title: "Guaranteed quality", 
    description: "Commitment to the best treatment quality and customer service"
  }
];

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Why choose us?
          </h2>
          <p className="text-xl text-gray-600">
            Outstanding advantages at our dental clinic
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-8 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-6">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}