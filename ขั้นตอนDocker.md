## ขั้นตอน Docker Registry (Docker Hub) แบบละเอียด

### สิ่งที่ต้องเตรียม

1. **สมัคร Docker Hub ฟรี** → https://hub.docker.com
2. **สร้าง Repository** 2 อัน (Public = ฟรี):
   - `amlo-backend`
   - `amlo-frontend`

---

### ขั้นตอนที่ 1: Login + Tag + Push (ทำบนเครื่องเราครั้งเดียว)

```bash
# เข้าสู่ระบบ Docker Hub
docker login
# (ใส่ username / password Docker Hub)

# Tag images
docker tag amlo-backend:latest yourusername/amlo-backend:latest
docker tag amlo-frontend:latest yourusername/amlo-frontend:latest

# Push ขึ้น Docker Hub
docker push yourusername/amlo-backend:latest
docker push yourusername/amlo-frontend:latest
```

---

### ขั้นตอนที่ 2: สร้าง `docker-compose.prod.yml` สำหรับเครื่องปลายทาง

สร้างไฟล์ใหม่ **`docker-compose.prod.yml`** (push ขึ้น git หรือส่งไปให้เครื่องอื่น):

```yaml
name: amlo

services:
  postgres:
    image: postgres:16-alpine
    container_name: amlo-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: backend_amlo
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-12345}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: yourusername/amlo-backend:latest # <-- pull from registry
    container_name: amlo-backend
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD:-12345}@postgres:5432/backend_amlo
      JWT_SECRET: ${JWT_SECRET:-key_pass_of_amlo}
      MASTER_KEY: ${MASTER_KEY:-your-master-key-for-supervisor-creation}
      SMTP_HOST: ${SMTP_HOST:-smtp.ethereal.email}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      NODE_ENV: production
      PORT: 8080
    volumes:
      - uploads:/app/uploads
      - backups:/app/backups
    ports:
      - '8080:8080'

  frontend:
    image: yourusername/amlo-frontend:latest # <-- pull from registry
    container_name: amlo-frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - '80:80'
      - '443:443'

volumes:
  postgres_data:
    name: amlo_postgres_data
  uploads:
    name: amlo_uploads
  backups:
    name: amlo_backups
```

---

### ขั้นตอนที่ 3: ส่งให้เครื่องปลายทาง (แค่ 2 ไฟล์)

**ไฟล์ที่ต้องส่ง:**

1. `docker-compose.prod.yml`
2. `.env` (ตั้งค่า environment ตามเครื่องนั้น)

**วิธีส่ง:**

```
scp docker-compose.prod.yml user@server-ip:~/
scp .env user@server-ip:~/
```

หรือ zip แล้วส่งให้เขาก็ได้

---

### ขั้นตอนที่ 4: รันบนเครื่องปลายทาง (เครื่องอื่น)

```bash
# login docker hub (ครั้งเดียว)
docker login

# docker compose จะ pull images อัตโนมัติ
docker-compose -f docker-compose.prod.yml up -d

# รัน migrate + seed (ครั้งแรกเท่านั้น)
docker exec -it amlo-backend sh -c "DATABASE_URL=postgresql://postgres:12345@postgres:5432/backend_amlo npx prisma migrate deploy"
docker exec -it amlo-backend sh -c "DATABASE_URL=postgresql://postgres:12345@postgres:5432/backend_amlo npx tsx prisma/seed.ts"
```

---

### สรุป: เครื่องปลายทางต้องการแค่

- ✅ Docker + Docker Compose
- ✅ `docker-compose.prod.yml` (ไฟล์เล็กกว่า 2KB)
- ✅ `.env` (ตั้งค่ารหัสผ่าน)
- ✅ Internet (เพื่อ pull images)

**ไม่ต้องมี source code, ไม่ต้องมี git, ไม่ต้องมี Node.js**

---

**อยากให้ช่วยสร้าง `docker-compose.prod.yml` + รัน push ให้ไหม?** toggle to Act mode ได้เลยครับ
