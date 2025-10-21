'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomerContactsTab from './components/CustomerContactsTab';
import CustomerGroupsTab from './components/CustomerGroupsTab';

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState('contacts');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Quản lý khách hàng</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý thông tin liên hệ và nhóm khách hàng
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="contacts">
            Danh bạ liên hệ
          </TabsTrigger>
          <TabsTrigger value="groups">
            Nhóm khách hàng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts" className="space-y-4">
          <CustomerContactsTab />
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <CustomerGroupsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
