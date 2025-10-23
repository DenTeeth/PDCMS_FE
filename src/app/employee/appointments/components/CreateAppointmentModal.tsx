'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faSearch,
    faArrowRight,
    faArrowLeft,
    faCheck,
    faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import { appointmentService } from '@/services/appointmentService';
import {
    Patient,
    Service,
    Dentist,
    DentistAvailability,
    CreateAppointmentRequest,
} from '@/types/appointment';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface CreateAppointmentModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const appointmentSchema = z.object({
    patientId: z.number().min(1, 'Please select a patient'),
    serviceId: z.number().min(1, 'Please select a service'),
    dentistId: z.number().min(1, 'Please select a dentist'),
    appointmentDate: z.string().min(1, 'Please select a date'),
    startTime: z.string().min(1, 'Please select a time'),
    endTime: z.string().min(1),
    notes: z.string().optional(),
    reasonForVisit: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export default function CreateAppointmentModal({
    open,
    onClose,
    onSuccess,
}: CreateAppointmentModalProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Data states
    const [patients, setPatients] = useState<Patient[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [dentists, setDentists] = useState<Dentist[]>([]);
    const [availableSlots, setAvailableSlots] = useState<DentistAvailability[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string>('');

    // Search
    const [patientSearch, setPatientSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Patient[]>([]);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<AppointmentFormData>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            notes: '',
            reasonForVisit: '',
        },
    });

    const selectedPatientId = watch('patientId');
    const selectedServiceId = watch('serviceId');
    const selectedDate = watch('appointmentDate');
    const selectedDentistId = watch('dentistId');

    // Load initial data
    useEffect(() => {
        if (open) {
            loadServices();
            loadDentists();
        }
    }, [open]);

    // Search patients
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (patientSearch.length >= 2) {
                searchPatients();
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [patientSearch]);

    // Load available slots when date and service are selected
    useEffect(() => {
        if (selectedDate && selectedServiceId) {
            loadAvailableSlots();
        }
    }, [selectedDate, selectedServiceId]);

    const searchPatients = async () => {
        try {
            const results = await appointmentService.searchPatients(patientSearch);
            setSearchResults(results);
        } catch (error: any) {
            toast.error('Failed to search patients');
        }
    };

    const loadServices = async () => {
        try {
            const data = await appointmentService.getServices();
            setServices(data);
        } catch (error: any) {
            toast.error('Failed to load services');
        }
    };

    const loadDentists = async () => {
        try {
            const data = await appointmentService.getDentists();
            setDentists(data);
        } catch (error: any) {
            toast.error('Failed to load dentists');
        }
    };

    const loadAvailableSlots = async () => {
        try {
            setLoading(true);
            const data = await appointmentService.getAllAvailableDentists(selectedDate, selectedServiceId);
            setAvailableSlots(data);
        } catch (error: any) {
            toast.error('Failed to load available slots');
        } finally {
            setLoading(false);
        }
    };

    const selectPatient = (patient: Patient) => {
        setValue('patientId', patient.id);
        setPatientSearch(patient.fullName);
        setSearchResults([]);
    };

    const selectTimeSlot = (dentistId: number, startTime: string, endTime: string) => {
        setValue('dentistId', dentistId);
        setValue('startTime', startTime);
        setValue('endTime', endTime);
        setSelectedSlot(`${dentistId}-${startTime}`);
    };

    const handleNext = () => {
        // Validate current step before moving forward
        if (step === 1 && !selectedPatientId) {
            toast.error('Please select a patient');
            return;
        }
        if (step === 2 && !selectedServiceId) {
            toast.error('Please select a service');
            return;
        }
        if (step === 3 && !selectedDate) {
            toast.error('Please select a date');
            return;
        }
        if (step === 3 && !selectedSlot) {
            toast.error('Please select a time slot');
            return;
        }
        if (step === 4 && !selectedDentistId) {
            toast.error('Please select a dentist');
            return;
        }

        setStep(step + 1);
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const onSubmit = async (data: AppointmentFormData) => {
        try {
            setLoading(true);

            // Check for conflicts
            const conflictCheck = await appointmentService.checkConflicts(
                data.dentistId,
                data.appointmentDate,
                data.startTime,
                data.endTime
            );

            if (conflictCheck.hasConflict) {
                toast.error('Schedule Conflict', {
                    description: conflictCheck.message || 'This time slot conflicts with another appointment',
                });
                return;
            }

            // Create appointment
            await appointmentService.createAppointment(data);

            toast.success('Appointment Created', {
                description: 'The appointment has been successfully scheduled',
            });

            handleClose();
            onSuccess();
        } catch (error: any) {
            toast.error('Failed to create appointment', {
                description: error.message || 'Please try again later',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        reset();
        setPatientSearch('');
        setSearchResults([]);
        setSelectedSlot('');
        onClose();
    };

    const selectedPatient = searchResults.find((p) => p.id === selectedPatientId);
    const selectedService = services.find((s) => s.id === selectedServiceId);
    const selectedDentist = dentists.find((d) => d.id === selectedDentistId);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Appointment</DialogTitle>
                    <DialogDescription>Step {step} of 6</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Step 1: Select Patient */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="patientSearch">Search Patient</Label>
                                <div className="relative">
                                    <Input
                                        id="patientSearch"
                                        placeholder="Search by name or phone..."
                                        value={patientSearch}
                                        onChange={(e) => setPatientSearch(e.target.value)}
                                        className="pr-10"
                                    />
                                    <FontAwesomeIcon
                                        icon={faSearch}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    />
                                </div>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                                    {searchResults.map((patient) => (
                                        <div
                                            key={patient.id}
                                            onClick={() => selectPatient(patient)}
                                            className="p-3 hover:bg-gray-50 cursor-pointer"
                                        >
                                            <div className="font-medium">{patient.fullName}</div>
                                            <div className="text-sm text-gray-600">{patient.phone}</div>
                                            {patient.email && (
                                                <div className="text-sm text-gray-500">{patient.email}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedPatient && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                                        <FontAwesomeIcon icon={faCheck} />
                                        Selected Patient
                                    </div>
                                    <div className="text-gray-900">{selectedPatient.fullName}</div>
                                    <div className="text-sm text-gray-600">{selectedPatient.phone}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 2: Select Service */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="serviceId">Select Service</Label>
                                <div className="grid gap-3 mt-2">
                                    {services.map((service) => (
                                        <div
                                            key={service.id}
                                            onClick={() => setValue('serviceId', service.id)}
                                            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedServiceId === service.id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="font-medium">{service.name}</div>
                                            {service.description && (
                                                <div className="text-sm text-gray-600 mt-1">{service.description}</div>
                                            )}
                                            <div className="flex items-center justify-between mt-2 text-sm">
                                                <span className="text-gray-600">Duration: {service.duration} mins</span>
                                                <span className="font-medium text-primary">
                                                    ${service.price.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Select Date & Time */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="appointmentDate">Select Date</Label>
                                <Input
                                    id="appointmentDate"
                                    type="date"
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    {...register('appointmentDate')}
                                    className="mt-1"
                                />
                            </div>

                            {selectedDate && (
                                <div>
                                    <Label>Available Time Slots</Label>
                                    {loading ? (
                                        <div className="text-center py-8 text-gray-500">Loading available slots...</div>
                                    ) : availableSlots.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            No available slots for this date
                                        </div>
                                    ) : (
                                        <div className="space-y-4 mt-2">
                                            {availableSlots.map((dentistAvail) => (
                                                <div key={dentistAvail.dentistId} className="border rounded-lg p-4">
                                                    <div className="font-medium mb-3">{dentistAvail.dentistName}</div>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {dentistAvail.availableSlots.map((slot) =>
                                                            slot.available ? (
                                                                <Button
                                                                    key={`${dentistAvail.dentistId}-${slot.startTime}`}
                                                                    type="button"
                                                                    variant={
                                                                        selectedSlot === `${dentistAvail.dentistId}-${slot.startTime}`
                                                                            ? 'default'
                                                                            : 'outline'
                                                                    }
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        selectTimeSlot(
                                                                            dentistAvail.dentistId,
                                                                            slot.startTime,
                                                                            slot.endTime
                                                                        )
                                                                    }
                                                                    className="text-xs"
                                                                >
                                                                    {slot.startTime}
                                                                </Button>
                                                            ) : null
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Confirm Dentist */}
                    {step === 4 && selectedDentist && (
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="font-medium text-blue-900 mb-2">Assigned Dentist</div>
                                <div className="text-gray-900">{selectedDentist.fullName}</div>
                                {selectedDentist.specialization && (
                                    <div className="text-sm text-gray-600">{selectedDentist.specialization}</div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 5: Add Notes */}
                    {step === 5 && (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="reasonForVisit">Reason for Visit (Optional)</Label>
                                <Textarea
                                    id="reasonForVisit"
                                    placeholder="e.g., Toothache, Regular checkup..."
                                    {...register('reasonForVisit')}
                                    rows={3}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Any special instructions or information..."
                                    {...register('notes')}
                                    rows={3}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 6: Confirm */}
                    {step === 6 && (
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                                <div>
                                    <div className="text-sm text-gray-600">Patient</div>
                                    <div className="font-medium">{selectedPatient?.fullName}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Service</div>
                                    <div className="font-medium">{selectedService?.name}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Date & Time</div>
                                    <div className="font-medium">
                                        {format(new Date(selectedDate), 'PPP')} at {watch('startTime')}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Dentist</div>
                                    <div className="font-medium">{selectedDentist?.fullName}</div>
                                </div>
                            </div>

                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                                <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 mt-1" />
                                <div className="text-sm text-yellow-800">
                                    Please review all details carefully before confirming the appointment.
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex items-center justify-between">
                        <div>
                            {step > 1 && (
                                <Button type="button" variant="outline" onClick={handleBack}>
                                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                                    Back
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={handleClose}>
                                Cancel
                            </Button>
                            {step < 6 ? (
                                <Button type="button" onClick={handleNext}>
                                    Next
                                    <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                                </Button>
                            ) : (
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Creating...' : 'Confirm Appointment'}
                                    <FontAwesomeIcon icon={faCheck} className="ml-2" />
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
