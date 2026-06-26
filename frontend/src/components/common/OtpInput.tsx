// src/components/common/OtpInput.tsx
import { useCallback, useEffect, useRef } from 'react'

interface OtpInputProps {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
  error?: string | boolean
  onComplete?: (otp: string) => void
}

const OTP_LENGTH = 6

export default function OtpInput({
  value,
  onChange,
  disabled = false,
  error = false,
  onComplete,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>(
    Array(OTP_LENGTH).fill(null),
  )

  const getDigits = useCallback((): string[] => {
    const digits = value.replace(/\D/g, '').split('').slice(0, OTP_LENGTH)
    while (digits.length < OTP_LENGTH) {
      digits.push('')
    }
    return digits
  }, [value])

  const handleChange = (index: number, char: string) => {
    const digit = char.replace(/\D/g, '').slice(0, 1)
    if (!digit) return

    const digits = getDigits()
    digits[index] = digit
    const newValue = digits.join('')
    onChange(newValue)

    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 digits entered — pass newValue directly to avoid stale closure
    if (newValue.length === OTP_LENGTH && onComplete) {
      setTimeout(() => onComplete(newValue), 0)
    }
  }

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      const digits = getDigits()

      if (digits[index]) {
        digits[index] = ''
        onChange(digits.join(''))
      } else if (index > 0) {
        digits[index - 1] = ''
        onChange(digits.join(''))
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, OTP_LENGTH)
    if (!pasted) return

    onChange(pasted)

    const nextIndex =
      pasted.length < OTP_LENGTH ? pasted.length : OTP_LENGTH - 1
    inputRefs.current[nextIndex]?.focus()

    if (pasted.length === OTP_LENGTH && onComplete) {
      setTimeout(() => onComplete(pasted), 0)
    }
  }

  const handleFocus = (index: number) => {
    inputRefs.current[index]?.select()
  }

  useEffect(() => {
    const digits = getDigits()
    const firstEmpty = digits.findIndex((d) => !d)
    if (firstEmpty >= 0) {
      inputRefs.current[firstEmpty]?.focus()
    } else {
      inputRefs.current[0]?.focus()
    }
  }, [])

  const digits = getDigits()
  const hasError = !!error
  const errorText = typeof error === 'string' ? error : ''

  return (
    <div className='flex flex-col items-center gap-3'>
      <div className='flex items-center justify-center gap-2'>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type='text'
            inputMode='numeric'
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            disabled={disabled}
            autoComplete='one-time-code'
            className={`w-12 h-14 text-center text-2xl font-bold bg-slate-50 border-2 rounded-xl outline-none transition-colors ${
              hasError
                ? 'border-red-500 focus:border-red-500 bg-red-50'
                : digit
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 focus:border-blue-500'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        ))}
      </div>
      {errorText && (
        <p className='text-[13px] text-red-500 font-bold text-center m-0'>
          {errorText}
        </p>
      )}
    </div>
  )
}
