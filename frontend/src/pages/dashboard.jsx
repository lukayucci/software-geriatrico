import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from "jspdf";

function Dashboard() {
  const [nuevoResidente, setNuevoResidente] = useState({
    nombre: '', apellido: '', nacionalidad: '', nacimiento: '', dni: '', 
    habitacion: '', estado: 'Estable', edad: '', medicacion: '', 
    factoresRiesgo: '', obraSocial: '', fechaIngreso: '', 
    numAfiliado: '', telEmergencia: '', hospitalCapitado: '', 
    medicoCabecera: '', primerApoderado: '', telApoderado: '', 
    direccionPrimerApoderado: '', segundoApoderado: '', 
    telSegundoApoderado: '', direccionSegundoApoderado: '', 
    tercerApoderado: '', telTercerApoderado: '', 
    direccionTercerApoderado: '', antecedentes: ''
  });
  
  const [residentes, setResidentes] = useState([]);
  const [residenteEnEdicion, setResidenteEnEdicion] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', user: '', rol: 'asistente', password: '' });
  const [mostrarLista, setMostrarLista] = useState(true);
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false);
  const [residenteHistorial, setResidenteHistorial] = useState(null); // abre el modal del lápiz para agregar la nota
  const [nuevaNota, setNuevaNota] = useState({ categoria: 'rutina', nota: '' });
  
  const navigate = useNavigate();
  const rol = localStorage.getItem('rol');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    const traerDatos = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/residentes', {
          headers: { 'authorization': token }
        });
        setResidentes(res.data);
      } catch (err) {
        console.error("Error al pedir los residentes");
      }
    };
    traerDatos();
  }, [token, navigate]);

  const cerrarSesion = () => {
    localStorage.clear();
    navigate('/');
  };

  const toggleLista = () => {
    setMostrarLista(!mostrarLista);
  };

  const toggleUsuarios = () => {
    const nuevoEstado = !mostrarUsuarios;
    setMostrarUsuarios(nuevoEstado);
    if (nuevoEstado && !usuarios.length) {
      traerUsuarios();
    }
  };

  const manejarAgregar = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/residentes', nuevoResidente, {
        headers: { 'authorization': token }
      });

      if (res.data.nuevoResidente) {
        setNuevoResidente({
          nombre: '', apellido: '', nacionalidad: '', nacimiento: '', dni: '', 
          habitacion: '', estado: 'Estable', edad: '', medicacion: '', 
          factoresRiesgo: '', obraSocial: '', fechaIngreso: '', 
          numAfiliado: '', telEmergencia: '', hospitalCapitado: '', 
          medicoCabecera: '', primerApoderado: '', telApoderado: '', 
          direccionPrimerApoderado: '', segundoApoderado: '', 
          telSegundoApoderado: '', direccionSegundoApoderado: '', 
          tercerApoderado: '', telTercerApoderado: '', 
          direccionTercerApoderado: '', antecedentes: ''
        });
        setResidentes(prev => [...prev, res.data.nuevoResidente]);
        alert('Residente agregado correctamente.');
      }
    } catch (err) {
      console.error("Error al agregar residente:", err);
      alert('Error al agregar residente');
    }
  };

  const eliminarResidente = async (id) => {
    if (window.confirm('¿Estás seguro que quieres eliminar este residente?')) {
      try {
        await axios.delete(`http://localhost:5000/api/residentes/${id}`, {
          headers: { 'authorization': token }
        });
        setResidentes(prev => prev.filter(r => r._id !== id));
        alert('Residente eliminado con éxito');
      } catch (err) {
        console.error('Error al eliminar:', err);
        alert('No se pudo eliminar el residente.');
      }
    }
  };

  // Traer la lista de usuarios (solo si es médico/admin)
const traerUsuarios = async () => {
    try {
        const res = await axios.get('http://localhost:5000/api/usuarios', {
            headers: { 'authorization': token }
        });
        setUsuarios(res.data);
    } catch (err) {
        console.error("Error al traer usuarios", err);
    }
};

// Crear usuario nuevo
  const manejarAgregarUsuario = async (e) => {
      e.preventDefault();
      try {
          await axios.post('http://localhost:5000/api/usuarios', nuevoUsuario, {
              headers: { 'authorization': token }
          });
          alert("Usuario creado con éxito");
          setNuevoUsuario({ nombre: '', user: '', password: '', rol: 'asistente' });
          traerUsuarios(); // Refrescamos la lista
      } catch (err) {
          console.error('Error al crear usuario:', err.response?.data || err.message || err);
          alert(err.response?.data?.message || "Error al crear usuario");
      }
  };

  // Eliminar usuario
  const eliminarUsuario = async (id) => {
      if (window.confirm("¿Seguro que quieres eliminar a este usuario?")) {
          try {
              await axios.delete(`http://localhost:5000/api/usuarios/${id}`, {
                  headers: { 'authorization': token }
              });
              traerUsuarios();
          } catch (err) {
              alert("No se pudo eliminar");
          }
      }
  };

  const guardarEvolucion = async (e) => {
    e.preventDefault();
    if (!nuevaNota.nota.trim()) return alert("La nota no puede estar vacía");

    try {
      const res = await axios.post(
        `http://localhost:5000/api/residentes/${residenteHistorial._id}/evoluciones`, nuevaNota, { headers: { 'authorization': token } }
      );

      setResidentes(prev => prev.map(r => r._id === residenteHistorial._id ? res.data.residente : r));
      setResidenteHistorial(res.data.residente);
      setNuevaNota({ categoria: 'rutina', nota: '' });

    } catch (err) {
      alert("Error al guardar evolución: " + (err.response?.data?.message || "Error desconocido"));
    }
  }

  const guardarCambios = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `http://localhost:5000/api/residentes/${residenteEnEdicion._id}`, 
        residenteEnEdicion, 
        { headers: { 'authorization': token } }
      );
      setResidentes(prev => prev.map(r => 
        r._id === residenteEnEdicion._id ? { ...r, ...residenteEnEdicion } : r
      ));
      alert("Ficha actualizada con éxito");
      setResidenteEnEdicion(null);
    } catch (err) {
      alert("Hubo un problema: " + (err.response?.data?.message || "Error desconocido"));
    }
  };

  // Clases CSS reutilizables de Tailwind
  const inputClass = "w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all";
  const labelClass = "block text-sm font-semibold text-slate-600 mb-1";
  const sectionTitleClass = "col-span-full text-lg font-bold text-slate-800 border-b-2 border-emerald-500 pb-2 mb-4 mt-6 first:mt-0";

  const residentesFiltrados = residentes.filter(r => {
    const nombre = r.nombre?.toLowerCase() || '';
    const apellido = r.apellido?.toLowerCase() || '';
    const dni = r.dni?.toString() || '';
    const busquedaLower = busqueda.toLowerCase();
    return nombre.includes(busquedaLower) || apellido.includes(busquedaLower) || dni.includes(busquedaLower);
  }
  );

    const descargarFichaPDF = (res) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // --- ENCABEZADO ---
    doc.setFillColor(30, 41, 59); // Color Slate-800 (como tu panel)
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("FICHA MÉDICA DE EMERGENCIA", 20, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-AR')} a las ${new Date().toLocaleTimeString('es-AR')} hs`, 20, 32);

    // --- SECCIÓN 1: DATOS PERSONALES ---
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("1. IDENTIDAD Y DEMOGRAFÍA", 20, 55);
    doc.line(20, 57, pageWidth - 20, 57); // Línea divisoria

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Nombre Completo:", 20, 65);
    doc.setFont("helvetica", "normal");
    doc.text(`${res.nombre} ${res.apellido}`, 60, 65);

    doc.setFont("helvetica", "bold");
    doc.text("DNI:", 20, 72);
    doc.setFont("helvetica", "normal");
    doc.text(`${res.dni || 'N/C'}`, 60, 72);

    doc.setFont("helvetica", "bold");
    doc.text("Habitación:", 120, 72);
    doc.setFont("helvetica", "normal");
    doc.text(`${res.habitacion || 'N/A'}`, 150, 72);

    doc.setFont("helvetica", "bold");
    doc.text("Edad:", 20, 79);
    doc.setFont("helvetica", "normal");
    doc.text(`${res.edad || 'N/C'} años`, 60, 79);

    // --- SECCIÓN 2: SALUD Y COBERTURA ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("2. SALUD Y COBERTURA", 20, 95);
    doc.line(20, 97, pageWidth - 20, 97);

    doc.setFontSize(11);
    doc.text("Estado Actual:", 20, 105);
    doc.setTextColor(res.estado === 'Crítico' ? 220 : 0, 0, 0); // Rojo si es crítico
    doc.text(`${res.estado?.toUpperCase()}`, 60, 105);
    doc.setTextColor(30, 41, 59);

    doc.setFont("helvetica", "bold");
    doc.text("Obra Social:", 20, 112);
    doc.setFont("helvetica", "normal");
    doc.text(`${res.obraSocial || 'N/C'} (N° Afiliado: ${res.numAfiliado || '-'})`, 60, 112);

    doc.setFont("helvetica", "bold");
    doc.text("Medicación:", 20, 122);
    doc.setFont("helvetica", "normal");
    const medicacion = doc.splitTextToSize(res.medicacion || "Sin medicación registrada", pageWidth - 80);
    doc.text(medicacion, 60, 122);

    doc.setFont("helvetica", "bold");
    doc.text("Antecedentes:", 20, 140);
    doc.setFont("helvetica", "normal");
    const antecedentes = doc.splitTextToSize(res.antecedentes || "Sin antecedentes registrados", pageWidth - 80);
    doc.text(antecedentes, 60, 140);

    // --- SECCIÓN 3: CONTACTOS DE EMERGENCIA ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("3. CONTACTOS Y APODERADOS", 20, 170);
    doc.line(20, 172, pageWidth - 20, 172);

    doc.setFontSize(11);
    doc.text("Tel. Emergencia:", 20, 180);
    doc.text(`${res.telEmergencia || 'N/C'}`, 60, 180);

    // Apoderado 1 (si existe)
    if (res.apoderado1Nombre) {
      doc.setFont("helvetica", "bold");
      doc.text("Apoderado:", 20, 190);
      doc.setFont("helvetica", "normal");
      doc.text(`${res.apoderado1Nombre} - Tel: ${res.apoderado1Tel}`, 60, 190);
    }

    // --- PIE DE PÁGINA ---
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Este documento es confidencial y para uso médico exclusivo.", pageWidth / 2, 280, { align: "center" });
    doc.text("Sistema Gerátrico Digital - Generado por el Médico a Cargo", pageWidth / 2, 285, { align: "center" });

    // DESCARGAR
    doc.save(`FICHA_EMERGENCIA_${res.apellido.toUpperCase()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans text-slate-800">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm mb-8 border border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Panel Geriátrico</h1>
          <p className="text-emerald-600 font-medium mt-1">Conectado como: <span className="uppercase">{rol}</span></p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0">
          {(rol === 'medico' || rol === 'admin') && (
            <>
              <button 
                onClick={toggleLista}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all font-medium flex items-center gap-2"
              >
                📋 Lista de Residentes
              </button>
              <button 
                onClick={toggleUsuarios}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all font-medium flex items-center gap-2"
              >
                👥 Gestión de Personal
              </button>
            </>
          )}
          <button 
            onClick={cerrarSesion} 
            className="px-6 py-2 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-colors border border-red-200"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* FORMULARIO DE INGRESO (SOLO MÉDICO/ADMIN - SIEMPRE VISIBLE) */}
      {(rol === 'medico' || rol === 'admin') && (
        <div className="bg-white p-8 mb-8 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-2xl font-bold mb-6 text-slate-900">Registrar Nuevo Ingreso</h3>
          
          <form onSubmit={manejarAgregar} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            
            {/* SECCIÓN 1: IDENTIDAD */}
            <h4 className={sectionTitleClass}>Identidad y Demografía</h4>
            
            <div><label className={labelClass}>Nombre</label><input className={inputClass} value={nuevoResidente.nombre} onChange={(e) => setNuevoResidente({...nuevoResidente, nombre: e.target.value})} required /></div>
            <div><label className={labelClass}>Apellido</label><input className={inputClass} value={nuevoResidente.apellido} onChange={(e) => setNuevoResidente({...nuevoResidente, apellido: e.target.value})} required /></div>
            <div><label className={labelClass}>DNI</label><input type="number" className={inputClass} value={nuevoResidente.dni} onChange={(e) => setNuevoResidente({...nuevoResidente, dni: e.target.value})} /></div>
            <div><label className={labelClass}>Edad</label><input type="number" className={inputClass} value={nuevoResidente.edad} onChange={(e) => setNuevoResidente({...nuevoResidente, edad: e.target.value})} /></div>
            <div><label className={labelClass}>Nacionalidad</label><input className={inputClass} value={nuevoResidente.nacionalidad} onChange={(e) => setNuevoResidente({...nuevoResidente, nacionalidad: e.target.value})} /></div>
            <div><label className={labelClass}>Fecha Nacimiento</label><input type="date" className={inputClass} value={nuevoResidente.nacimiento} onChange={(e) => setNuevoResidente({...nuevoResidente, nacimiento: e.target.value})} /></div>

            {/* SECCIÓN 2: SALUD Y COBERTURA */}
            <h4 className={sectionTitleClass}>Salud y Cobertura</h4>
            
            <div><label className={labelClass}>Estado</label><input className={inputClass} value={nuevoResidente.estado} onChange={(e) => setNuevoResidente({...nuevoResidente, estado: e.target.value})} /></div>
            <div><label className={labelClass}>Habitación</label><input className={inputClass} value={nuevoResidente.habitacion} onChange={(e) => setNuevoResidente({...nuevoResidente, habitacion: e.target.value})} /></div>
            <div><label className={labelClass}>Fecha de Ingreso</label><input type="date" className={inputClass} value={nuevoResidente.fechaIngreso} onChange={(e) => setNuevoResidente({...nuevoResidente, fechaIngreso: e.target.value})} /></div>
            <div><label className={labelClass}>Obra Social</label><input className={inputClass} value={nuevoResidente.obraSocial} onChange={(e) => setNuevoResidente({...nuevoResidente, obraSocial: e.target.value})} /></div>
            <div><label className={labelClass}>N° Afiliado</label><input className={inputClass} value={nuevoResidente.numAfiliado} onChange={(e) => setNuevoResidente({...nuevoResidente, numAfiliado: e.target.value})} /></div>
            <div><label className={labelClass}>Médico Cabecera</label><input className={inputClass} value={nuevoResidente.medicoCabecera} onChange={(e) => setNuevoResidente({...nuevoResidente, medicoCabecera: e.target.value})} /></div>
            <div><label className={labelClass}>Hospital Capitado</label><input className={inputClass} value={nuevoResidente.hospitalCapitado} onChange={(e) => setNuevoResidente({...nuevoResidente, hospitalCapitado: e.target.value})} /></div>
            
            <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className={labelClass}>Medicación</label><textarea className={`${inputClass} h-24 resize-none`} value={nuevoResidente.medicacion} onChange={(e) => setNuevoResidente({...nuevoResidente, medicacion: e.target.value})} /></div>
              <div><label className={labelClass}>Antecedentes</label><textarea className={`${inputClass} h-24 resize-none`} value={nuevoResidente.antecedentes} onChange={(e) => setNuevoResidente({...nuevoResidente, antecedentes: e.target.value})} /></div>
            </div>
            <div className="col-span-full"><label className={labelClass}>Factores de Riesgo</label><input className={inputClass} value={nuevoResidente.factoresRiesgo} onChange={(e) => setNuevoResidente({...nuevoResidente, factoresRiesgo: e.target.value})} /></div>

            {/* SECCIÓN 3: CONTACTOS */}
            <h4 className={sectionTitleClass}>Contactos y Apoderados</h4>
            
            <div><label className={labelClass}>Tel. Emergencia</label><input className={inputClass} value={nuevoResidente.telEmergencia} onChange={(e) => setNuevoResidente({...nuevoResidente, telEmergencia: e.target.value})} /></div>
            <div className="hidden xl:block"></div><div className="hidden xl:block"></div> {/* Espaciadores */}

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><label className={labelClass}>1° Apoderado</label><input className={inputClass} placeholder="Nombre" value={nuevoResidente.primerApoderado} onChange={(e) => setNuevoResidente({...nuevoResidente, primerApoderado: e.target.value})} /><input className={`${inputClass} mt-2`} placeholder="Teléfono" value={nuevoResidente.telApoderado} onChange={(e) => setNuevoResidente({...nuevoResidente, telApoderado: e.target.value})} /><input className={`${inputClass} mt-2`} placeholder="Dirección" value={nuevoResidente.direccionPrimerApoderado} onChange={(e) => setNuevoResidente({...nuevoResidente, direccionPrimerApoderado: e.target.value})} /></div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><label className={labelClass}>2° Apoderado</label><input className={inputClass} placeholder="Nombre" value={nuevoResidente.segundoApoderado} onChange={(e) => setNuevoResidente({...nuevoResidente, segundoApoderado: e.target.value})} /><input className={`${inputClass} mt-2`} placeholder="Teléfono" value={nuevoResidente.telSegundoApoderado} onChange={(e) => setNuevoResidente({...nuevoResidente, telSegundoApoderado: e.target.value})} /><input className={`${inputClass} mt-2`} placeholder="Dirección" value={nuevoResidente.direccionSegundoApoderado} onChange={(e) => setNuevoResidente({...nuevoResidente, direccionSegundoApoderado: e.target.value})} /></div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200"><label className={labelClass}>3° Apoderado</label><input className={inputClass} placeholder="Nombre" value={nuevoResidente.tercerApoderado} onChange={(e) => setNuevoResidente({...nuevoResidente, tercerApoderado: e.target.value})} /><input className={`${inputClass} mt-2`} placeholder="Teléfono" value={nuevoResidente.telTercerApoderado} onChange={(e) => setNuevoResidente({...nuevoResidente, telTercerApoderado: e.target.value})} /><input className={`${inputClass} mt-2`} placeholder="Dirección" value={nuevoResidente.direccionTercerApoderado} onChange={(e) => setNuevoResidente({...nuevoResidente, direccionTercerApoderado: e.target.value})} /></div>

            {/* BOTÓN SUBMIT */}
            <div className="col-span-full mt-4">
              <button type="submit" className="w-full md:w-auto px-8 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all">
                + Guardar Residente
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LISTA DE RESIDENTES */}
      {mostrarLista && (
        <div id="lista-seccion" className="animate-in fade-in duration-300">
          <div className="mb-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-400">🔍</span>
            </div>
            <input
                type="text"
                placeholder="Buscar por nombre, apellido o DNI..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
            <h4 className="text-2xl font-bold mb-6 text-slate-900">Listado de Residentes</h4>
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-semibold text-slate-600">Nombre Completo</th>
                  <th className="p-4 font-semibold text-slate-600">Habitación</th>
                  <th className="p-4 font-semibold text-slate-600">Estado</th>
                  <th className="p-4 font-semibold text-slate-600 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {residentesFiltrados.map(r => (
                  <tr key={r._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">{r.nombre} {r.apellido}</td>
                    <td className="p-4 text-slate-600">{r.habitacion}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-800">
                        {r.estado}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                          onClick={() => setResidenteHistorial(r)} 
                          className="px-3 py-2 bg-amber-100 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-200 transition-colors mr-2"
                          title="Ver Historial"
                      >
                          ✏️
                      </button>
                      <button 
                        onClick={() => descargarFichaPDF(r)} // 'r' es el residente de tu .map
                        className="px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        📄 Ficha PDF
                      </button>
                      <button onClick={() => setResidenteEnEdicion(r)} className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors mr-2">
                        Ficha
                      </button>
                      {(rol === 'medico' || rol === 'admin') && (
                        <button onClick={() => eliminarResidente(r._id)} className="px-4 py-2 bg-red-100 text-red-600 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors">
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GESTIÓN DE USUARIOS */}
      {mostrarUsuarios && (
        <div id="usuarios-seccion" className="animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h4 className="text-2xl font-bold mb-6 text-slate-900">Gestión de Usuarios</h4>
            
            {/* FORMULARIO PARA AGREGAR USUARIO */}
            <form onSubmit={manejarAgregarUsuario} className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
              <h5 className="text-lg font-semibold mb-4 text-slate-800">Agregar Nuevo Usuario</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div><label className={labelClass}>Nombre</label><input className={inputClass} value={nuevoUsuario.nombre} onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} required /></div>
                <div><label className={labelClass}>Usuario</label><input className={inputClass} value={nuevoUsuario.user} onChange={(e) => setNuevoUsuario({...nuevoUsuario, user: e.target.value})} required /></div>
                <div><label className={labelClass}>Contraseña</label><input type="password" className={inputClass} value={nuevoUsuario.password} onChange={(e) => setNuevoUsuario({...nuevoUsuario, password: e.target.value})} required /></div>
                <div>
                  <label className={labelClass}>Rol</label>
                  <select className={inputClass} value={nuevoUsuario.rol} onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})} required>
                    <option value="">Seleccionar rol</option>
                    <option value="medico">Médico</option>
                    <option value="asistente">Asistente</option>
                    <option value="admin">Administrativo</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="mt-4 px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors">
                + Agregar Usuario
              </button>
            </form>

            {/* LISTA DE USUARIOS */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 font-semibold text-slate-600">Nombre</th>
                    <th className="p-4 font-semibold text-slate-600">Usuario</th>
                    <th className="p-4 font-semibold text-slate-600">Rol</th>
                    <th className="p-4 font-semibold text-slate-600 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map(u => (
                    <tr key={u._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-800">{u.nombre}</td>
                      <td className="p-4 text-slate-600">{u.user}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          u.rol === 'medico' ? 'bg-blue-100 text-blue-800' :
                          u.rol === 'asistente' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {u.rol === 'asistente' ? 'ASISTENTE' : u.rol.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => eliminarUsuario(u._id)} className="px-4 py-2 bg-red-100 text-red-600 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
                                  


      {/* MODAL DE EDICIÓN */}
      {residenteEnEdicion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 border-b pb-4">Ficha Médica: {residenteEnEdicion.nombre} {residenteEnEdicion.apellido}</h2>
            
            <form onSubmit={guardarCambios} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div><label className={labelClass}>Estado de Salud</label>
                <select className={inputClass} value={residenteEnEdicion.estado} onChange={(e) => setResidenteEnEdicion({...residenteEnEdicion, estado: e.target.value})}>
                    <option value="Bien">Bien</option>
                    <option value="Estable">Estable</option>
                    <option value="Crítico">Crítico</option>
                </select>
              </div>
              
              <div><label className={labelClass}>Habitación</label><input type="number" className={inputClass} value={residenteEnEdicion.habitacion} onChange={(e) => setResidenteEnEdicion({...residenteEnEdicion, habitacion: e.target.value})} /></div>
              
              <div className="col-span-full"><label className={labelClass}>Medicación</label><textarea className={`${inputClass} h-20 resize-none`} value={residenteEnEdicion.medicacion || ''} onChange={(e) => setResidenteEnEdicion({...residenteEnEdicion, medicacion: e.target.value})} /></div>
              <div className="col-span-full"><label className={labelClass}>Antecedentes</label><textarea className={`${inputClass} h-20 resize-none`} value={residenteEnEdicion.antecedentes || ''} onChange={(e) => setResidenteEnEdicion({...residenteEnEdicion, antecedentes: e.target.value})} /></div>
              <div className="col-span-full"><label className={labelClass}>Factores de Riesgo</label><input className={inputClass} value={residenteEnEdicion.factoresRiesgo || ''} onChange={(e) => setResidenteEnEdicion({...residenteEnEdicion, factoresRiesgo: e.target.value})} /></div>
              
              <div><label className={labelClass}>Hospital Capitado</label><input className={inputClass} value={residenteEnEdicion.hospitalCapitado || ''} onChange={(e) => setResidenteEnEdicion({...residenteEnEdicion, hospitalCapitado: e.target.value})} /></div>
              <div><label className={labelClass}>Médico de Cabecera</label><input className={inputClass} value={residenteEnEdicion.medicoCabecera || ''} onChange={(e) => setResidenteEnEdicion({...residenteEnEdicion, medicoCabecera: e.target.value})} /></div>

              <div className="col-span-full pt-4 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Contactos y Apoderados</h3>
              </div>
              <div><label className={labelClass}>Tel. Emergencia</label><input className={inputClass} value={residenteEnEdicion.telEmergencia || ''} onChange={(e) => setResidenteEnEdicion({...residenteEnEdicion, telEmergencia: e.target.value})} /></div>
              <div className="col-span-full">
                <label className={labelClass}>1° Apoderado</label>
                <input className={inputClass} placeholder="Nombre" value={residenteEnEdicion.primerApoderado || ''} onChange={(e) => setResidenteEnEdicion({...residenteEnEdicion, primerApoderado: e.target.value})} />
                <input className={`${inputClass} mt-3`} placeholder="Teléfono" value={residenteEnEdicion.telApoderado || ''} onChange={(e) => setResidenteEnEdicion({...residenteEnEdicion, telApoderado: e.target.value})} />
                <input className={`${inputClass} mt-3`} placeholder="Dirección" value={residenteEnEdicion.direccionPrimerApoderado || ''} onChange={(e) => setResidenteEnEdicion({...residenteEnEdicion, direccionPrimerApoderado: e.target.value})} />
              </div>
              <div className="col-span-full">
                <label className={labelClass}>2° Apoderado</label>
                <input className={inputClass} placeholder="Nombre" value={residenteEnEdicion.segundoApoderado || ''} onChange={(e) => setResidenteEnEdicion({...residenteEnEdicion, segundoApoderado: e.target.value})} />
                <input className={`${inputClass} mt-3`} placeholder="Teléfono" value={residenteEnEdicion.telSegundoApoderado || ''} onChange={(e) => setResidenteEnEdicion({...residenteEnEdicion, telSegundoApoderado: e.target.value})} />
                <input className={`${inputClass} mt-3`} placeholder="Dirección" value={residenteEnEdicion.direccionSegundoApoderado || ''} onChange={(e) => setResidenteEnEdicion({...residenteEnEdicion, direccionSegundoApoderado: e.target.value})} />
              </div>
              <div className="col-span-full">
                <label className={labelClass}>3° Apoderado</label>
                <input className={inputClass} placeholder="Nombre" value={residenteEnEdicion.tercerApoderado || ''} onChange={(e) => setResidenteEnEdicion({...residenteEnEdicion, tercerApoderado: e.target.value})} />
                <input className={`${inputClass} mt-3`} placeholder="Teléfono" value={residenteEnEdicion.telTercerApoderado || ''} onChange={(e) => setResidenteEnEdicion({...residenteEnEdicion, telTercerApoderado: e.target.value})} />
                <input className={`${inputClass} mt-3`} placeholder="Dirección" value={residenteEnEdicion.direccionTercerApoderado || ''} onChange={(e) => setResidenteEnEdicion({...residenteEnEdicion, direccionTercerApoderado: e.target.value})} />
              </div>

              {/* CONTROLES DEL MODAL */}
              <div className="col-span-full flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
                <button type="button" onClick={() => setResidenteEnEdicion(null)} className="px-6 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {residenteHistorial && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                
                {/* Cabecera del Modal */}
                <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">
                        Historial de {residenteHistorial.nombre} {residenteHistorial.apellido}
                    </h2>
                    <button onClick={() => setResidenteHistorial(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
                </div>

               {/* Lista de Evoluciones */}
                    <div className="p-6 overflow-y-auto flex-1 bg-slate-100 space-y-4">
                        {residenteHistorial.evoluciones && residenteHistorial.evoluciones.length > 0 ? (
                            residenteHistorial.evoluciones.slice().reverse().map((evo, index) => {
                                
                               const categoriaReal = evo.categoria || evo.categroia || 'rutina';
                            const catNormalizada = categoriaReal?.toLowerCase().trim();
                            const etiquetaCategoria = {
                                rutina: 'Rutina',
                                medicacion: 'Medicación',
                                'medicación': 'Medicación',
                                incidente: 'Incidente'
                            }[catNormalizada] || categoriaReal;

                                // Definimos los estilos usando los nombres normalizados
                                const estilos = {
                                    rutina: 'bg-emerald-50 text-emerald-900 border-l-emerald-500',
                                    medicación: 'bg-sky-50 text-sky-900 border-l-sky-500',
                                    medicacion: 'bg-sky-50 text-sky-900 border-l-sky-500',
                                    incidente: 'bg-red-50 text-red-900 border-l-red-500'
                                };

                                const claseColor = estilos[catNormalizada] || 'bg-white text-slate-700 border-l-slate-400';

                                return (
                                    <div key={index} className={`p-4 rounded-xl shadow-sm border border-slate-200 border-l-4 ${claseColor}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                                                {catNormalizada === 'incidente' ? '⚠️ ' : ''}{etiquetaCategoria}
                                            </span>
                                            <div className="text-right text-[10px] font-bold opacity-60">
                                                <p>{new Date(evo.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} hs</p>
                                                <p>POR: {evo.autor?.toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                                            {evo.nota}
                                        </p>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center text-slate-500 italic py-8">No hay registros aún.</p>
                        )}
                    </div>

                {/* Formulario para agregar nota (SOLO MÉDICO) */}
                {rol === 'medico' && (
                    <div className="p-6 border-t border-slate-200 bg-white">
                        <h3 className="text-sm font-bold text-slate-600 mb-3">Agregar Evolución</h3>
                        <form onSubmit={guardarEvolucion} className="flex gap-3 items-start">
                            <select 
                                className="p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                                value={nuevaNota.categoria} 
                                onChange={e => setNuevaNota({...nuevaNota, categoria: e.target.value})}
                            >
                                <option value="rutina">Rutina</option>
                                <option value="medicacion">Medicación</option>
                                <option value="incidente">Incidente ⚠️</option>
                            </select>
                            <textarea 
                                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none resize-none h-12" 
                                placeholder="Escriba el reporte aquí..."
                                value={nuevaNota.nota}
                                onChange={e => setNuevaNota({...nuevaNota, nota: e.target.value})}
                            />
                            <button type="submit" className="px-6 py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition-colors">
                                Firmar
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )}

    </div>
  );
}

export default Dashboard;