'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faReceipt,
  faHardHat,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';

export default function PatientBillingPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Thanh toán</h1>
          <p className="text-muted-foreground">Quản lý hóa đơn và thanh toán</p>
        </div>
      </div>

      {/* Coming Soon Message */}
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <FontAwesomeIcon 
                icon={faReceipt} 
                className="h-24 w-24 text-muted-foreground/30" 
              />
              <div className="absolute -bottom-2 -right-2">
                <div className="bg-primary rounded-full p-3">
                  <FontAwesomeIcon 
                    icon={faHardHat} 
                    className="h-6 w-6 text-primary-foreground" 
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-3 max-w-md">
              <h2 className="text-2xl font-bold text-gray-900">
                Tính năng đang phát triển
              </h2>
              <p className="text-muted-foreground text-lg">
                Chức năng thanh toán và quản lý hóa đơn đang được phát triển. 
                Vui lòng quay lại sau hoặc liên hệ lễ tân để thanh toán trực tiếp.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={() => router.back()}
                variant="outline"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="mr-2 h-4 w-4" />
                Quay lại
              </Button>
              <Button 
                onClick={() => router.push('/patient/appointments')}
              >
                Xem lịch hẹn
              </Button>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg max-w-md">
              <p className="text-sm text-blue-800">
                <strong>Lưu ý:</strong> Hiện tại bạn có thể thanh toán trực tiếp tại phòng khám 
                hoặc liên hệ với lễ tân qua số điện thoại của phòng khám.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
