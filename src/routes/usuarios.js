import { createUsuario, loginUsuario, getUsuarioInfoById } from '../servicios/usuarios.js'

export function usuarioRoutes(app) {

  app.post('/api/v1/usuario/signup', async (req, res) => {
    try {
      const usuario = await createUsuario(req.body)
      return res.status(201).json({ username: usuario.username })
    } catch (err) {
      console.log("ERROR SIGNUP:", err.message)
      return res.status(400).json({
        error: err.message,
      })
    }
  })

  app.post('/api/v1/usuario/login', async (req, res) => {
    try {
      const token = await loginUsuario(req.body)
      return res.status(200).send({ token })
    } catch (err) {
      console.log("ERROR LOGIN:", err.message)
      return res.status(400).send({
        error: err.message,
      })
    }
  })

  app.get('/api/v1/usuarios/:id', async (req, res) => {
    const userInfo = await getUsuarioInfoById(req.params.id)
    return res.status(200).send(userInfo)
  })
}