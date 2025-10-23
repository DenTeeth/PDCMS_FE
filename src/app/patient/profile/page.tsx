'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faCalendarAlt,
  faEdit,
  faSave,
  faTimes,
  faShieldAlt,
  faHeart
} from '@fortawesome/free-solid-svg-icons';

export default function UserProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1990-05-15',
    address: '123 Main Street, City, State 12345',
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phone: '+1 (555) 987-6543'
    },
    insuranceInfo: {
      provider: 'Blue Cross Blue Shield',
      policyNumber: 'BC123456789',
      groupNumber: 'GRP001',
      expiryDate: '2024-12-31'
    },
    medicalHistory: {
      allergies: ['Penicillin', 'Shellfish'],
      medications: ['Lisinopril 10mg', 'Metformin 500mg'],
      conditions: ['Hypertension', 'Type 2 Diabetes'],
      previousSurgeries: ['Appendectomy (2015)']
    }
  });

  const handleSave = () => {
    // Handle save logic here
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and preferences</p>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} className="flex items-center">
                <FontAwesomeIcon icon={faSave} className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex items-center">
                <FontAwesomeIcon icon={faTimes} className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="flex items-center">
              <FontAwesomeIcon icon={faEdit} className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FontAwesomeIcon icon={faUser} className="mr-2 h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Your basic personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => setProfile({...profile, firstName: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => setProfile({...profile, lastName: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({...profile, email: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
              
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={profile.dateOfBirth}
                  onChange={(e) => setProfile({...profile, dateOfBirth: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile({...profile, address: e.target.value})}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FontAwesomeIcon icon={faPhone} className="mr-2 h-5 w-5" />
                Emergency Contact
              </CardTitle>
              <CardDescription>
                Contact information for emergencies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="emergencyName">Contact Name</Label>
                <Input
                  id="emergencyName"
                  value={profile.emergencyContact.name}
                  onChange={(e) => setProfile({
                    ...profile, 
                    emergencyContact: {...profile.emergencyContact, name: e.target.value}
                  })}
                  disabled={!isEditing}
                />
              </div>
              
              <div>
                <Label htmlFor="emergencyRelationship">Relationship</Label>
                <Input
                  id="emergencyRelationship"
                  value={profile.emergencyContact.relationship}
                  onChange={(e) => setProfile({
                    ...profile, 
                    emergencyContact: {...profile.emergencyContact, relationship: e.target.value}
                  })}
                  disabled={!isEditing}
                />
              </div>
              
              <div>
                <Label htmlFor="emergencyPhone">Phone Number</Label>
                <Input
                  id="emergencyPhone"
                  value={profile.emergencyContact.phone}
                  onChange={(e) => setProfile({
                    ...profile, 
                    emergencyContact: {...profile.emergencyContact, phone: e.target.value}
                  })}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>

          {/* Insurance Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FontAwesomeIcon icon={faShieldAlt} className="mr-2 h-5 w-5" />
                Insurance Information
              </CardTitle>
              <CardDescription>
                Your health insurance details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                <Input
                  id="insuranceProvider"
                  value={profile.insuranceInfo.provider}
                  onChange={(e) => setProfile({
                    ...profile, 
                    insuranceInfo: {...profile.insuranceInfo, provider: e.target.value}
                  })}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="policyNumber">Policy Number</Label>
                  <Input
                    id="policyNumber"
                    value={profile.insuranceInfo.policyNumber}
                    onChange={(e) => setProfile({
                      ...profile, 
                      insuranceInfo: {...profile.insuranceInfo, policyNumber: e.target.value}
                    })}
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <Label htmlFor="groupNumber">Group Number</Label>
                  <Input
                    id="groupNumber"
                    value={profile.insuranceInfo.groupNumber}
                    onChange={(e) => setProfile({
                      ...profile, 
                      insuranceInfo: {...profile.insuranceInfo, groupNumber: e.target.value}
                    })}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={profile.insuranceInfo.expiryDate}
                  onChange={(e) => setProfile({
                    ...profile, 
                    insuranceInfo: {...profile.insuranceInfo, expiryDate: e.target.value}
                  })}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medical History Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FontAwesomeIcon icon={faHeart} className="mr-2 h-5 w-5" />
                Medical History
              </CardTitle>
              <CardDescription>
                Your health information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Allergies</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.medicalHistory.allergies.map((allergy, index) => (
                    <Badge key={index} variant="destructive">{allergy}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Current Medications</h4>
                <div className="space-y-1">
                  {profile.medicalHistory.medications.map((medication, index) => (
                    <p key={index} className="text-sm text-muted-foreground">{medication}</p>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Medical Conditions</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.medicalHistory.conditions.map((condition, index) => (
                    <Badge key={index} variant="secondary">{condition}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Previous Surgeries</h4>
                <div className="space-y-1">
                  {profile.medicalHistory.previousSurgeries.map((surgery, index) => (
                    <p key={index} className="text-sm text-muted-foreground">{surgery}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Account Status</span>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Member Since</span>
                  <span className="text-sm text-muted-foreground">Jan 2020</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Login</span>
                  <span className="text-sm text-muted-foreground">Today</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

