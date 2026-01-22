'use client';

import { useState, useEffect } from 'react';
import { permissionService } from '@/services/permissionService';
import { Permission } from '@/types/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, Filter, Key, Shield, CheckCircle, XCircle, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

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
      toast.error('Không thể tải danh sách quyền');
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
          <p className="text-gray-500">Đang tải quyền hạn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý quyền</h1>
          <p className="text-gray-600">Quản lý quyền hệ thống và liên kết vai trò</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {filteredPermissions.length} Permissions
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Tổng số quyền</p>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Key className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{permissions.length}</p>
          </div>
        </div>

        <div className="bg-green-50 rounded-xl border border-green-200 shadow-sm p-4">
          <p className="text-sm font-semibold text-green-800 mb-2">Đang hoạt động</p>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-green-700" />
            </div>
            <p className="text-3xl font-bold text-green-800">{permissions.filter((p) => p.isActive).length}</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-300 shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-800 mb-2">Ngừng hoạt động</p>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <XCircle className="h-6 w-6 text-gray-700" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{permissions.filter((p) => !p.isActive).length}</p>
          </div>
        </div>

        <div className="bg-purple-50 rounded-xl border border-purple-200 shadow-sm p-4">
          <p className="text-sm font-semibold text-purple-800 mb-2">Modules</p>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-purple-700" />
            </div>
            <p className="text-3xl font-bold text-purple-800">{modules.length - 1}</p>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Tìm kiếm quyền..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Module Filter */}
            <div>
              <Label htmlFor="module" className="text-sm font-medium text-gray-700 mb-2">Module</Label>
              <select
                id="module"
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                {modules.map((module) => (
                  <option key={module} value={module}>
                    {module === 'all' ? 'Tất cả Modules' : module}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-2">Trạng thái</Label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Ngừng hoạt động</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions - Card Style per Module */}
      {Object.keys(groupedPermissions).length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Key className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">Không tìm thấy quyền nào</p>
              <p className="text-gray-400 text-sm mt-2">
                Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
            const isExpanded = expandedModules.includes(module);
            const activeCount = modulePermissions.filter((p) => p.isActive).length;
            const inactiveCount = modulePermissions.length - activeCount;

            return (
              <Card key={module} className="overflow-hidden">
                {/* Module Header - Clickable */}
                <div
                  onClick={() => {
                    setExpandedModules(prev =>
                      prev.includes(module)
                        ? prev.filter(m => m !== module)
                        : [...prev, module]
                    );
                  }}
                  className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 p-4 cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-6 w-6 text-blue-600" />
                      ) : (
                        <ChevronRight className="h-6 w-6 text-blue-600" />
                      )}
                      <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-gray-900">{module}</h3>
                        <p className="text-sm text-gray-600">
                          {modulePermissions.length} quyền • {activeCount} hoạt động • {inactiveCount} ngừng
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-white text-blue-600 border-blue-300">
                      {modulePermissions.length} quyền
                    </Badge>
                  </div>
                </div>

                {/* Permissions Table - Collapsible */}
                {isExpanded && (
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full table-fixed">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="w-1/5 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Permission ID
                            </th>
                            <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tên quyền
                            </th>
                            <th className="w-2/5 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Mô tả
                            </th>
                            <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {modulePermissions.map((permission) => (
                            <tr key={permission.permissionId} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                                  {permission.permissionId}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-semibold text-gray-900">
                                  {permission.permissionName}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-600">
                                  {permission.description}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {permission.isActive ? (
                                  <Badge className="bg-green-50 text-green-800 border-green-300">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Hoạt động
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Ngừng hoạt động
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
