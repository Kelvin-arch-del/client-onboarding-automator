import React from 'react';

const steps = [
  'Intake',
  'Consultation',
  'Documents',
  'Preparation',
  'Active',
  'Complete'
];

export default function WorkflowProgressTracker({ currentStep = 0 }) {
  return (
    <div className="flex items-center justify-center mt-8">
      {steps.map((step, idx) => (
        <div key={step} className="flex items-center">
          <div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold text-white ${idx <= currentStep ? 'bg-navy-900' : 'bg-gray-300'}`}>{idx + 1}</div>
          <span className={`ml-2 mr-4 text-sm ${idx <= currentStep ? 'text-navy-900' : 'text-gray-400'}`}>{step}</span>
          {idx < steps.length - 1 && <div className={`w-8 h-1 ${idx < currentStep ? 'bg-navy-900' : 'bg-gray-200'}`}></div>}
        </div>
      ))}
    </div>
  );
}
