"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="bg-gradient-to-r from-primary via-[#9b6fcf] to-primary backdrop-blur-lg shadow-[0_4px_20px_-2px_rgba(0,0,0,0.15)] border-b-2 border-primary/20 sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-white">
                DenTeeth
              </span>
            </Link>
          </motion.div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-2">
              {[
                { name: "Home", path: "/" },
                { name: "Services", path: "/Services" },
                { name: "Doctors", path: "/Doctors" },
                { name: "About", path: "/About" },
                { name: "Contact", path: "/Contact" },
              ].map((item) => (
                <Link key={item.path} href={item.path} className="relative px-4 py-2">
                  <motion.span
                    className={`relative z-10 font-medium transition-colors ${isActive(item.path)
                      ? "text-white"
                      : "text-white/80 hover:text-white"
                      }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item.name}
                  </motion.span>
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-white/20 rounded-lg"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="inline-block bg-white text-primary font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}