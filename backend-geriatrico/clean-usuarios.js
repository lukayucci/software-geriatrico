const mongoose = require('mongoose');
const uri = 'mongodb+srv://drzero:zeroadmin123@cluster0.pfkadfh.mongodb.net/?appName=Cluster0';

const usuarioSchema = new mongoose.Schema({
    nombre: {type: String, required: true},
    user: {type: String, required: true, unique: true},
    rol: {type: String, enum: ['lic-kinesiologia', 'lic-terapia-ocupacional', 'lic-psicologia', 'lic-trabajo-social', 'ed-fisica', 'dra-clinica', 'lic-enfermeria', 'dra-gerontologa', 'enfermero-profesional', 'medico', 'admin'], default: 'lic-enfermeria', required: true},
    password: {type: String, required: true}
});
const Usuario = mongoose.model('Usuario', usuarioSchema);

mongoose.connect(uri)
  .then(async () => {
    console.log('Conectado a BD');
    
    // Elimina TODOS los usuarios
    const resultado = await Usuario.deleteMany({});
    console.log('Usuarios eliminados:', resultado.deletedCount);
    
    // Dropea la colección y sus índices
    try {
      await Usuario.collection.drop();
      console.log('Colección de usuarios eliminada completamente');
    } catch (err) {
      console.log('No había colección que dropear');
    }
    
    // Crea el nuevo admin
    await Usuario.create({
        nombre: 'Daniela Yucci',
        user: 'admin',
        rol: 'admin',
        password: 'admin123'
    });
    console.log('Admin recreado correctamente');
    
    await mongoose.disconnect();
    console.log('Desconectado de BD');
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
