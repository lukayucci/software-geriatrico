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
    
    // Elimina el admin existente para que se recree
    const resultado = await Usuario.deleteOne({ user: 'admin' });
    console.log('Admin anterior eliminado:', resultado.deletedCount > 0 ? 'sí' : 'no existía');
    
    // Crea el nuevo admin con los valores del index.js
    await Usuario.create({
        nombre: 'Daniela Yucci',
        user: 'admin',
        rol: 'admin',
        password: 'admin123'
    });
    console.log('Admin recreado con:');
    console.log('  user: admin');
    console.log('  password: admin123');
    
    await mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
