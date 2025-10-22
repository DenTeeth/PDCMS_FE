"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How often should I visit the dentist?",
    answer: "We recommend visiting the dentist every 6 months for regular checkups and cleanings. However, some patients may need more frequent visits depending on their oral health needs.",
  },
  {
    question: "What should I do in a dental emergency?",
    answer: "Contact our clinic immediately. We offer emergency dental services and will do our best to see you as soon as possible. For severe bleeding or trauma, go to the nearest emergency room.",
  },
  {
    question: "Do you accept dental insurance?",
    answer: "Yes, we accept most major dental insurance plans. Our team will work with your insurance provider to maximize your benefits. We also offer flexible payment plans for those without insurance.",
  },
  {
    question: "Are your treatments painful?",
    answer: "We use modern techniques and anesthesia to ensure your comfort during all procedures. Most patients report minimal to no discomfort. We prioritize your comfort and will adjust our approach based on your needs.",
  },
  {
    question: "How long does a typical appointment take?",
    answer: "A routine checkup and cleaning usually takes 45-60 minutes. More complex procedures may require longer appointments. We'll provide you with an estimated time when you schedule your visit.",
  },
  {
    question: "Do you offer teeth whitening services?",
    answer: "Yes, we offer both in-office and take-home teeth whitening options. Our cosmetic dentistry team will help you choose the best whitening solution for your smile goals.",
  },
];

export default function FAQSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-background" ref={ref}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Find answers to common questions about our dental services
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-card rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-accent/50 transition-colors"
              >
                <span className="font-semibold text-foreground pr-4">
                  {faq.question}
                </span>
                <motion.span
                  animate={{ rotate: expandedIndex === index ? 45 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold"
                >
                  +
                </motion.span>
              </button>

              <motion.div
                initial={false}
                animate={{
                  height: expandedIndex === index ? "auto" : 0,
                  opacity: expandedIndex === index ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-4 text-muted-foreground">
                  {faq.answer}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
