'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faHome, faRefresh } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface UnauthorizedMessageProps {
  title?: string;
  message?: string;
  showRefresh?: boolean;
  showHome?: boolean;
  onRefresh?: () => void;
}

export default function UnauthorizedMessage({
  title = "Không có quyền truy cập",
  message = "Tài khoản của bạn chưa được cấp quyền để truy cập tính năng này.",
  showRefresh = true,
  showHome = true,
  onRefresh
}: UnauthorizedMessageProps) {
  const router = useRouter();
  const { user, getHomePath } = useAuth();

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    router.push(getHomePath());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <FontAwesomeIcon 
              icon={faExclamationTriangle} 
              className="w-8 h-8 text-red-600" 
            />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            {message}
          </p>

          <div className="flex gap-3 justify-center">
            {showRefresh && (
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faRefresh} className="w-4 h-4" />
                Thử lại
              </Button>
            )}
            
            {showHome && (
              <Button
                onClick={handleGoHome}
                className="flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faHome} className="w-4 h-4" />
                Về trang chủ
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
