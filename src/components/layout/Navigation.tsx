"use client";

import Link from "next/link";

export default function Navigation() {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">D</span>
              </div>
              <span className="text-xl font-bold text-gray-900">DenTeeth</span>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="/" className="text-gray-700 hover:text-purple-500">Home</Link>
              <Link href="/Services" className="text-gray-700 hover:text-purple-500">Services</Link>
              <Link href="/Doctors" className="text-gray-700 hover:text-purple-500">Doctors</Link>
              <Link href="/About" className="text-gray-700 hover:text-purple-500">About</Link>
              <Link href="/Contact" className="text-gray-700 hover:text-purple-500">Contact</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-800 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}