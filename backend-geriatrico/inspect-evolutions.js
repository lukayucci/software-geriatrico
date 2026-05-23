const mongoose = require('mongoose');
const uri = 'mongodb+srv://drzero:zeroadmin123@cluster0.pfkadfh.mongodb.net/?appName=Cluster0';

const residenteSchema = new mongoose.Schema({
  evoluciones: [{ fecha: Date, autor: String, categoria: String, nota: String }]
});
const Residente = mongoose.model('Residente', residenteSchema);

mongoose.connect(uri)
  .then(async () => {
    const doc = await Residente.findOne({ 'evoluciones.0': { $exists: true } }).lean();
    console.log(JSON.stringify(doc?.evoluciones?.slice(-20), null, 2));
    await mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
