'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Select from '@/components/ui/select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faSave, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { customerGroups } from '@/data/receptionist-data';

export default function CreateAccountPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContact: '',
    insuranceProvider: '',
    insuranceNumber: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
    customerGroupId: '',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      emergencyContact: '',
      insuranceProvider: '',
      insuranceNumber: '',
      medicalHistory: '',
      allergies: '',
      currentMedications: '',
      customerGroupId: '',
      notes: ''
    });
    
    setIsSubmitting(false);
    alert('Patient account created successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" className="flex items-center space-x-2">
          <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
          <span>Back</span>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create New Patient Account</h1>
          <p className="text-muted-foreground mt-2">
            Register a new patient in the system
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FontAwesomeIcon icon={faUserPlus} className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>
              Basic patient information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter patient's full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="patient@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="0123456789"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' }
                  ]}
                  value={formData.gender}
                  onChange={(value) => handleInputChange('gender', value)}
                  placeholder="Select gender"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerGroup">Customer Group *</Label>
                <Select
                  options={customerGroups.map(group => ({
                    value: group.id,
                    label: group.name,
                    description: group.description
                  }))}
                  value={formData.customerGroupId}
                  onChange={(value) => handleInputChange('customerGroupId', value)}
                  placeholder="Select customer group"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter patient's address"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                placeholder="Emergency contact name and phone"
              />
            </div>
          </CardContent>
        </Card>

        {/* Insurance Information */}
        <Card>
          <CardHeader>
            <CardTitle>Insurance Information</CardTitle>
            <CardDescription>
              Patient's insurance details (optional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                <Input
                  id="insuranceProvider"
                  value={formData.insuranceProvider}
                  onChange={(e) => handleInputChange('insuranceProvider', e.target.value)}
                  placeholder="e.g., Blue Cross, Aetna"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insuranceNumber">Insurance Number</Label>
                <Input
                  id="insuranceNumber"
                  value={formData.insuranceNumber}
                  onChange={(e) => handleInputChange('insuranceNumber', e.target.value)}
                  placeholder="Insurance policy number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
            <CardDescription>
              Patient's medical history and current conditions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="medicalHistory">Medical History</Label>
              <Textarea
                id="medicalHistory"
                value={formData.medicalHistory}
                onChange={(e) => handleInputChange('medicalHistory', e.target.value)}
                placeholder="Previous medical conditions, surgeries, etc."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea
                id="allergies"
                value={formData.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                placeholder="Known allergies (medications, food, etc.)"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentMedications">Current Medications</Label>
              <Textarea
                id="currentMedications"
                value={formData.currentMedications}
                onChange={(e) => handleInputChange('currentMedications', e.target.value)}
                placeholder="Current medications and dosages"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information about the patient"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex items-center space-x-2">
            <FontAwesomeIcon icon={faSave} className="h-4 w-4" />
            <span>{isSubmitting ? 'Creating...' : 'Create Account'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
