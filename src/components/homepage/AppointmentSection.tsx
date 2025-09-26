"use client";

import { useState } from "react";

interface AppointmentForm {
  fullName: string;
  phone: string;
  service: string;
  time: string;
}

export default function AppointmentSection() {
  const [appointmentForm, setAppointmentForm] = useState<AppointmentForm>({
    fullName: "",
    phone: "",
    service: "",
    time: ""
  });

  const handleAppointmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle appointment booking
    console.log("Appointment booked:", appointmentForm);
    alert("Appointment booked successfully! We will contact you soon.");
    setAppointmentForm({ fullName: "", phone: "", service: "", time: "" });
  };

  return (
    <section id="appointment" className="py-20 bg-accent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Book an Appointment
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Tell us your problem, book an appointment, and get the best advice from experts in the field.
            </p>
            
            <form onSubmit={handleAppointmentSubmit} className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  required
                  value={appointmentForm.fullName}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  required
                  value={appointmentForm.phone}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div>
                <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type
                </label>
                <select
                  id="service"
                  required
                  value={appointmentForm.service}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, service: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                >
                  <option value="">Select a service</option>
                  <option value="pediatric">Pediatric Dentistry</option>
                  <option value="implants">Implant Dentistry</option>
                  <option value="cosmetic">Cosmetic Dentistry</option>
                  <option value="general">General Checkup</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Time
                </label>
                <input
                  type="datetime-local"
                  id="time"
                  required
                  value={appointmentForm.time}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary bg-white"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                BOOK APPOINTMENT
              </button>
            </form>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-semibold mb-6">OR CALL NOW</h3>
            <div className="text-center mb-8">
              <div className="text-4xl font-bold text-primary mb-2">(+84) 123 567 890</div>
              <p className="text-gray-600">
                Call us for online consultation or to book an appointment at the clinic as soon as possible.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">📍</div>
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-gray-600">123 ABC Street, District 1, Ho Chi Minh City</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-2xl">⏰</div>
                <div>
                  <p className="font-medium">Working Hours</p>
                  <p className="text-gray-600">Monday - Sunday: 8:00 AM - 8:00 PM</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-2xl">✉️</div>
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-gray-600">contact@denteeth.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}