"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type Language = "vi" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

interface Translations {
  nav: {
    home: string;
    services: string;
    doctors: string;
    about: string;
    contact: string;
    login: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta: string;
    secondaryCta: string;
  };
  stats: {
    patients: string;
    experience: string;
    doctors: string;
    rating: string;
  };
  about: {
    title: string;
    subtitle: string;
    description: string;
    features: {
      personalizedPlans: string;
      personalizedPlansDesc: string;
      gentleCare: string;
      gentleCareDesc: string;
      technology: string;
      technologyDesc: string;
      scheduling: string;
      schedulingDesc: string;
    };
    cta: string;
  };
  features: {
    title: string;
    subtitle: string;
  };
  services: {
    title: string;
    subtitle: string;
    items: {
      general: string;
      generalDesc: string;
      cosmetic: string;
      cosmeticDesc: string;
      pediatric: string;
      pediatricDesc: string;
      restorative: string;
      restorativeDesc: string;
    };
  };
  doctors: {
    title: string;
    subtitle: string;
  };
  testimonials: {
    title: string;
    description: string;
  };
  appointment: {
    title: string;
    subtitle: string;
    cta: string;
  };
  faq: {
    title: string;
    subtitle: string;
  };
  footer: {
    about: string;
    quickLinks: string;
    services: string;
    contact: string;
    copyright: string;
  };
}

const translations: Record<Language, Translations> = {
  vi: {
    nav: {
      home: "Trang chủ",
      services: "Dịch vụ",
      doctors: "Bác sĩ",
      about: "Về chúng tôi",
      contact: "Liên hệ",
      login: "Đăng nhập",
    },
    hero: {
      title: "Nâng tầm nụ cười với",
      subtitle: "Chăm sóc chuyên nghiệp và chạm nhẹ nhàng",
      cta: "Đặt lịch hẹn",
      secondaryCta: "Dịch vụ của chúng tôi",
    },
    stats: {
      patients: "Bệnh nhân hài lòng",
      experience: "Năm kinh nghiệm",
      doctors: "Bác sĩ chuyên nghiệp",
      rating: "Đánh giá 5 sao",
    },
    about: {
      title: "Chuyên nghiệp và cá nhân hóa",
      subtitle: "Nha khoa xuất sắc",
      description: "Chúng tôi cung cấp dịch vụ nha khoa chất lượng cao với sự chạm nhẹ nhàng cho bạn và gia đình. Đội ngũ giàu kinh nghiệm của chúng tôi luôn tận tâm tạo ra nụ cười đẹp, khỏe mạnh trong môi trường thoải mái.",
      features: {
        personalizedPlans: "Kế hoạch điều trị cá nhân hóa",
        personalizedPlansDesc: "Chăm sóc tùy chỉnh phù hợp với nhu cầu nha khoa riêng của bạn",
        gentleCare: "Chăm sóc nhẹ nhàng cho trẻ em và người lớn",
        gentleCareDesc: "Cách tiếp cận đầy tình thương với bệnh nhân ở mọi lứa tuổi",
        technology: "Công nghệ hiện đại",
        technologyDesc: "Trang thiết bị mới nhất cho điều trị chính xác và thoải mái",
        scheduling: "Lịch hẹn linh hoạt",
        schedulingDesc: "Tùy chọn đặt lịch tiện lợi phù hợp với lối sống bận rộn của bạn",
      },
      cta: "Đặt lịch hẹn",
    },
    features: {
      title: "Tại sao chọn chúng tôi",
      subtitle: "Những lợi ích khi sử dụng dịch vụ của chúng tôi",
    },
    services: {
      title: "Dịch vụ",
      subtitle: "Phòng khám của chúng tôi cung cấp đa dạng dịch vụ và không ngừng nghiên cứu công nghệ mới để bổ sung thêm các dịch vụ chuyên môn.",
    },
    doctors: {
      title: "Đội ngũ y bác sĩ",
      subtitle: "Bác sĩ giàu kinh nghiệm với đào tạo chuyên sâu và trang thiết bị hiện đại nhất.",
    },
    testimonials: {
      title: "Khách hàng hài lòng",
      description: "Xem những gì bệnh nhân của chúng tôi nói về chúng tôi",
    },
    appointment: {
      title: "Đặt lịch hẹn ngay hôm nay",
      subtitle: "Chúng tôi sẵn sàng phục vụ bạn",
      cta: "Đặt lịch ngay",
    },
    faq: {
      title: "Câu hỏi thường gặp",
      subtitle: "Giải đáp thắc mắc của bạn",
    },
    footer: {
      about: "Về chúng tôi",
      quickLinks: "Liên kết nhanh",
      services: "Dịch vụ",
      contact: "Liên hệ",
      copyright: "Bản quyền thuộc về DenTeeth. Tất cả quyền được bảo lưu.",
    },
  },
  en: {
    nav: {
      home: "Home",
      services: "Services",
      doctors: "Doctors",
      about: "About",
      contact: "Contact",
      login: "Login",
    },
    hero: {
      title: "Elevating Smiles with",
      subtitle: "Expert Care and a Gentle Touch",
      cta: "Book Appointment",
      secondaryCta: "Our Services",
    },
    stats: {
      patients: "Happy Patients",
      experience: "Years of Experience",
      doctors: "Professional Doctors",
      rating: "5-Star Rating",
    },
    about: {
      title: "Professional and Personalized",
      subtitle: "Dental Excellence",
      description: "We provide high-quality dental care with a personal touch for you and your entire family. Our experienced team is dedicated to creating beautiful, healthy smiles in a comfortable environment.",
      features: {
        personalizedPlans: "Personalized Treatment Plans",
        personalizedPlansDesc: "Customized care tailored to your unique dental needs",
        gentleCare: "Gentle Care for Kids and Adults",
        gentleCareDesc: "Compassionate approach for patients of all ages",
        technology: "State-of-the-Art Technology",
        technologyDesc: "Latest equipment for precise and comfortable treatment",
        scheduling: "Flexible Appointment Scheduling",
        schedulingDesc: "Convenient booking options to fit your busy lifestyle",
      },
      cta: "Book Appointment",
    },
    features: {
      title: "Why Choose Us",
      subtitle: "Benefits of using our services",
    },
    services: {
      title: "Services",
      subtitle: "Our clinic offers a wide range of services and constantly studies new technology to add more specialized services.",
    },
    doctors: {
      title: "Our Medical Team",
      subtitle: "Experienced doctors with specialized training and the most modern equipment.",
    },
    testimonials: {
      title: "Our Happy Customers",
      description: "See what our patients are saying about us",
    },
    appointment: {
      title: "Book an Appointment Today",
      subtitle: "We are ready to serve you",
      cta: "Book Now",
    },
    faq: {
      title: "Frequently Asked Questions",
      subtitle: "Answers to your questions",
    },
    footer: {
      about: "About Us",
      quickLinks: "Quick Links",
      services: "Services",
      contact: "Contact",
      copyright: "Copyright © DenTeeth. All rights reserved.",
    },
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("vi");

  const value = {
    language,
    setLanguage,
    t: translations[language],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
