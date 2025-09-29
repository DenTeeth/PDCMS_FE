'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Package, 
  Save, 
  ArrowLeft,
  AlertCircle,
  Calendar,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { suppliers } from '@/data/warehouse-data';

export default function AddProductPage() {
  const [formData, setFormData] = useState({
    name: '',
    category: 'medicine',
    supplierId: '',
    expiryDate: '',
    manufacturingDate: '',
    dentalPurpose: '',
    storageConditions: '',
    warranty: '',
    warrantyPeriod: '',
    quantity: '',
    minQuantity: '',
    unitPrice: '',
    batchNumber: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    { value: 'medicine', label: 'Medicine' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'material', label: 'Material' },
    { value: 'consumable', label: 'Consumable' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.supplierId) {
      newErrors.supplierId = 'Supplier is required';
    }

    if (!formData.manufacturingDate) {
      newErrors.manufacturingDate = 'Manufacturing date is required';
    }

    if (!formData.dentalPurpose.trim()) {
      newErrors.dentalPurpose = 'Dental purpose is required';
    }

    if (!formData.storageConditions.trim()) {
      newErrors.storageConditions = 'Storage conditions are required';
    }

    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      newErrors.quantity = 'Valid quantity is required';
    }

    if (!formData.minQuantity || parseInt(formData.minQuantity) < 0) {
      newErrors.minQuantity = 'Valid minimum quantity is required';
    }

    if (!formData.unitPrice || parseFloat(formData.unitPrice) < 0) {
      newErrors.unitPrice = 'Valid unit price is required';
    }

    if (!formData.batchNumber.trim()) {
      newErrors.batchNumber = 'Batch number is required';
    }

    if (formData.expiryDate && formData.manufacturingDate) {
      const mfgDate = new Date(formData.manufacturingDate);
      const expDate = new Date(formData.expiryDate);
      if (expDate <= mfgDate) {
        newErrors.expiryDate = 'Expiry date must be after manufacturing date';
      }
    }

    if (formData.warrantyPeriod && parseInt(formData.warrantyPeriod) < 0) {
      newErrors.warrantyPeriod = 'Warranty period must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Here you would typically send the data to your API
      console.log('Form submitted:', formData);
      alert('Product added successfully!');
      // Reset form or redirect
      setFormData({
        name: '',
        category: 'medicine',
        supplierId: '',
        expiryDate: '',
        manufacturingDate: '',
        dentalPurpose: '',
        storageConditions: '',
        warranty: '',
        warrantyPeriod: '',
        quantity: '',
        minQuantity: '',
        unitPrice: '',
        batchNumber: '',
      });
    }
  };

  const selectedSupplier = suppliers.find(s => s.id === formData.supplierId);
  const totalValue = formData.quantity && formData.unitPrice 
    ? (parseInt(formData.quantity) * parseFloat(formData.unitPrice)).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/warehouse/inventory">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inventory
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-2">
            Add a new item to the dental clinic inventory
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Product Information */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Product Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter product name"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="supplierId">Supplier *</Label>
                  <select
                    id="supplierId"
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.supplierId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  {errors.supplierId && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.supplierId}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="batchNumber">Batch Number *</Label>
                  <Input
                    id="batchNumber"
                    name="batchNumber"
                    value={formData.batchNumber}
                    onChange={handleInputChange}
                    placeholder="Enter batch number"
                    className={errors.batchNumber ? 'border-red-500' : ''}
                  />
                  {errors.batchNumber && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.batchNumber}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="manufacturingDate">Manufacturing Date *</Label>
                  <Input
                    id="manufacturingDate"
                    name="manufacturingDate"
                    type="date"
                    value={formData.manufacturingDate}
                    onChange={handleInputChange}
                    className={errors.manufacturingDate ? 'border-red-500' : ''}
                  />
                  {errors.manufacturingDate && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.manufacturingDate}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    name="expiryDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={handleInputChange}
                    className={errors.expiryDate ? 'border-red-500' : ''}
                  />
                  {errors.expiryDate && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.expiryDate}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="dentalPurpose">Dental Purpose *</Label>
                  <textarea
                    id="dentalPurpose"
                    name="dentalPurpose"
                    value={formData.dentalPurpose}
                    onChange={handleInputChange}
                    placeholder="Describe the dental purpose and usage"
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.dentalPurpose ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.dentalPurpose && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.dentalPurpose}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="storageConditions">Storage Conditions *</Label>
                  <textarea
                    id="storageConditions"
                    name="storageConditions"
                    value={formData.storageConditions}
                    onChange={handleInputChange}
                    placeholder="Describe storage requirements"
                    rows={2}
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.storageConditions ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.storageConditions && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.storageConditions}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="warranty">Warranty Information</Label>
                  <Input
                    id="warranty"
                    name="warranty"
                    value={formData.warranty}
                    onChange={handleInputChange}
                    placeholder="Warranty details"
                  />
                </div>

                <div>
                  <Label htmlFor="warrantyPeriod">Warranty Period (months)</Label>
                  <Input
                    id="warrantyPeriod"
                    name="warrantyPeriod"
                    type="number"
                    min="0"
                    value={formData.warrantyPeriod}
                    onChange={handleInputChange}
                    placeholder="Number of months"
                    className={errors.warrantyPeriod ? 'border-red-500' : ''}
                  />
                  {errors.warrantyPeriod && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.warrantyPeriod}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Stock and Pricing */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Stock & Pricing
              </h2>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="quantity">Current Quantity *</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="Enter quantity"
                    className={errors.quantity ? 'border-red-500' : ''}
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.quantity}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="minQuantity">Minimum Stock Level *</Label>
                  <Input
                    id="minQuantity"
                    name="minQuantity"
                    type="number"
                    min="0"
                    value={formData.minQuantity}
                    onChange={handleInputChange}
                    placeholder="Minimum quantity"
                    className={errors.minQuantity ? 'border-red-500' : ''}
                  />
                  {errors.minQuantity && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.minQuantity}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="unitPrice">Unit Price (USD) *</Label>
                  <Input
                    id="unitPrice"
                    name="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className={errors.unitPrice ? 'border-red-500' : ''}
                  />
                  {errors.unitPrice && (
                    <p className="text-red-500 text-sm mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.unitPrice}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Total Value:</span>
                    <span className="text-lg font-bold text-green-600">
                      ${totalValue}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Supplier Info */}
            {selectedSupplier && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {selectedSupplier.name}</p>
                  <p><span className="font-medium">Contact:</span> {selectedSupplier.contactPerson}</p>
                  <p><span className="font-medium">Phone:</span> {selectedSupplier.phone}</p>
                  <p><span className="font-medium">Email:</span> {selectedSupplier.email}</p>
                </div>
              </Card>
            )}

            {/* Submit Button */}
            <Card className="p-6">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                Add Product to Inventory
              </Button>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
