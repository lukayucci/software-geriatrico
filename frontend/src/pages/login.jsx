
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  // Estados para guardar lo que el usuario escribe
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

    const navigate = useNavigate();

  const manejarLogin = async (e) => {
  e.preventDefault();
  setError('');

  try {
    console.log('Enviando datos:', { nombre, password });
    // Mandamos los nombres de propiedades EXACTOS que pide tu servidor
    const respuesta = await axios.post('http://localhost:5000/api/login', {
      nombre: nombre,
      password: password
    });

    localStorage.setItem('token', respuesta.data.token);
    localStorage.setItem('rol', respuesta.data.rol);
    alert('¡Bienvenido! Entraste como ' + respuesta.data.rol);
    navigate('/dashboard');
    
  } catch (err) {
    // Si te sale el error, es porque los nombres no coinciden o los datos están mal
    setError('Usuario o contraseña incorrectos');
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Sistema Geriátrico
          </h1>
          <p className="text-gray-500 text-sm">Ingresa tus credenciales</p>
        </div>

        {/* Form */}
        <form onSubmit={manejarLogin} className="space-y-5">
          {/* Usuario Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Usuario
            </label>
            <input 
              type="text" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              placeholder="Ingresa tu usuario"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
            />
          </div>

          {/* Contraseña Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Ingresa tu contraseña"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* Botón Submit */}
          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-200 transform hover:scale-105 active:scale-95 shadow-md"
          >
            Ingresar
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-600 text-sm">
            © 2026 Sistema Geriátrico. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;