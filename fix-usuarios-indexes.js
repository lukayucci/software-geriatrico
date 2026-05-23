const mongoose = require('mongoose');
const uri = 'mongodb+srv://drzero:zeroadmin123@cluster0.pfkadfh.mongodb.net/?appName=Cluster0';

mongoose.connect(uri)
  .then(async () => {
    console.log('Conectado a BD');
    
    try {
      // Obtener la colección de usuarios
      const db = mongoose.connection.getClient().db();
      const collection = db.collection('usuarios');
      
      // Eliminar todos los índices excepto el _id
      const indexes = await collection.listIndexes().toArray();
      for (const index of indexes) {
        if (index.name !== '_id_') {
          await collection.dropIndex(index.name);
          console.log('Índice eliminado:', index.name);
        }
      }
      
      // Eliminar todos los documentos
      await collection.deleteMany({});
      console.log('Documentos eliminados');
      
    } catch (err) {
      console.log('Error:', err.message);
    }
    
    // Ahora reconectamos con el nuevo schema
    const usuarioSchema = new mongoose.Schema({
        nombre: {type: String, required: true},
        user: {type: String, required: true, unique: true},
        rol: {type: String, enum: ['lic-kinesiologia', 'lic-terapia-ocupacional', 'lic-psicologia', 'lic-trabajo-social', 'ed-fisica', 'dra-clinica', 'lic-enfermeria', 'dra-gerontologa', 'enfermero-profesional', 'medico', 'admin'], default: 'lic-enfermeria', required: true},
        password: {type: String, required: true}
    });
    const Usuario = mongoose.model('Usuario', usuarioSchema);
    
    // Crear el admin
    await Usuario.create({
        nombre: 'Daniela Yucci',
        user: 'admin',
        rol: 'admin',
        password: 'admin123'
    });
    console.log('Admin recreado correctamente');
    
    await mongoose.disconnect();
    console.log('Desconectado');
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
