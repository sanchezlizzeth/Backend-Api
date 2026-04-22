import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { Usuario } from '../models/Usuario.js'

export async function createUsuario({ username, password }) {
  const hashedPassword = await bcrypt.hash(password, 10)
  const usuario = new Usuario({ username, password: hashedPassword })
  return await usuario.save()
}

export async function loginUsuario({ username, password }) {
  const usuario = await Usuario.findOne({ username })
  if (!usuario) {
    throw new Error('Nombre de Usuario Incorrecto!')
  }
  const isPasswordCorrect = await bcrypt.compare(password, usuario.password)
  if (!isPasswordCorrect) {
    throw new Error('Contraseña invalida!')
  }
  const token = jwt.sign({ sub: usuario._id }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  })
  return token
}

export async function getUsuarioInfoById(userId) {
  try {
    const usuario = await Usuario.findById(userId)
    if (!usuario) return { username: userId }
    return { username: usuario.username }
  } catch (err) {
    return { username: userId }
  }
}