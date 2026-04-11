// src/controllers/auth.controller.js
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma.js'

export async function register(req, res) {
  const { email, password } = req.body

  const hashed = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { email, password: hashed }
  })

  res.json(user)
}

export async function login(req, res) {
  const { email, password } = req.body

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(404).json({ error: 'User not found' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET)

  res.json({ token })
}