import React from 'react';
import { useForm } from 'react-hook-form';

export default function ClientIntakeForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const onSubmit = data => alert(JSON.stringify(data, null, 2));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl mx-auto bg-white p-8 rounded shadow-md border border-gray-200 mt-8">
      <h2 className="text-2xl font-bold text-navy-900 mb-6">Client Intake Form</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-gray-700">First Name</label>
          <input {...register('firstName', { required: 'First name is required' })} className="input" />
          {errors.firstName && <span className="text-red-500 text-xs">{errors.firstName.message}</span>}
        </div>
        <div>
          <label className="block text-gray-700">Last Name</label>
          <input {...register('lastName', { required: 'Last name is required' })} className="input" />
          {errors.lastName && <span className="text-red-500 text-xs">{errors.lastName.message}</span>}
        </div>
        <div>
          <label className="block text-gray-700">Email</label>
          <input type="email" {...register('email', { required: 'Email is required' })} className="input" />
          {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
        </div>
        <div>
          <label className="block text-gray-700">Phone</label>
          <input {...register('phone', { required: 'Phone is required' })} className="input" />
          {errors.phone && <span className="text-red-500 text-xs">{errors.phone.message}</span>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-gray-700">Case Description</label>
          <textarea {...register('caseDescription', { required: 'Case description is required' })} className="input h-24" />
          {errors.caseDescription && <span className="text-red-500 text-xs">{errors.caseDescription.message}</span>}
        </div>
      </div>
      <button type="submit" className="mt-6 w-full bg-navy-900 text-white py-2 rounded hover:bg-navy-800 transition">Submit</button>
    </form>
  );
}
