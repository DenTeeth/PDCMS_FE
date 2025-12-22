"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const ContactSchema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ và tên'),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional(),
  source: z.string().optional(),
  serviceInterested: z.string().optional(),
  message: z.string().optional(),
});

export type ContactFormValues = z.infer<typeof ContactSchema>;

const sourceOptions = [
  { value: '', label: 'Chọn nguồn...' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'ZALO', label: 'Zalo' },
  { value: 'WALK_IN', label: 'Đến trực tiếp' },
  { value: 'REFERRAL', label: 'Giới thiệu' },
];

const serviceOptions = [
  { value: '', label: 'Chọn dịch vụ...' },
  { value: 'GENERAL_CHECKUP', label: 'Khám tổng quát' },
  { value: 'TEETH_CLEANING', label: 'Vệ sinh răng miệng' },
  { value: 'TEETH_WHITENING', label: 'Tẩy trắng răng' },
  { value: 'FILLING', label: 'Trám răng' },
  { value: 'ROOT_CANAL', label: 'Điều trị tủy' },
  { value: 'EXTRACTION', label: 'Nhổ răng' },
  { value: 'BRACES', label: 'Niềng răng' },
  { value: 'IMPLANT', label: 'Cấy ghép Implant' },
  { value: 'CROWN', label: 'Bọc răng sứ' },
  { value: 'BRIDGE', label: 'Cầu răng' },
  { value: 'DENTURE', label: 'Hàm giả' },
  { value: 'CONSULTATION', label: 'Tư vấn' },
  { value: 'OTHER', label: 'Khác' },
];

export default function ContactForm({ defaultValues, onSubmit }: { defaultValues?: Partial<ContactFormValues>; onSubmit: (v: ContactFormValues) => void; }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ContactFormValues>({
    resolver: zodResolver(ContactSchema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Họ và tên <span className="text-red-500">*</span></label>
          <input
            {...register('fullName')}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
          <input
            {...register('phone')}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            {...register('email')}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nguồn</label>
          <select
            {...register('source')}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white"
          >
            {sourceOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Dịch vụ quan tâm</label>
          <select
            {...register('serviceInterested')}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white"
          >
            {serviceOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700">Tin nhắn</label>
          <textarea
            {...register('message')}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </form>
  );
}
