"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

interface Feature {
  icon: string;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: "👨‍⚕️",
    title: "Experienced Dental Team",
    description: "Our team of highly skilled dentists with over 15 years of experience"
  },
  {
    icon: "🔬",
    title: "Advanced Technology",
    description: "State-of-the-art equipment for precise and comfortable treatments"
  },
  {
    icon: "💎",
    title: "Personalized Treatment",
    description: "Customized care plans tailored to your unique dental needs"
  },
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Family-Friendly Environment",
    description: "Welcoming atmosphere for patients of all ages"
  }
];

export default function FeaturesSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="py-20 bg-gradient-to-br from-accent/20 to-primary/5" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Exceptional Service With a Personal Touch
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We combine expertise, advanced technology, and a caring approach to deliver outstanding dental care in a comfortable environment.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="text-center p-8 bg-card rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-border"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
                className="text-5xl mb-6 inline-block"
              >
                {feature.icon}
              </motion.div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}