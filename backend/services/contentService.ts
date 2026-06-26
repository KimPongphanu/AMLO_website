// services/contentService.ts
import fs from 'fs/promises'
import DOMPurify from 'isomorphic-dompurify'
import path from 'path'
import prisma from '../lib/prisma'
import { AppError } from '../utils/AppError'
import { sanitizeText } from '../utils/sanitizer'

// ── News ──
export const createNews = async (data: {
  title: string
  description: string
  content?: string
  type?: string
  imagePath: string
}) => {
  const sanitizedContent = data.content ? DOMPurify.sanitize(data.content) : null
  return prisma.news.create({
    data: {
      type: data.type === 'PR' ? 'PR' : 'NEWS',
      title: sanitizeText(data.title),
      description: sanitizeText(data.description),
      content: sanitizedContent,
      image_src: data.imagePath,
    },
  })
}

export const getNews = async (page = 1, limit = 10, type?: string) => {
  const skip = (page - 1) * limit
  const whereCondition: any = { isShow: true }
  if (type === 'PR' || type === 'NEWS') whereCondition.type = type

  const [newsList, totalItems] = await prisma.$transaction([
    prisma.news.findMany({ where: whereCondition, orderBy: { date: 'desc' }, skip, take: limit }),
    prisma.news.count({ where: whereCondition }),
  ])
  return { newsList, totalItems, page, totalPages: Math.ceil(totalItems / limit) }
}

export const updateNews = async (id: number, data: any) => {
  const oldNews = await prisma.news.findUnique({ where: { id } })
  if (!oldNews) throw new AppError('ไม่พบข้อมูลที่ต้องการแก้ไข', 404)

  const sanitizedContent = data.content ? DOMPurify.sanitize(data.content) : null
  const updateData: any = {}

  if (data.title !== undefined) updateData.title = sanitizeText(data.title)
  if (data.description !== undefined) updateData.description = sanitizeText(data.description)
  if (data.content !== undefined) updateData.content = sanitizedContent
  if (data.isShow !== undefined) updateData.isShow = data.isShow === 'true' || data.isShow === true
  if (data.views !== undefined) updateData.views = parseInt(data.views)
  if (data.type !== undefined) updateData.type = data.type
  if (data.date !== undefined) updateData.date = new Date(data.date)

  return prisma.news.update({ where: { id }, data: updateData })
}

// ── Banners ──
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads')

function assertSafePath(filePath: string): void {
  const resolved = path.resolve(process.cwd(), filePath)
  if (!resolved.startsWith(UPLOADS_DIR)) throw new AppError('Invalid file path', 400)
}

export const createBanner = async (data: {
  title?: string
  link_url?: string
  imagePath: string
}) => {
  const maxOrder = await prisma.banners.aggregate({ _max: { order: true } })
  const nextOrder = (maxOrder._max.order ?? -1) + 1

  return prisma.banners.create({
    data: {
      image_url: data.imagePath,
      title: data.title ? sanitizeText(data.title) : '',
      link_url: data.link_url ? sanitizeText(data.link_url) : '',
      order: nextOrder,
    },
  })
}

export const getAllBanners = async (all = false) => {
  const where = all ? {} : { isShow: true }
  return prisma.banners.findMany({ where, orderBy: { order: 'asc' } })
}

export const updateBanner = async (id: number, data: { title?: string; link_url?: string }) => {
  const existing = await prisma.banners.findUnique({ where: { id } })
  if (!existing) throw new AppError('ไม่พบ Banner ที่ต้องการแก้ไข', 404)

  const updateData: any = {}
  if (data.title !== undefined) updateData.title = sanitizeText(data.title)
  if (data.link_url !== undefined) updateData.link_url = sanitizeText(data.link_url)

  return prisma.banners.update({ where: { id }, data: updateData })
}

export const toggleBannerVisibility = async (id: number) => {
  const existing = await prisma.banners.findUnique({ where: { id } })
  if (!existing) throw new AppError('ไม่พบ Banner ที่ต้องการแก้ไข', 404)
  return prisma.banners.update({ where: { id }, data: { isShow: !existing.isShow } })
}

export const deleteBanner = async (id: number) => {
  const banner = await prisma.banners.findUnique({ where: { id } })
  if (!banner) throw new AppError('ไม่พบ Banner ที่ต้องการลบ', 404)

  if (banner.image_url) {
    assertSafePath(banner.image_url)
    await fs.unlink(path.resolve(process.cwd(), banner.image_url)).catch(() => {})
  }

  return prisma.banners.delete({ where: { id } })
}

// ── Departments ──
export const createDepartment = async (data: {
  title: string
  content?: string
  coverImagePath: string
  galleryData: any[]
}) => {
  const sanitizedContent = data.content ? DOMPurify.sanitize(data.content) : null

  return prisma.department.create({
    data: {
      title: sanitizeText(data.title),
      content: sanitizedContent,
      cover_image: data.coverImagePath,
      GalleryItem: { create: data.galleryData },
    },
    include: { GalleryItem: true },
  })
}

export const getDepartments = async (page = 1, limit = 20, all = false) => {
  const skip = (page - 1) * limit
  const whereCondition = all ? {} : { isDelete: false }

  const [departments, total] = await Promise.all([
    prisma.department.findMany({
      where: whereCondition,
      include: { GalleryItem: { select: { id: true, type: true, url: true, departmentId: true } } },
      skip,
      take: limit,
    }),
    prisma.department.count({ where: whereCondition }),
  ])

  return { departments, total, page, totalPages: Math.ceil(total / limit) }
}

export const deleteDepartment = async (id: number) => {
  const targetDept = await prisma.department.findUnique({ where: { id } })
  if (!targetDept) throw new AppError('ไม่พบข้อมูลหน่วยงานที่ต้องการลบ', 404)

  return prisma.department.update({ where: { id }, data: { isDelete: true } })
}

// ── Contact ──
export const createContact = async (data: {
  first_name: string
  last_name: string
  email: string
  tel_number?: string
  preferred_contact: string
  message: string
}) => {
  return prisma.contact_requests.create({
    data: {
      first_name: sanitizeText(data.first_name),
      last_name: sanitizeText(data.last_name),
      email: data.email.trim().toLowerCase(),
      tel_number: data.tel_number ? String(data.tel_number).replace(/\s/g, '') : '',
      preferred_contact: sanitizeText(data.preferred_contact),
      message: sanitizeText(data.message),
      updated_at: new Date(),
    },
  })
}

export const getContactRequests = async () => {
  return prisma.contact_requests.findMany({ orderBy: { created_at: 'desc' } })
}

export const updateContactStatus = async (id: string, status: string) => {
  const oldRequest = await prisma.contact_requests.findUnique({ where: { id } })
  if (!oldRequest) throw new AppError('ไม่พบข้อมูลรายการติดต่อที่ต้องการอัปเดต', 404)

  return prisma.contact_requests.update({ where: { id }, data: { status } })
}

// ── Comments ──
export const createComment = async (star: number, msg: string) => {
  return prisma.comment_items.create({
    data: { star, msg: sanitizeText(msg), isShow: star >= 4, updatedAt: new Date() },
  })
}

export const getComments = async (page = 1, limit = 10, all = false) => {
  const skip = (page - 1) * limit
  const whereCondition: any = all ? {} : { isShow: true }

  const [comments, total] = await Promise.all([
    prisma.comment_items.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.comment_items.count({ where: whereCondition }),
  ])

  return { comments, total, page, totalPages: Math.ceil(total / limit) }
}

export const updateComment = async (id: string, isShow: boolean) => {
  return prisma.comment_items.update({ where: { id }, data: { isShow: !!isShow } })
}

// ── Settings ──
export const getAllSettings = async () => {
  const settings = await prisma.site_settings.findMany()
  const map: Record<string, string> = {}
  settings.forEach((s: any) => {
    map[s.key] = s.value
  })
  return map
}

export const updateSettings = async (settings: { key: string; value: string }[]) => {
  await prisma.$transaction(
    settings.map((item) =>
      prisma.site_settings.upsert({
        where: { key: item.key },
        update: { value: sanitizeText(item.value) },
        create: { key: sanitizeText(item.key), value: sanitizeText(item.value) },
      }),
    ),
  )
  return getAllSettings()
}

// ── Slider ──
export const getSlides = async () => {
  return prisma.slider_images.findMany({ orderBy: { order: 'asc' } })
}

// ── Splash Popups ──
export const getActivePopup = async () => {
  return prisma.splash_popups.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })
}

export const getAllPopups = async () => {
  return prisma.splash_popups.findMany({ orderBy: { createdAt: 'desc' } })
}

export const createPopup = async (imageUrl: string, title: string) => {
  return prisma.splash_popups.create({
    data: { image_url: imageUrl, title: sanitizeText(title) },
  })
}

export const updatePopup = async (id: number, data: { title?: string; isActive?: boolean }) => {
  const existing = await prisma.splash_popups.findUnique({ where: { id } })
  if (!existing) throw new AppError('ไม่พบ Popup', 404)

  const updateData: any = {}
  if (data.title !== undefined) updateData.title = sanitizeText(data.title)
  if (data.isActive !== undefined) {
    if (data.isActive)
      await prisma.splash_popups.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      })
    updateData.isActive = data.isActive
  }

  return prisma.splash_popups.update({ where: { id }, data: updateData })
}

export const deletePopup = async (id: number) => {
  const popup = await prisma.splash_popups.findUnique({ where: { id } })
  if (!popup) throw new AppError('ไม่พบ Popup', 404)

  if (popup.image_url) {
    assertSafePath(popup.image_url)
    await fs.unlink(path.resolve(process.cwd(), popup.image_url)).catch(() => {})
  }

  return prisma.splash_popups.delete({ where: { id } })
}
