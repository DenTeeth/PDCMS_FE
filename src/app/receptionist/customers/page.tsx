'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faUsers, faAddressBook } from '@fortawesome/free-solid-svg-icons';
import CustomerGroupsTab from '@/components/receptionist/CustomerGroupsTab';
import CustomerContactsTab from '@/components/receptionist/CustomerContactsTab';

export default function CustomerManagementPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage customer groups, contacts and track KPIs
          </p>
        </div>
        <Button className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
          <span>Add Customer</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="groups" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="groups" className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faUsers} className="h-4 w-4" />
            <span>Customer Groups</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faAddressBook} className="h-4 w-4" />
            <span>Customer Contacts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="groups" className="mt-6">
          <CustomerGroupsTab />
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <CustomerContactsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
