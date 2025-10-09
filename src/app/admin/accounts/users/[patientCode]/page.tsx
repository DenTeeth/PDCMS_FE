'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Heart,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Users,
  Trash2,
} from 'lucide-react';
import { Patient } from '@/types/patient';
import { patientService } from '@/services/patientService';
import { toast } from 'sonner';

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientCode = params.patientCode as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (patientCode) {
      fetchPatientDetails();
    }
  }, [patientCode]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      const data = await patientService.getPatientByCode(patientCode);
      setPatient(data);
    } catch (error: any) {
      console.error('Failed to fetch patient details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch patient details');
      router.push('/admin/accounts/users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await patientService.deletePatient(patientCode);
      toast.success('Patient deleted successfully');
      router.push('/admin/accounts/users');
    } catch (error: any) {
      console.error('Failed to delete patient:', error);
      toast.error(error.response?.data?.message || 'Failed to delete patient');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };

  const getGenderLabel = (gender?: string) => {
    switch (gender) {
      case 'MALE':
        return 'Male';
      case 'FEMALE':
        return 'Female';
      case 'OTHER':
        return 'Other';
      default:
        return gender || 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Patient not found</p>
          <Button onClick={() => router.push('/admin/accounts/users')} className="mt-4">
            Back to Patients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/accounts/users')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Details</h1>
            <p className="text-gray-600">View detailed information about patient</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.info('Edit feature coming soon')}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Patient Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{patient.fullName}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {patient.patientCode} • {getGenderLabel(patient.gender)}
                </p>
              </div>
            </div>
            <Badge
              variant={patient.isActive ? 'default' : 'secondary'}
              className={
                patient.isActive
                  ? 'bg-green-100 text-green-700 px-4 py-2 text-base'
                  : 'bg-red-100 text-red-700 px-4 py-2 text-base'
              }
            >
              {patient.isActive ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Active
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Inactive
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-600">Patient Code</Label>
              <p className="font-medium text-lg">{patient.patientCode}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600">First Name</Label>
                <p className="font-medium">{patient.firstName}</p>
              </div>
              <div>
                <Label className="text-gray-600">Last Name</Label>
                <p className="font-medium">{patient.lastName}</p>
              </div>
            </div>
            <div>
              <Label className="text-gray-600">Full Name</Label>
              <p className="font-medium">{patient.fullName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-600">Gender</Label>
                <p className="font-medium">{getGenderLabel(patient.gender)}</p>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4" />
                <div>
                  <Label className="text-gray-600">Date of Birth</Label>
                  <p className="font-medium">{formatDate(patient.dateOfBirth)}</p>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-gray-600">Status</Label>
              <Badge
                variant={patient.isActive ? 'default' : 'secondary'}
                className={
                  patient.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }
              >
                {patient.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4" />
              <div className="flex-1">
                <Label className="text-gray-600">Phone Number</Label>
                <p className="font-medium">{patient.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="h-4 w-4" />
              <div className="flex-1">
                <Label className="text-gray-600">Email</Label>
                <p className="font-medium break-all">{patient.email || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="h-4 w-4" />
              <div className="flex-1">
                <Label className="text-gray-600">Address</Label>
                <p className="font-medium">{patient.address || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-600" />
              Medical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-600">Medical History</Label>
              <p className="font-medium text-sm whitespace-pre-wrap">
                {patient.medicalHistory || 'None'}
              </p>
            </div>
            <div>
              <Label className="text-gray-600">Allergies</Label>
              <p className="font-medium text-sm whitespace-pre-wrap">
                {patient.allergies || 'None'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Emergency Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="h-4 w-4" />
              <div className="flex-1">
                <Label className="text-gray-600">Contact Name</Label>
                <p className="font-medium">
                  {patient.emergencyContactName || 'Not provided'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4" />
              <div className="flex-1">
                <Label className="text-gray-600">Contact Phone</Label>
                <p className="font-medium">
                  {patient.emergencyContactPhone || 'Not provided'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-gray-600">Patient ID</Label>
              <p className="font-medium text-sm break-all">{patient.patientId}</p>
            </div>
            <div>
              <Label className="text-gray-600">Created At</Label>
              <p className="font-medium">
                {patient.createdAt
                  ? new Date(patient.createdAt).toLocaleString('en-US')
                  : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-gray-600">Last Updated</Label>
              <p className="font-medium">
                {patient.updatedAt
                  ? new Date(patient.updatedAt).toLocaleString('en-US')
                  : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Patient
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete patient <strong>{patient.fullName}</strong> ({patient.patientCode})?
              </p>
              <p className="text-sm text-gray-600 mb-6">
                This will set the patient status to inactive. This action can be reversed later.
              </p>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
