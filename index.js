const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://drzero:zeroadmin123@cluster0.pfkadfh.mongodb.net/?appName=Cluster0';

// esquema de datos para los residentes
const residenteSchema = new mongoose.Schema({
    nombre: String,
    apellido: String,
    nacionalidad: String,
    nacimiento: Date,
    dni: Number,
    edad: Number,
    habitacion: Number,
    medicacion: String,
    factoresRiesgo: [String],
    obraSocial: String,
    fechaIngreso: Date,
    estado: String,
    telEmergencia: String,
    numAfiliado: Number,
    medicoCabecera: String,
    hospitalCapitado: String,
    primerApoderado: String,
    telApoderado: String,
    direccionPrimerApoderado: String,
    segundoApoderado: String,
    telSegundoApoderado: String,
    direccionSegundoApoderado: String,
    tercerApoderado: String,
    telTercerApoderado: String,
    direccionTercerApoderado: String,
    antecedentes: String,

    evoluciones: [{
        fecha: {type: Date, default: Date.now },
        autor: String,
        categoria: String,
        nota: String
    }]
});

const Residente = mongoose.model('Residente', residenteSchema);

// esquema de datos para los usuarios (personal del geriátrico)
const usuarioSchema = new mongoose.Schema({
    nombre: {type: String, required: true},
    user: {type: String, required: true, unique: true},
    rol: {type: String, enum: ['medico', 'asistente', 'admin'], default: 'asistente', required: true},
    password: {type: String, required: true}
});

const Usuario = mongoose.model('Usuario', usuarioSchema);

// conexión a la base de datos y creación del primer admin
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('conectado a la base de datos');
        
        // chequeamos si existe el admin. si no existe, lo creamos para que no te quedes bloqueado
        const adminExiste = await Usuario.findOne({ user: 'admin' });
        if (!adminExiste) {
            await Usuario.create({
                nombre: 'Daniela Yucci',
                user: 'admin',
                rol: 'admin',
                password: 'admin123'
            });
            console.log('usuario admin por defecto creado');
        }

        // compatibilidad: convertimos roles antiguos de enfermera a asistente
        await Usuario.updateMany({ rol: 'enfermera' }, { rol: 'asistente' });
        console.log('roles antiguos actualizados a asistente');

        // compatibilidad: renombramos categorías mal escritas en notas existentes
        const residentesConCategroia = await Residente.find({ 'evoluciones.categroia': { $exists: true } });
        for (const res of residentesConCategroia) {
            let actualizado = false;
            res.evoluciones = res.evoluciones.map(evo => {
                if (evo.categroia) {
                    actualizado = true;
                    const nuevoEvo = evo.toObject ? evo.toObject() : { ...evo };
                    nuevoEvo.categoria = nuevoEvo.categroia;
                    delete nuevoEvo.categroia;
                    return nuevoEvo;
                }
                return evo;
            });
            if (actualizado) {
                await res.save();
            }
        }
        if (residentesConCategroia.length) {
            console.log('notas antiguas corregidas: ', residentesConCategroia.length);
        }
    })
    .catch(err => console.error('error al conectar a la base de datos', err));

const app = express();
app.use(cors());
app.use(express.json());

// clave secreta para los tokens (idealmente moverla al archivo .env)
const SECRET_KEY = process.env.SECRET_KEY || 'mi_super_secreto_de_32_caracteres';

// middleware: barrera de seguridad para chequear que el token sea válido
const verificarToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(401).json({ message: 'token no provisto' });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.usuarioLogueado = decoded;
        next();
    } catch (error) {
        res.status(403).json({ message: 'token expirado o invalido' });
    }
};

// PONER ESTA RUTA BIEN ARRIBA, DEBAJO DE LOS MIDDLEWARES
app.post('/api/test-ruta', (req, res) => {
    console.log("¡TEST EXITOSO!");
    res.send("El servidor recibe señales");
});

// --- RUTAS DE RESIDENTES ---

// obtener todos los residentes
app.get('/api/residentes', verificarToken, async (req, res) => {
    try {
        const listaResidentes = await Residente.find();
        res.json(listaResidentes);
    } catch (error) {
        res.status(500).json({ message: "error al obtener residentes" });
    }
});

//acá va la ruta para agregar evoluciones a la ficha de un residente, que solo el médico puede hacer
app.post('/api/residentes/:id/evoluciones', verificarToken, async (req, res) => {
    if (req.usuarioLogueado.rol !== 'medico' && req.usuarioLogueado.rol !== 'admin') {
        return res.status(403).json({ message: 'no tenés permiso' });
    }

    try {
        const residente = await Residente.findById(req.params.id);
        if (!residente) return res.status(404).json({ message: 'residente no encontrado' });

        const categoriaRecibida = String(req.body.categoria || '').toLowerCase().trim();
        const categoriaNormalizada = categoriaRecibida === 'incidente'
            ? 'incidente'
            : categoriaRecibida === 'medicación' || categoriaRecibida === 'medicacion'
                ? 'medicacion'
                : 'rutina';

        const nuevaEvolucion = {
            fecha: new Date(),
            autor: req.usuarioLogueado.nombre,
            categoria: categoriaNormalizada,
            nota: req.body.nota
        };

        residente.evoluciones.push(nuevaEvolucion);
        await residente.save();

        res.status(201).json({ message: 'evolución agregada', residente });
    } catch (error) {
        res.status(500).json({ message: 'error al agregar evolución' });
    }
});

// agregar un nuevo residente (solo admin/medico)
app.post('/api/residentes', verificarToken, async (req, res) => {
    if (req.usuarioLogueado.rol !== 'medico' && req.usuarioLogueado.rol !== 'admin') {
        return res.status(403).json({ message: 'no tenés permiso' });
    }

    try {
        const nuevoResidente = new Residente(req.body); 
        await nuevoResidente.save();
        res.status(201).json({ message: 'residente guardado en bd', nuevoResidente });
    } catch (error) {
        res.status(400).json({ message: "error al guardar el residente" });
    }
});

// modificar la ficha de un residente
app.put('/api/residentes/:id', verificarToken, async (req, res) => {
    const { id } = req.params;

    if (req.usuarioLogueado.rol !== 'medico' && req.usuarioLogueado.rol !== 'admin') {
        return res.status(403).json({ message: 'no tenés permiso' });
    }

    try {
        const residenteActualizado = await Residente.findByIdAndUpdate(id, req.body, { new: true });
        res.json({ message: 'ficha actualizada', residente: residenteActualizado });
    } catch (error) {
        res.status(500).json({ message: 'error al actualizar' });
    }
});

// eliminar un residente
app.delete('/api/residentes/:id', verificarToken, async (req, res) => {
    const { id } = req.params;

    if (req.usuarioLogueado.rol !== 'medico' && req.usuarioLogueado.rol !== 'admin') {
        return res.status(403).json({ message: 'solo el médico puede borrar' });
    }

    try {
        const eliminado = await Residente.findByIdAndDelete(id);
        if (!eliminado) return res.status(404).json({ message: 'no encontrado' });
        res.json({ message: 'residente eliminado de la base de datos' });
    } catch (error) {
        res.status(500).json({ message: 'error al eliminar' });
    }
});

// --- RUTAS DE USUARIOS (GESTIÓN DE PERSONAL) ---

// paso 2: ver todos los usuarios registrados (solo para el panel del admin)
app.get('/api/usuarios', verificarToken, async (req, res) => {
    if (req.usuarioLogueado.rol !== 'medico' && req.usuarioLogueado.rol !== 'admin') {
        return res.status(403).json({ message: 'no tenés permiso' });
    }

    try {
        // usamos select('-password') para que no enviemos las contraseñas al frontend por seguridad
        const listaUsuarios = await Usuario.find().select('-password');
        res.json(listaUsuarios);
    } catch (error) {
        res.status(500).json({ message: 'error al obtener la lista de usuarios' });
    }
});

// agregar un usuario nuevo al sistema
app.post('/api/usuarios', verificarToken, async (req, res) => {
    if (req.usuarioLogueado.rol !== 'medico' && req.usuarioLogueado.rol !== 'admin') {
        return res.status(403).json({ message: 'no tenés permiso' });
    }

    try {
        console.log('POST /api/usuarios body:', req.body);
        const datosUsuario = {
            ...req.body,
            rol: req.body.rol === 'administrativo' ? 'admin' :
                 req.body.rol === 'enfermera' ? 'asistente' :
                 req.body.rol
        };
        console.log('datosUsuario para guardar:', datosUsuario);

        const nuevoUsuario = new Usuario(datosUsuario);
        await nuevoUsuario.save();
        res.status(201).json({ message: 'usuario creado', usuario: nuevoUsuario });
    } catch (error) {
        console.error('Error creando usuario:', error);
        const debug = {
            requestBody: req.body,
            datosUsuario,
            errorName: error.name,
            errorMessage: error.message,
            errorCode: error.code,
            errorKeyValue: error.keyValue
        };
        if (error.code === 11000) {
            return res.status(400).json({ message: 'ese usuario ya existe', debug });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message, debug });
        }
        return res.status(500).json({ message: error.message || 'error del servidor al crear usuario', debug });
    }
});

// eliminar a un usuario/enfermero que ya no trabaje en el geriátrico
app.delete('/api/usuarios/:id', verificarToken, async (req, res) => {
    if (req.usuarioLogueado.rol !== 'medico' && req.usuarioLogueado.rol !== 'admin') {
        return res.status(403).json({ message: 'no tenés permiso' });
    }

    try {
        const eliminado = await Usuario.findByIdAndDelete(req.params.id);
        if (!eliminado) return res.status(404).json({ message: 'usuario no encontrado' });
        res.json({ message: 'usuario eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'error al eliminar usuario' });
    }
});

// --- RUTA DE AUTENTICACIÓN ---

app.get('/', (req, res) => {
    res.send('el servidor está vivo');
});

// login buscando en la base de datos real (reemplazamos el array hardcodeado)
app.post('/api/login', async (req, res) => {
    console.log('datos recibidos en backend:', req.body);
    const { nombre, user, password, pass } = req.body;
    const loginId = user || nombre;
    const loginPassword = password || pass;

    try {
        // busca al usuario en mongodb usando el campo "user" O "nombre"
        const usuarioEncontrado = await Usuario.findOne({ 
            $or: [{ user: loginId }, { nombre: loginId }]
        });
        console.log('usuario encontrado en bd:', usuarioEncontrado ? 'sí' : 'no');

        if (!usuarioEncontrado || usuarioEncontrado.password !== loginPassword) {
            return res.status(401).json({ message: 'usuario o contraseña incorrectos' });
        }

        const rolFinal = usuarioEncontrado.rol === 'enfermera' ? 'asistente' : usuarioEncontrado.rol;

        // generar el token si todo está bien
        const token = jwt.sign({
            id: usuarioEncontrado._id,
            rol: rolFinal,
            nombre: usuarioEncontrado.nombre
        }, 
        SECRET_KEY, 
        { expiresIn: '8h' }); // 8h para que el personal no tenga que loguearse a cada rato en su turno

        res.json({
            message: 'login exitoso', 
            token, 
            rol: rolFinal
        });
    } catch (error) {
        res.status(500).json({ message: 'error en el servidor al intentar iniciar sesión' });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`servidor corriendo en el puerto ${PORT}`));