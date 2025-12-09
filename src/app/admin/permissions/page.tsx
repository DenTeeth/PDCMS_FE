'use client';

import { useState, useEffect } from 'react';
import { permissionService } from '@/services/permissionService';
import { Permission } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, Key, Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Fetch permissions
  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const data = await permissionService.getPermissions();
      setPermissions(data);
    } catch (error: any) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  // Get unique modules for filtering
  const modules = ['all', ...Array.from(new Set(permissions.map((p) => p.module)))];

  // Filter permissions
  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch =
      permission.permissionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.permissionId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = selectedModule === 'all' || permission.module === selectedModule;
    
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && permission.isActive) ||
      (selectedStatus === 'inactive' && !permission.isActive);

    return matchesSearch && matchesModule && matchesStatus;
  });

  // Group permissions by module
  const groupedPermissions = filteredPermissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-500"> Đang tải quyền...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Key className="h-8 w-8 text-blue-600" />
              Quản lý quyền
            </h1>
            <p className="text-gray-500 mt-1">
              Quản lý quyền hệ thống và liên kết vai trò
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {filteredPermissions.length} Quyền{filteredPermissions.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Filters Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm quyền..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Module Filter */}
              <div>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {modules.map((module) => (
                    <option key={module} value={module}>
                      {module === 'all' ? 'All Modules' : module}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="active">Chỉ trạng thái hoạt động</option>
                  <option value="inactive">Chỉ trạng thái ngừng hoạt động</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Tổng số quyền</p>
                <p className="text-3xl font-bold text-blue-600">{permissions.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Đang hoạt động</p>
                <p className="text-3xl font-bold text-green-600">
                  {permissions.filter((p) => p.isActive).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Ngừng hoạt động</p>
                <p className="text-3xl font-bold text-red-600">
                  {permissions.filter((p) => !p.isActive).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-gray-500 text-sm">Modules</p>
                <p className="text-3xl font-bold text-purple-600">{modules.length - 1}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Permissions grouped by module */}
        {Object.keys(groupedPermissions).length === 0 ? (
          <Card>    
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Key className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Không tìm thấy quyền</p>
                <p className="text-gray-400 text-sm mt-2">
                  Hãy thử điều chỉnh tiêu chí tìm kiếm hoặc lọc của bạn                
</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
            <Card key={module}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  {module}
                  <Badge variant="secondary" className="ml-2">
                    {modulePermissions.length} quyền{modulePermissions.length !== 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modulePermissions.map((permission) => (
                    <div
                      key={permission.permissionId}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{permission.permissionName}</h3>
                            {permission.isActive ? (
                              <Badge className="bg-green-100 text-green-800 border-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Hoạt động
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                Ngừng hoạt động
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{permission.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                              {permission.permissionId}
                            </span>
                            <span>
                              Tạo lúc: {new Date(permission.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Associated Roles */}
                      {permission.roleNames && permission.roleNames.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-gray-500 mb-2">Vai trò liên kết:</p>
                          <div className="flex flex-wrap gap-2">
                            {permission.roleNames.map((roleName) => (
                              <Badge key={roleName} variant="outline" className="text-blue-600">
                                <Shield className="h-3 w-3 mr-1" />
                                {roleName}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
