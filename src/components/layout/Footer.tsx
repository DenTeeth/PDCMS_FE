import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebook, faTwitter, faInstagram, faYoutube } from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-6">
              <Image
                src="/denteeth-logo.png"
                alt="DenTeeth Logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-bold">DenTeeth</span>
            </Link>
            <p className="text-gray-400 mb-4">
              Quận 9, TP.HCM<br />
              
            </p>
            <p className="text-gray-400 mb-4">hellodenteeth@gmail.com</p>
            <p className="text-gray-400">0909 726 700</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-6">Hỗ trợ</h3>
            <ul className="space-y-3 text-gray-400">
              <li><Link href="/about" className="hover:text-white transition-colors">Về chúng tôi</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Liên hệ</Link></li>
              <li><Link href="/services" className="hover:text-white transition-colors">Dịch vụ của chúng tôi</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-6">Điều trị</h3>
            <ul className="space-y-3 text-gray-400">
              <li><Link href="#" className="hover:text-white transition-colors">Nha khoa dự phòng</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Nha khoa trẻ em</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Cấy ghép răng</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Nhổ răng</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-6">Theo dõi chúng tôi</h3>
            <div className="flex space-x-4">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <FontAwesomeIcon icon={faFacebook} className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <FontAwesomeIcon icon={faTwitter} className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <FontAwesomeIcon icon={faInstagram} className="h-6 w-6" />
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">
                <FontAwesomeIcon icon={faYoutube} className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; 2025 DenTeeth. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}