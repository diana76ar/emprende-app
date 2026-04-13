// src/controllers/auth.controller.js
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma.js'

export async function register(req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contrasena son obligatorios' })
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { email, password: hashed },
      select: { id: true, email: true, plan: true, createdAt: true }
    })

    res.status(201).json(user)
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'El email ya esta registrado' })
    }

    console.error('Error en register:', error)
    res.status(500).json({ error: 'No se pudo registrar el usuario' })
  }
}

export async function login(req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contrasena son obligatorios' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Credenciales invalidas' })

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET)

    res.json({ token })
  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({ error: 'No se pudo iniciar sesion' })
  }
}