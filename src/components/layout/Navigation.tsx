"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslations, useLocale } from 'next-intl';

export default function Navigation() {
  const pathname = usePathname();

  // Always call hooks unconditionally
  const t = useTranslations('Navigation');
  const locale = useLocale();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const menuItems = [
    { name: t('home'), path: "/" },
    { name: t('services'), path: "/Services" },
    { name: t('doctors'), path: "/Doctors" },
    { name: t('about'), path: "/About" },
    { name: t('contact'), path: "/Contact" },
  ];

  const languages = [
    { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
    { code: "en", name: "English", flag: "🇬🇧" },
  ];

  const currentLanguage = languages.find(lang => lang.code === locale);

  const changeLanguage = (newLocale: string) => {
    // Save locale to cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    // Reload page to apply new locale
    window.location.reload();
    setIsLanguageOpen(false);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/denteeth-logo.png"
                alt="DenTeeth Logo"
                width={64}
                height={64}
                className="h-20 w-20 object-contain"
                priority
              />
            </Link>
          </div>

          {/* Menu Items */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${isActive(item.path)
                    ? "bg-[#8b5fbf] text-white"
                    : "text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right Side - Language Dropdown & Login */}
          <div className="flex items-center gap-4">
            {/* Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all"
              >
                <span className="text-lg">{currentLanguage?.flag}</span>
                <span className="text-sm font-medium hidden sm:inline">{currentLanguage?.name}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isLanguageOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors ${locale === lang.code ? "bg-[#8b5fbf]/10 text-[#8b5fbf]" : "text-gray-700"
                        }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-sm font-medium">{lang.name}</span>
                      {locale === lang.code && (
                        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Login Button */}
            <Link
              href="/login"
              className="inline-block bg-[#8b5fbf] text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:bg-[#7a4eae] hover:shadow-lg transition-all"
            >
              {t('login')}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}