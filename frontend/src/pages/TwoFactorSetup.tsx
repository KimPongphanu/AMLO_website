// src/pages/TwoFactorSetup.tsx
import {
  AlertTriangle,
  CheckCircle,
  KeyRound,
  ScanLine,
  Smartphone,
  X,
} from 'lucide-react'
import QRCode from 'qrcode'
import { useEffect, useRef, useState } from 'react'
import { FaQuestionCircle } from 'react-icons/fa'
import OtpInput from '../components/common/OtpInput'
import { twoFactorService } from '../services/twoFactorService'
import { useAuthStore } from '../stores/useAuthStore'

export default function TwoFactorSetup() {
  const { user } = useAuthStore()
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup')
  const [secret, setSecret] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [recoveryKeys, setRecoveryKeys] = useState<string[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [keysCopied, setKeysCopied] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')

  const didInit = useRef(false)

  useEffect(() => {
    // Strict Mode guard: run setup only once per true mount
    if (didInit.current || !user) return
    didInit.current = true

    if (user.twoFactorEnabled) {
      setStep('complete')
    } else {
      loadSetup()
    }
  }, [user])

  const loadSetup = async () => {
    setIsLoading(true)
    try {
      const response = await twoFactorService.setup2FA()
      setSecret(response.data.secret)
      // Generate QR code data URL client-side (no external API dependency)
      const dataUrl = await QRCode.toDataURL(response.data.otpauthUrl, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })
      setQrCodeDataUrl(dataUrl)
    } catch {
      setError('ไม่สามารถโหลดข้อมูลการตั้งค่า 2FA ได้')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!otpToken || otpToken.length !== 6) {
      setError('กรุณากรอกรหัส 6 หลักให้ครบ')
      return
    }

    setIsLoading(true)
    try {
      const response = await twoFactorService.enable2FA(otpToken)
      setRecoveryKeys(response.data.recoveryKeys)
      // 🌟 รีเฟรช user object ใน store เพื่อให้ twoFactorEnabled = true
      await useAuthStore.getState().verifyUser()
      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'รหัส OTP ไม่ถูกต้อง')
      setOtpToken('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerateKeys = async () => {
    setIsLoading(true)
    try {
      const response = await twoFactorService.regenerateRecoveryKeys()
      setRecoveryKeys(response.data.recoveryKeys)
      setKeysCopied(false)
    } catch {
      setError('ไม่สามารถสร้าง Recovery Keys ใหม่ได้')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyKeys = () => {
    navigator.clipboard.writeText(recoveryKeys.join('\n'))
    setKeysCopied(true)
    setTimeout(() => setKeysCopied(false), 3000)
  }

  const handlePrintKeys = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>AMLO Recovery Keys</title></head>
          <body>
            <h1>AMLO Recovery Keys — กุญแจสำรองสำหรับบัญชีของคุณ</h1>
            <p>เก็บรหัสเหล่านี้ในที่ปลอดภัย แต่ละรหัสใช้ได้ครั้งเดียวเท่านั้น</p>
            <ul>
              ${recoveryKeys.map((key) => `<li><strong>${key}</strong></li>`).join('')}
            </ul>
            <p>สร้างเมื่อ: ${new Date().toLocaleString('th-TH')}</p>
            <hr>
            <p><small>สำนักงานป้องกันและปราบปรามการฟอกเงิน (ปปง.)</small></p>
          </body>
        </html>
      `)
      printWindow.print()
      printWindow.close()
    }
  }

  if (user?.role !== 'SUPERVISOR') {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-50'>
        <div className='p-8 text-center bg-white rounded-lg shadow-md'>
          <h2 className='text-xl font-bold text-red-600'>ไม่มีสิทธิ์เข้าถึง</h2>
          <p className='mt-2 text-gray-600'>
            การตั้งค่า 2FA ใช้ได้เฉพาะบัญชี Supervisor เท่านั้น
          </p>
        </div>
      </div>
    )
  }

  if (
    step === 'complete' &&
    (user?.twoFactorEnabled || recoveryKeys.length > 0)
  ) {
    return (
      <div className='max-w-2xl mx-auto p-6'>
        <div className='bg-white rounded-lg shadow-md p-6'>
          <div className='text-center'>
            <div className='w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center'>
              <CheckCircle className='w-8 h-8 text-green-600' />
            </div>
            <h2 className='mt-4 text-xl font-bold text-gray-900'>
              เปิดใช้งาน 2FA แล้ว
            </h2>
            <p className='mt-2 text-gray-600'>
              บัญชีของคุณปลอดภัยด้วยการยืนยันตัวตนสองชั้น
            </p>
          </div>

          <div className='mt-6 border-t pt-6'>
            <h3 className='font-medium text-gray-900'>
              Recovery Keys ที่เหลือ
            </h3>
            <p className='text-sm text-gray-500 mt-1'>
              คุณมี Recovery Keys ที่ยังไม่ได้ใช้ {recoveryKeys.length} รหัส
            </p>
            <div className='mt-4 flex space-x-3'>
              <button
                onClick={handleRegenerateKeys}
                className='px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 cursor-pointer'
              >
                สร้าง Keys ใหม่
              </button>
              <button
                onClick={handlePrintKeys}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer'
              >
                พิมพ์ Keys
              </button>
            </div>

            {/* 🌟 แสดง Recovery Keys ทั้ง 8 รหัส */}
            <div className='mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
              <h3 className='font-bold text-yellow-800'>
                ⚠️ บันทึก Recovery Keys ของคุณ
              </h3>
              <p className='text-sm text-yellow-700 mt-1'>
                รหัสเหล่านี้ใช้สำหรับเข้าสู่ระบบหากคุณไม่สามารถใช้ 2FA ได้ (เช่น
                มือถือหาย) แต่ละรหัสใช้ได้ครั้งเดียว เก็บไว้ในที่ปลอดภัย
              </p>

              <div className='mt-3 p-3 bg-white rounded border'>
                <div className='grid grid-cols-2 gap-2 font-mono text-sm'>
                  {recoveryKeys.map((key, idx) => (
                    <div key={idx} className='p-1'>
                      {idx + 1}. {key}
                    </div>
                  ))}
                </div>
              </div>

              <div className='mt-4 flex space-x-3'>
                <button
                  onClick={handleCopyKeys}
                  className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 cursor-pointer'
                >
                  {keysCopied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
                </button>
                <button
                  onClick={handlePrintKeys}
                  className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer'
                >
                  พิมพ์
                </button>
              </div>
            </div>

            <div className='mt-6 flex justify-end'>
              <button
                onClick={() => {
                  // Logout แล้ว redirect ไปหน้า login เพื่อให้ login ใหม่ด้วย 2FA
                  useAuthStore.getState().logoutUser()
                }}
                className='px-6 py-2.5 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 cursor-pointer transition-colors'
              >
                เสร็จสิ้น → ไปยังหน้าเข้าสู่ระบบ
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='max-w-2xl mx-auto p-6'>
      <div className='bg-white rounded-lg shadow-md p-6'>
        {/* Header with Tips button */}
        <div className='flex items-center gap-2'>
          <h1 className='text-2xl font-bold text-gray-900'>
            ตั้งค่า Two-Factor Authentication (2FA)
          </h1>
          <button
            onClick={() => setShowTips(true)}
            className='text-blue-500 hover:text-blue-700 transition-colors cursor-pointer'
            title='ดูคำแนะนำ'
          >
            <FaQuestionCircle size={22} />
          </button>
        </div>
        <p className='mt-2 text-gray-600'>
          เพิ่มความปลอดภัยให้บัญชี Supervisor ของคุณด้วย Google Authenticator
          หรือ Microsoft Authenticator
        </p>

        {/* Tips Modal */}
        {showTips && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
            <div className='bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6 relative'>
              <button
                onClick={() => setShowTips(false)}
                className='absolute top-4 right-4 text-gray-400 hover:text-gray-700 cursor-pointer'
              >
                <X size={24} />
              </button>

              <h2 className='text-lg font-bold text-gray-900 mb-4'>
                วิธีตั้งค่า Google Authenticator
              </h2>

              <div className='space-y-4'>
                <div className='flex gap-3'>
                  <div className='flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                    <Smartphone className='w-4 h-4 text-blue-600' />
                  </div>
                  <div>
                    <h3 className='font-medium text-gray-900'>
                      ขั้นตอนที่ 1: ติดตั้งแอป
                    </h3>
                    <p className='text-sm text-gray-600 mt-1'>
                      <strong>iOS:</strong> ไปที่ App Store → ค้นหา "Google
                      Authenticator"
                      <br />
                      <strong>Android:</strong> ไปที่ Play Store → ค้นหา "Google
                      Authenticator"
                    </p>
                  </div>
                </div>

                <div className='flex gap-3'>
                  <div className='flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                    <ScanLine className='w-4 h-4 text-blue-600' />
                  </div>
                  <div>
                    <h3 className='font-medium text-gray-900'>
                      ขั้นตอนที่ 2: เพิ่มบัญชี
                    </h3>
                    <p className='text-sm text-gray-600 mt-1'>
                      เปิดแอป → กดปุ่ม "+" หรือ "Add account" → เลือก "Scan a QR
                      code" → สแกน QR Code บนหน้านี้
                    </p>
                  </div>
                </div>

                <div className='flex gap-3'>
                  <div className='flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                    <KeyRound className='w-4 h-4 text-blue-600' />
                  </div>
                  <div>
                    <h3 className='font-medium text-gray-900'>
                      ขั้นตอนที่ 3: กรอกรหัสยืนยัน
                    </h3>
                    <p className='text-sm text-gray-600 mt-1'>
                      แอปจะแสดงรหัส 6 หลักที่เปลี่ยนทุก 30 วินาที —
                      กรอกรหัสปัจจุบันลงในช่องด้านล่าง
                    </p>
                  </div>
                </div>

                <div className='flex gap-3'>
                  <div className='flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
                    <AlertTriangle className='w-4 h-4 text-yellow-600' />
                  </div>
                  <div>
                    <h3 className='font-medium text-gray-900'>ข้อควรระวัง</h3>
                    <p className='text-sm text-gray-600 mt-1'>
                      รหัสเปลี่ยนทุก 30 วินาที — ต้องกรอกให้ทันเวลา!
                      <br />
                      <strong>Recovery Keys</strong> คือทางสำรองถ้ามือถือหาย —
                      ต้องบันทึกไว้ในที่ปลอดภัย
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowTips(false)}
                className='mt-6 w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors cursor-pointer'
              >
                ตกลง
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className='mt-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg'>
            {error}
          </div>
        )}

        {isLoading ? (
          <div className='flex justify-center py-12'>
            <div className='w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
          </div>
        ) : (
          <>
            {step === 'setup' && (
              <>
                <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
                  <h3 className='font-medium text-gray-900'>
                    ขั้นตอนที่ 1: สแกน QR Code
                  </h3>
                  <p className='text-sm text-gray-500 mt-1'>
                    เปิด Google Authenticator หรือ Microsoft Authenticator
                    แล้วสแกน QR Code ด้านล่าง
                  </p>

                  <div className='mt-4 flex justify-center'>
                    <div className='p-4 bg-white rounded-lg border'>
                      {qrCodeDataUrl && (
                        <img
                          src={qrCodeDataUrl}
                          alt='QR Code สำหรับตั้งค่า 2FA'
                          className='w-48 h-48'
                        />
                      )}
                    </div>
                  </div>

                  <p className='mt-3 text-sm text-gray-500 text-center'>
                    สแกนไม่ได้? ป้อนรหัสนี้ด้วยตนเอง:{' '}
                    <code className='px-1 py-0.5 bg-gray-200 rounded text-xs break-all'>
                      {secret}
                    </code>
                  </p>
                </div>

                <div className='mt-6 p-4 bg-gray-50 rounded-lg'>
                  <h3 className='font-medium text-gray-900'>
                    ขั้นตอนที่ 2: ยืนยันการตั้งค่า
                  </h3>
                  <p className='text-sm text-gray-500 mt-1'>
                    กรอกรหัส 6 หลักจากแอปพลิเคชันยืนยันตัวตน:
                  </p>
                  <div className='mt-3'>
                    <OtpInput
                      value={otpToken}
                      onChange={(val) => {
                        setOtpToken(val)
                        setError('')
                      }}
                      error={error}
                    />
                  </div>
                </div>

                <div className='mt-6 flex justify-end'>
                  <button
                    onClick={handleVerify}
                    disabled={!otpToken || otpToken.length !== 6}
                    className='px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors'
                  >
                    เปิดใช้งาน 2FA
                  </button>
                </div>
              </>
            )}

            {step === 'complete' && recoveryKeys.length > 0 && (
              <div className='mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
                <h3 className='font-bold text-yellow-800'>
                  ⚠️ บันทึก Recovery Keys ของคุณ
                </h3>
                <p className='text-sm text-yellow-700 mt-1'>
                  รหัสเหล่านี้ใช้สำหรับเข้าสู่ระบบหากคุณไม่สามารถใช้ 2FA ได้
                  (เช่น มือถือหาย) แต่ละรหัสใช้ได้ครั้งเดียว เก็บไว้ในที่ปลอดภัย
                </p>

                <div className='mt-3 p-3 bg-white rounded border'>
                  <div className='grid grid-cols-2 gap-2 font-mono text-sm'>
                    {recoveryKeys.map((key, idx) => (
                      <div key={idx} className='p-1'>
                        {idx + 1}. {key}
                      </div>
                    ))}
                  </div>
                </div>

                <div className='mt-4 flex space-x-3'>
                  <button
                    onClick={handleCopyKeys}
                    className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 cursor-pointer'
                  >
                    {keysCopied ? 'คัดลอกแล้ว!' : 'คัดลอก'}
                  </button>
                  <button
                    onClick={handlePrintKeys}
                    className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer'
                  >
                    พิมพ์
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
