/**
 * InterviewStepper — progress indicator for the 4-step interview setup flow.
 * Inspired by the magic stepper component from 21st.dev.
 *
 * Props:
 *   currentStep  {number}  1-based active step
 *   steps        {Array}   [{ label: string }]
 */

export default function InterviewStepper({ currentStep, steps }) {
  return (
    <div className="mb-8">
      {/* Step bars + labels */}
      <div className="flex items-start gap-3">
        {steps.map((step, idx) => {
          const stepNum  = idx + 1
          const isActive    = stepNum === currentStep
          const isCompleted = stepNum < currentStep

          return (
            <div key={stepNum} className="flex flex-col flex-1 gap-2.5">
              {/* Progress bar */}
              <div
                className="h-1 w-full rounded-full transition-all duration-300"
                style={{
                  background: isCompleted
                    ? '#22C55E'
                    : isActive
                    ? 'linear-gradient(90deg, #22C55E 0%, #166534 100%)'
                    : '#1F2937',
                  boxShadow: isActive ? '0 0 8px rgba(34,197,94,0.4)' : 'none',
                }}
              />

              {/* Label + check */}
              <div className="flex items-center gap-1.5">
                {isCompleted ? (
                  <span
                    className="flex items-center justify-center shrink-0 rounded-full"
                    style={{ width: 16, height: 16, background: '#22C55E' }}
                  >
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                ) : (
                  <span
                    className="flex items-center justify-center shrink-0 rounded-full font-mono font-bold text-[9px] transition-all duration-200"
                    style={{
                      width: 16, height: 16,
                      background: isActive ? '#22C55E' : '#1F2937',
                      color: isActive ? '#000' : '#4B5563',
                      border: isActive ? 'none' : '1px solid #374151',
                    }}
                  >
                    {stepNum}
                  </span>
                )}

                <span
                  className="text-xs font-medium truncate transition-colors duration-200"
                  style={{
                    color: isCompleted ? '#22C55E' : isActive ? '#F9FAFB' : '#4B5563',
                    fontFamily: isActive ? 'inherit' : 'inherit',
                  }}
                >
                  {step.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Step counter */}
      <p className="text-xs font-mono text-gray-600 mt-3">
        Step {currentStep} of {steps.length}
      </p>
    </div>
  )
}
