import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import { filterXSS } from "xss";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import pagosRoutes from "./routes/pagosRoutes.js";
import reservationsRoutes from "./routes/reservations.routes.js";
import User from "./models/User.js";
import progresoRoutes from "./routes/progresoRoutes.js";
import streakRoutes from "./routes/streakRoutes.js";
import beneficioRoutes from "./routes/beneficio.routes.js";
import { usuarioRoutes } from "./routes/usuarios.js";

dotenv.config();
connectDB();

const app = express();

app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

usuarioRoutes(app);
app.use("/api/users", userRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/progreso", progresoRoutes);
app.use("/api/streak", streakRoutes);
app.use(beneficioRoutes);
app.use("/api/reservations", reservationsRoutes);

app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});

const comentariosLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiadas peticiones desde esta IP. Espera 1 minuto.",
  },
});

const validarComentario = [
  body("texto")
    .notEmpty().withMessage("El texto no puede estar vacio.")
    .isLength({ max: 200 }).withMessage("El texto no puede superar los 200 caracteres."),
  body("puntuacion")
    .notEmpty().withMessage("La puntuacion es requerida.")
    .isInt({ min: 1, max: 5 }).withMessage("La puntuacion debe ser un entero entre 1 y 5."),
];

app.post(
  "/api/v1/comentarios",
  comentariosLimiter,
  validarComentario,
  (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({ errores: errores.array() });
    }

    const { texto, puntuacion } = req.body;

    const textoSeguro = filterXSS(texto.trim());

    return res.status(200).json({
      ok: true,
      comentario: textoSeguro,
      puntuacion: parseInt(puntuacion),
      fecha: new Date().toISOString(),
    });
  }
);

app.post("/comentarios", (req, res) => {
  const { texto } = req.body;
  if (!texto || texto.trim() === "") {
    return res.status(400).json({ error: "El comentario no puede estar vacio." });
  }
  return res.status(200).json({
    ok: true,
    comentario: texto.trim(),
    fecha: new Date().toISOString(),
  });
});

const crearAdminPorDefecto = async () => {
  try {
    const adminEmail = "admin@zonegym.com";
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("Admin123*", 10);
      await User.create({
        name: "Administrador ZoneGym",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
        isActive: true,
        membershipStatus: "active",
      });
      console.log("Admin por defecto creado");
    } else {
      console.log("Admin ya existe");
    }
  } catch (error) {
    console.error("Error creando admin:", error);
  }
};

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  await crearAdminPorDefecto();
});