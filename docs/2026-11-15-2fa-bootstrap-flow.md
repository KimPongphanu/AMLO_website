# 2026-11-15 — เปลี่ยน flow บัญชี Admin: 2FA ก่อน แล้วจึงบังคับเปลี่ยนรหัสผ่าน (ลบ email OTP)

## สรุปการเปลี่ยนแปลง

ระบบเดิมใช้ **email OTP** เป็นหลักใน 2 เส้นทาง คือ (ก) บังคับเปลี่ยนรหัสผ่านหลัง Supervisor
force reset และ (ข) Forgot Password ของ admin ที่ยังไม่เปิด 2FA

ตอนนี้ **ลบ email OTP ออกจากทั้งระบบ** และใช้ **TOTP (Authenticator) เป็นวิธีเดียว**
โดยลำดับของบัญชี admin ใหม่/บัญชีที่ถูก force reset คือ

```
1. Supervisor สร้างบัญชี + ตั้งรหัสผ่านชั่วคราว (ส่งมอบด้วยวาจา/ช่องทางภายใน)
2. Admin login ด้วยอีเมล + รหัสผ่านชั่วคราว
3. Enroll 2FA (สแกน QR + กรอกรหัส 6 หลัก)
4. ตั้งรหัสผ่านใหม่  ← ไม่ต้องกรอก OTP อีก เพราะผ่าน 2FA มาแล้วในขั้นที่ 3
5. เข้า Dashboard
```

## ทำไมไม่ต้องมี OTP ในขั้นที่ 4

เดิมหน้านี้ส่ง OTP ทางอีเมลเพื่อ "ยืนยันอีกชั้น" แต่เมื่อผู้ใช้เพิ่งผ่านการยืนยัน TOTP
มาในขั้น enroll แล้ว การยืนยันซ้ำไม่เพิ่มหลักประกัน และ OTP ยังเป็น dependency ของอีเมล
อีกทั้งขั้นตอนเดิมทำให้ต้อง login 3 รอบ (login → เปลี่ยนรหัส → logout → login ใหม่)

## สิ่งที่บังคับที่ฝั่ง Server (สำคัญที่สุด)

ไฟล์ `backend/middlewares/auth.ts` + `backend/utils/bootstrapGate.ts`

ถ้า `forcePasswordReset = true` จะเข้าได้เฉพาะเส้นทางต่อไปนี้ (นอกจากนี้ตอบ `428`):

| สถานะ | อนุญาต |
|---|---|
| ยังไม่มี 2FA | `/api/auth/me`, `/logout`, `/heartbeat`, `/api/2fa/setup`, `/api/2fa/enable` |
| มี 2FA แล้ว | `/api/auth/me`, `/logout`, `/heartbeat`, `/api/auth/force-reset/verify` |

**ผลลัพธ์: ไม่สามารถข้ามขั้นได้** — เรียก `/api/auth/force-reset/verify` ก่อน enroll จะถูกบล็อก
และบัญชีที่ยัง bootstrap อยู่เข้าถึงข้อมูลธุรกิจไม่ได้เลย

> ⚠️ ตอบ `428` ไม่ใช่ `403` เพราะ `frontend/src/utils/api.ts` จะ redirect ไป `/login` เมื่อเจอ 403
> (จะทำให้ผู้ใช้หลุดออกจาก flow)

## อายุของรหัสผ่านชั่วคราว (72 ชั่วโมง)

- เพิ่มคอลัมน์ `User.tempPasswordIssuedAt`
- ตั้งค่าเมื่อ: Supervisor สร้าง admin, Supervisor สั่ง force reset, seed
- `loginUser` จะปฏิเสธ (403) ถ้าเกิน 72 ชม. — ต้องให้ Supervisor ออกให้ใหม่
- ตรรกะอยู่ใน `backend/utils/tempPasswordPolicy.ts` (pure function, มี unit test)

## ปิดช่องโหว่ที่พบระหว่างทาง

1. **`setup2FA` เคยคืน secret ของ 2FA ที่ active อยู่** → โคลน authenticator ได้ตลอดไป
   ตอนนี้ตอบ `409` ถ้าเปิดใช้งานแล้ว
2. **`/api/2fa/setup` และ `/enable` ไม่มี rate limit** → เดา TOTP 6 หลักได้ไม่จำกัด
   ตอนนี้ใช้ `verifyLimiter` (10 ครั้ง / 15 นาที)
3. **`resetPassword` ไม่เคยเคลียร์ `forcePasswordReset`** → เมื่อมี gate แล้วจะกลายเป็นลูปตาย
   ตอนนี้เคลียร์ flag + ตั้ง `passwordChangedAt`
4. **`registerUser` ไม่ตั้ง `forcePasswordReset`** (แต่ `createAdmin` ตั้ง) → บัญชีที่สร้างผ่าน
   `/api/auth/register` ข้าม flow ทั้งหมด ตอนนี้ตั้งเหมือนกันแล้ว
5. **ลบ `/api/2fa/otp/request`** ซึ่งเป็น endpoint ที่ไม่ต้อง auth แล้วสั่งยิงอีเมลได้ (email bombing)

## สิ่งที่แลกไป (ต้องรับทราบ)

- **ไม่มี out-of-band proof ตอน bootstrap** — การพิสูจน์ว่า "คนนี้คือเจ้าของบัญชี" เหลือเพียง
  "รู้รหัสผ่านชั่วคราวที่ Supervisor ตั้งให้" ซึ่งเป็น shared secret ระหว่าง 2 คน
- **มี race window**: ถ้าผู้ไม่หวังดีได้รหัสชั่วคราวไปและ enroll เครื่องตัวเองก่อนเจ้าตัวจริง
  จะยึดบัญชีได้ (แต่ Supervisor กู้คืนได้ด้วย force reset)
- **ชดเชยด้วยการแจ้งเตือน**: `backend/services/securityAlertService.ts` ส่งอีเมลหา Supervisor
  ทุกคนเมื่อ (ก) มีการ enroll 2FA และ (ข) มีการตั้งรหัสผ่านใหม่สำเร็จ
- **admin ที่ยังไม่ enroll 2FA ไม่สามารถ Forgot Password ด้วยตนเองได้** — ต้องให้ Supervisor
  force reset เท่านั้น (หน้า Forgot Password แจ้งข้อความนี้แล้ว)

## Migration

`backend/prisma/migrations/20261115000000_replace_email_otp_with_totp_flow/migration.sql`

- เพิ่ม `User.tempPasswordIssuedAt` (backfill = `now()` สำหรับบัญชีที่ถูก flag อยู่)
- ลบตาราง `email_otps`
- ลบ `EMAIL_OTP` ออกจาก enum `TwoFactorMethod` (rebuild type, คงข้อมูลเดิม)
- บัญชีที่เคยเป็น `EMAIL_OTP` จะถูกตั้งเป็น `NONE` + ปิด 2FA เพื่อให้ enroll ใหม่

ทดสอบแล้วบนฐานข้อมูลจำลอง: ข้อมูล 3 กรณี (`AUTHENTICATOR`, `NONE`, `EMAIL_OTP`) migrate
ถูกต้อง, default และ NOT NULL ของคอลัมน์ยังอยู่

## ไฟล์ที่แก้

**Backend**
- `middlewares/auth.ts` — bootstrap gate
- `utils/bootstrapGate.ts` — ตรรกะ gate (ใหม่)
- `utils/tempPasswordPolicy.ts` — TTL (ใหม่)
- `services/securityAlertService.ts` — แจ้งเตือน Supervisor (ใหม่)
- `controllers/forceResetController.ts` — ตัด OTP, เหลือแค่ตั้งรหัสผ่าน
- `controllers/passwordResetController.ts` — ตัด email OTP, เคลียร์ flag
- `controllers/twoFactorController.ts` — ตัด email OTP, กัน secret leak, แจ้งเตือน
- `controllers/checkEmailController.ts` — `requires2FA` ตาม 2FA จริง
- `controllers/authController.ts` — TTL check, flags ใน response, registerUser ตั้ง flag
- `controllers/adminUserController.ts`, `prisma/seed.ts` — ตั้ง `tempPasswordIssuedAt`
- `services/twoFactorService.ts`, `services/emailService.ts` — ลบ email OTP
- `middlewares/csrf.ts`, `middlewares/rateLimiter.ts`, `routes/*.ts` — ปรับตาม endpoint ที่เปลี่ยน
- `prisma/schema.prisma` + migration ใหม่

**Frontend**
- `routes/ProtectedRoute.tsx` — ลำดับใหม่: enroll 2FA → เปลี่ยนรหัสผ่าน → 2FA gate ปกติ
- `pages/ForcePasswordResetPage.tsx` — ตัด OTP input/timer, ไม่ logout หลังสำเร็จ
- `pages/TwoFactorSetup.tsx` — หลัง enroll ไปต่อหน้าเปลี่ยนรหัสผ่าน (ไม่ logout)
- `pages/TwoFactorChallenge.tsx` — เคารพ `forcePasswordReset`
- `pages/LoginPage.tsx` — แยกเส้นทางตามสถานะ bootstrap
- `pages/ForgotPassword.tsx` — ไม่มี email OTP แล้ว
- `services/twoFactorService.ts`, `type/auth.ts` — ลบ `EMAIL_OTP`

## การตรวจสอบที่ทำแล้ว

- `backend`: `npx tsc --noEmit` ผ่าน, `npx prisma validate` ผ่าน
- `frontend`: `npx tsc --noEmit` ผ่าน, `npm run build` ผ่าน
- unit test ตรรกะ gate 7 กรณี + TTL 5 กรณี (รันแยกด้วย Node, ไม่ commit)
- migration ทดสอบบน DB จำลองแล้ว และ apply กับ DB จริงเรียบร้อย
- ทดสอบ flow จริงบนระบบที่รันอยู่ (admin@amlo.go.th):
  - `GET /api/auth/me` → 200 (อนุญาต)
  - `GET /api/auth/users` → **428 ENROLL_2FA_REQUIRED** (บล็อก)
  - `POST /api/auth/force-reset/verify` ก่อน enroll → **428 ENROLL_2FA_REQUIRED** ✅ ลำดับถูกบังคับ
  - `POST /api/2fa/setup` → 200, `POST /api/2fa/enable` → 200
  - หลัง enroll: `GET /api/auth/users` → 428, `POST /api/auth/force-reset/verify` → 200
  - ฐานข้อมูลถูก restore กลับสู่สภาพก่อนทดสอบแล้ว (secret, recovery keys, password history, sessions, audit)

## ⚠️ ต้องแก้ก่อนใช้งานจริง: SMTP ยังชี้ไปที่ Ethereal (test account)

ระหว่างทดสอบ flow พบว่า `securityAlertService` ส่งอีเมล **ไม่สำเร็จ**:

```
[SecurityAlert] ส่งอีเมลถึง supervisor@amlo.go.th ไม่สำเร็จ:
  Error: Invalid login: 535 Authentication failed
```

สาเหตุ: `.env` ชี้ `SMTP_HOST=smtp.ethereal.email` ซึ่งเป็นบริการ **อีเมลทดสอบชั่วคราว**
credential หมดอายุได้ และ**ไม่ส่งอีเมลจริงออกไป** — เป็นของเดิมก่อนการเปลี่ยนแปลงนี้

**ผลกระทบต่อฟีเจอร์นี้โดยตรง:** การแจ้งเตือน Supervisor คือ control ที่ใช้แทน email OTP
ถ้าส่งไม่ออก การชดเชยความเสี่ยง bootstrap จะไม่ทำงาน (ยังบันทึกใน `AuditLog` ได้ แต่ไม่มีใครเห็น)

**ต้องทำ:** ตั้ง SMTP ของหน่วยงานจริงใน `.env` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`)
แล้วทดสอบส่งอีเมลอีกครั้ง — แนะนำให้ทดสอบก่อนปล่อยให้ admin คนแรก enroll

