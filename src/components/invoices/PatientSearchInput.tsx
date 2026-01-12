"use client";

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2 } from 'lucide-react';
import { patientService } from '@/services/patientService';
import { Patient } from '@/types/patient';

interface PatientSearchInputProps {
  onPatientSelect: (patientId: number | null) => void;
}

export default function PatientSearchInput({ onPatientSelect }: PatientSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setPatients([]);
      setShowDropdown(false);
      return;
    }

    const id = setTimeout(async () => {
      setLoading(true);
      try {
        // patientService.searchPatients should exist; expects { query, size }
        const res = await patientService.searchPatients({ query: searchTerm.trim(), size: 10 });
        setPatients(res || []);
        setShowDropdown(true);
      } catch (error) {
        console.error('Patient search error', error);
        setPatients([]);
        setShowDropdown(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(id);
  }, [searchTerm]);

  const handleSelect = (p: Patient) => {
    setSearchTerm(p.fullName);
    setShowDropdown(false);
    // Convert patientId from string to number
    onPatientSelect(parseInt(p.patientId, 10));
  };

  const handleClear = () => {
    setSearchTerm('');
    setPatients([]);
    setShowDropdown(false);
    onPatientSelect(null);
  };

  return (
    <div className="relative">
      <label className="text-sm font-medium mb-1 block">Tìm bệnh nhân</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tên hoặc SĐT bệnh nhân..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <X
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 cursor-pointer"
            onClick={handleClear}
          />
        )}
        {loading && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {showDropdown && patients.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {patients.map((patient) => (
            <div
              key={patient.patientId}
              className="px-4 py-3 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(patient)}
            >
              <div className="font-medium">{patient.fullName}</div>
              <div className="text-sm text-gray-500">ID: {patient.patientId} | SĐT: {patient.phone || '-'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
