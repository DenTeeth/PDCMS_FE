'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/radix-select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { patientService } from '@/services/patientService';
import { CreatePatientRequest } from '@/types/patient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

// Validation schema
const patientSchema = z.object({
    // Basic Info
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().min(10, 'Phone must be at least 10 digits').optional().or(z.literal('')),
    dateOfBirth: z.string().optional().or(z.literal('')),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    address: z.string().optional().or(z.literal('')),

    // Medical Info
    medicalHistory: z.string().optional().or(z.literal('')),
    allergies: z.string().optional().or(z.literal('')),

    // Emergency Contact
    emergencyContactName: z.string().optional().or(z.literal('')),
    emergencyContactPhone: z.string().optional().or(z.literal('')),

    // Account Info (optional)
    createAccount: z.boolean(),
    username: z.string().optional().or(z.literal('')),
    password: z.string().optional().or(z.literal('')),
}).refine((data) => {
    // If createAccount is true, validate username and password
    if (data.createAccount) {
        return data.username && data.username.length >= 3 &&
            data.password && data.password.length >= 6;
    }
    return true;
}, {
    message: 'Username (min 3 chars) and password (min 6 chars) required when creating account',
    path: ['createAccount'],
});

type PatientFormData = z.infer<typeof patientSchema>;

interface CreatePatientModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function CreatePatientModal({
    open,
    onOpenChange,
    onSuccess,
}: CreatePatientModalProps) {
    const [loading, setLoading] = useState(false);
    const [createAccount, setCreateAccount] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
        setValue,
    } = useForm<PatientFormData>({
        resolver: zodResolver(patientSchema),
        defaultValues: {
            createAccount: false,
        },
    });

    const handleCreatePatient = async (data: PatientFormData) => {
        try {
            setLoading(true);

            // Build request payload
            const payload: CreatePatientRequest = {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email || undefined,
                phone: data.phone || undefined,
                dateOfBirth: data.dateOfBirth || undefined,
                gender: data.gender,
                address: data.address || undefined,
                medicalHistory: data.medicalHistory || undefined,
                allergies: data.allergies || undefined,
                emergencyContactName: data.emergencyContactName || undefined,
                emergencyContactPhone: data.emergencyContactPhone || undefined,
            };

            // Add account info if creating account
            if (data.createAccount && data.username && data.password) {
                (payload as any).username = data.username;
                (payload as any).password = data.password;
            }

            await patientService.createPatient(payload);

            toast.success('Patient created successfully!');
            reset();
            setCreateAccount(false);
            onSuccess();
        } catch (error: any) {
            console.error('Failed to create patient:', error);
            toast.error('Failed to create patient', {
                description: error.response?.data?.message || error.message || 'Please try again',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            reset();
            setCreateAccount(false);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Patient</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(handleCreatePatient)} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name *</Label>
                                <Input
                                    id="firstName"
                                    {...register('firstName')}
                                    placeholder="John"
                                />
                                {errors.firstName && (
                                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name *</Label>
                                <Input
                                    id="lastName"
                                    {...register('lastName')}
                                    placeholder="Doe"
                                />
                                {errors.lastName && (
                                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...register('email')}
                                    placeholder="john.doe@example.com"
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    {...register('phone')}
                                    placeholder="0123456789"
                                />
                                {errors.phone && (
                                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    {...register('dateOfBirth')}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender</Label>
                                <Select
                                    onValueChange={(value: any) => setValue('gender', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MALE">Male</SelectItem>
                                        <SelectItem value="FEMALE">Female</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    {...register('address')}
                                    placeholder="123 Main St, City, Country"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Medical Information */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Medical Information</h3>

                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="medicalHistory">Medical History</Label>
                                <Textarea
                                    id="medicalHistory"
                                    {...register('medicalHistory')}
                                    placeholder="Any relevant medical history..."
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="allergies">Allergies</Label>
                                <Textarea
                                    id="allergies"
                                    {...register('allergies')}
                                    placeholder="List any known allergies..."
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Emergency Contact</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="emergencyContactName">Contact Name</Label>
                                <Input
                                    id="emergencyContactName"
                                    {...register('emergencyContactName')}
                                    placeholder="Jane Doe"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                                <Input
                                    id="emergencyContactPhone"
                                    {...register('emergencyContactPhone')}
                                    placeholder="0987654321"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Account Creation */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="createAccount"
                                checked={createAccount}
                                onCheckedChange={(checked) => {
                                    setCreateAccount(checked as boolean);
                                    setValue('createAccount', checked as boolean);
                                }}
                            />
                            <Label htmlFor="createAccount" className="cursor-pointer">
                                Create login account for this patient
                            </Label>
                        </div>

                        {createAccount && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-blue-50">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Username *</Label>
                                    <Input
                                        id="username"
                                        {...register('username')}
                                        placeholder="johndoe123"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">Password *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        {...register('password')}
                                        placeholder="Min 6 characters"
                                    />
                                </div>

                                {errors.createAccount && (
                                    <p className="text-sm text-red-500 md:col-span-2">
                                        {errors.createAccount.message}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && (
                                <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
                            )}
                            Create Patient
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
