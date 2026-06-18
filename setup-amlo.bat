@echo off
chcp 65001 >nul
title AMLO System Setup
echo ============================================
echo  ติดตั้งระบบ AMLO (Docker Production)
echo ============================================
echo.
echo Step 1/4: Login Docker Hub
echo (โปรดเตรียม Username และ Password ของ Docker Hub)
echo.
docker login
if %errorlevel% neq 0 (
    echo ❌ Login ล้มเหลว
    pause
    exit /b 1
)
echo ✅ Login สำเร็จ
echo.

echo Step 2/4: Pull images และ Start containers
echo.
docker-compose -f docker-compose.prod.yml up -d
if %errorlevel% neq 0 (
    echo ❌ Pull/Start ล้มเหลว
    pause
    exit /b 1
)
echo ✅ Containers กำลังทำงาน
echo.

echo Step 3/4: สร้างตารางฐานข้อมูล (Migrate)
echo.
docker exec -it amlo-backend sh -c "DATABASE_URL=postgresql://postgres:12345@postgres:5432/backend_amlo npx prisma migrate deploy"
echo ✅ Migrate สำเร็จ
echo.

echo Step 4/4: เพิ่มข้อมูลเริ่มต้น (Seed)
echo.
docker exec -it amlo-backend sh -c "DATABASE_URL=postgresql://postgres:12345@postgres:5432/backend_amlo npx tsx prisma/seed.ts"
echo ✅ Seed สำเร็จ
echo.

echo ============================================
echo  ✅ ระบบ AMLO พร้อมใช้งาน!
echo  🌐 http://localhost
echo  📧 kimpongphanu@gmail.com
echo  🔑 SuperSecurePassword123!@#
echo ============================================
echo.
pause