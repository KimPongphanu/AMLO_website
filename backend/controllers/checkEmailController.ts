// controllers/checkEmailController.ts
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import prisma from '../lib/prisma'
import { apiLimiter } from '../middlewares/rateLimiter' // Reuse general API rate limiter

interface CheckEmailBody {
  email: string
}

export const checkEmail = [
  // Apply rate limiting specifically for this endpoint
  apiLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as CheckEmailBody

    if (!email || !email.trim()) {
      res.status(400).json({ message: 'Email is required' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { role: true },
    })

    // Always return the same response structure to prevent user enumeration
    // Attacker cannot distinguish between "email exists" and "email doesn't exist"
    res.status(200).json({
      success: true,
      data: {
        found: !!user,
        // Only include role if user was found (for legitimate use cases)
        ...(user ? { role: user.role } : {}),
      },
    })
  }),
]
