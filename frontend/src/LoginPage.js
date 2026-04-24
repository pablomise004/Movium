// Pantalla de acceso y registro

import React, { useState, useEffect } from 'react';
import './LoginPage.css';
import moviumIcon from './assets/movium-icono.png';
import moviumLogo from './assets/movium-logo.png';
import { API_BASE_URL } from './config';

// Límites básicos
const MAX_USERNAME_LENGTH = 18;
const MAX_PASSWORD_LENGTH = 50;

function LoginPage() {
  // Estado para cambiar entre login y registro
  const [vistaLogin, setVistaLogin] = useState(true);
  // Campo de usuario del formulario de login
  const [nombreUsuarioLogin, setNombreUsuarioLogin] = useState('');
  // Contraseña compartida entre ambas vistas
  const [contrasena, setContrasena] = useState('');
  // Campo de usuario del formulario de registro
  const [nombreUsuario, setNombreUsuario] = useState('');
  // Mensaje de error o aviso
  const [mensaje, setMensaje] = useState('');
  // Tema guardado en localStorage
  const [tema, setTema] = useState(() => {
    const temaGuardado = localStorage.getItem('movium_theme');
    return temaGuardado === 'light' ? 'light' : 'dark';
  });
  // Mostrar/ocultar texto de contraseña
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  // Cambiar tema y persistir selección
  const toggleTheme = () => {
    setTema((temaActual) => {
      const temaNuevo = temaActual === 'dark' ? 'light' : 'dark';
      localStorage.setItem('movium_theme', temaNuevo);
      return temaNuevo;
    });
  };

  // Aplicar clase de tema al body
  useEffect(() => {
    document.body.className = tema;
  }, [tema]);

  // Login con nombre de usuario y contraseña
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    const urlLogin = `${API_BASE_URL}login.php`;

    try {
      // Enviar credenciales al backend
      const response = await fetch(urlLogin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_usuario: nombreUsuarioLogin, password: contrasena }),
      });
      const data = await response.json();

      if (response.ok) {
        // Guardar sesión y entrar a la app
        localStorage.setItem('movium_token', data.token);
        localStorage.setItem('movium_user', JSON.stringify(data.usuario)); 
        window.location.href = '/';
      } else {
        // Mostrar mensaje devuelto por API
        setMensaje(`Error: ${data.mensaje}`);
      }
      
    } catch (error) {
      // Error de conexión
      setMensaje('Error de red. No se pudo conectar al servidor.');
    }
  };

  // Registro con validaciones básicas en cliente
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');

    // Reglas de contraseña
    const longitudMinima = 6;
    const regexNumero = /[0-9]/;
    const regexEspecial = /\W/;

    // Validaciones de nombre
    if (nombreUsuario.length < 4) {
       setMensaje('El nombre de usuario debe tener al menos 4 caracteres.');
       return;
    }
    if (nombreUsuario.length > MAX_USERNAME_LENGTH) {
       setMensaje(`El nombre de usuario no puede tener más de ${MAX_USERNAME_LENGTH} caracteres.`);
       return;
    }
    
     // Validaciones de contraseña
    if (contrasena.length < longitudMinima) {
      setMensaje(`La contraseña debe tener al menos ${longitudMinima} caracteres.`);
      return;
    }
    if (contrasena.length > MAX_PASSWORD_LENGTH) {
      setMensaje(`La contraseña no puede tener más de ${MAX_PASSWORD_LENGTH} caracteres.`);
       return;
    }

    if (!regexNumero.test(contrasena)) {
      setMensaje("La contraseña debe contener al menos un número.");
      return;
    }
    if (!regexEspecial.test(contrasena)) {
      setMensaje("La contraseña debe contener al menos un carácter especial (ej: !@#$...).");
      return;
    }

    // Enviar datos de registro
    const urlRegistro = `${API_BASE_URL}register.php`;
    try {
      const response = await fetch(urlRegistro, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_usuario: nombreUsuario,
          password: contrasena,
        }),
      });
      const data = await response.json();

      if (response.ok) { 
        // Si backend devuelve token, entrar directo
        if (data.token && data.usuario) {
            localStorage.setItem('movium_token', data.token);
            localStorage.setItem('movium_user', JSON.stringify(data.usuario)); 
            window.location.href = '/';
        } else {
            // Si no, mostrar aviso y volver a login
            setMensaje('¡Registro completado! Ahora puedes iniciar sesión.');
            cambiarVista(true);
        }
      } else { 
        // Mensaje de validación del backend
        setMensaje(`Error en el registro: ${data.mensaje}`);
      }
    } catch (error) {
      // Error de conexión
      setMensaje('Error de red. No se pudo conectar al servidor.');
    }
  };

  // Cambiar de vista y limpiar formulario
  const cambiarVista = (esLogin) => {
    setVistaLogin(esLogin);
    setNombreUsuario('');
    setNombreUsuarioLogin('');
    setContrasena('');
    setMensaje('');
    setMostrarContrasena(false);
  };

  return (
    <div className="page-container">
      {/* Botón de tema en la esquina superior */}
      <button onClick={toggleTheme} className="theme-toggle" aria-label={`Cambiar a tema ${tema === 'dark' ? 'claro' : 'oscuro'}`}>
        <span className={`theme-icon sun ${tema === 'light' ? 'active' : ''}`}>☀️</span>
        <span className={`theme-icon moon ${tema === 'dark' ? 'active' : ''}`}>🌙</span>
      </button>

      <div className="form-wrapper">
        {/* Panel visual izquierdo */}
        <div className="panel-izquierdo">
           <img src={moviumIcon} alt="Movium Icon" className="icon" />
          <img src={moviumLogo} alt="Movium Logo" className="logo-text-image" />
          <p>Tu progreso, tu entrenamiento, tu gimnasio.</p>
        </div>

        <div className="panel-derecho">
          {vistaLogin ? (
            // Vista de login
            <form onSubmit={handleLoginSubmit} className="login-form-view">
               <h2>Iniciar Sesión</h2>

              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Nombre de usuario"
                  value={nombreUsuarioLogin}
                  onChange={(e) => setNombreUsuarioLogin(e.target.value)}
                  minLength="4"
                  maxLength={MAX_USERNAME_LENGTH}
                  required
                />
              </div>

              <div className="password-wrapper">
                <input
                  type={mostrarContrasena ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                  minLength="4" 
                  maxLength={MAX_PASSWORD_LENGTH}
                />
                <span
                  className="password-toggle"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                >
                  {mostrarContrasena ? 'Ocultar' : 'Mostrar'}
                </span>
              </div>

              <div className="button-group">
                <button type="submit" className="transparent-btn">
                  Entrar
                </button>
              </div>

              <p className="toggle-form">
                ¿No tienes cuenta?{' '}
                <span onClick={() => cambiarVista(false)}>Crear cuenta</span>
              </p>
            </form>
            ) : (
            // Vista de registro
            <form onSubmit={handleRegisterSubmit} className="register-form-view">
              <h2>Crear Cuenta</h2>

              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Nombre de usuario"
                  value={nombreUsuario}
                  onChange={(e) => setNombreUsuario(e.target.value)}
                  required
                  maxLength={MAX_USERNAME_LENGTH}
                />
              </div>

              <div className="password-wrapper">
                <input
                  type={mostrarContrasena ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                  minLength="6"
                  maxLength={MAX_PASSWORD_LENGTH}
                  title="Mínimo 6 caracteres, 1 número y 1 carácter especial."
                />
                <span
                  className="password-toggle"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                >
                  {mostrarContrasena ? 'Ocultar' : 'Mostrar'}
                </span>
              </div>


              <div className="button-group">
                <button type="submit" className="transparent-btn">
                  Registrarse
                </button>
              </div>

              <p className="toggle-form">
                ¿Ya tienes cuenta?{' '}
                <span onClick={() => cambiarVista(true)}>Inicia sesión</span>
              </p>
            </form>
            )}

          {/* Mensaje general debajo del formulario */}
          {mensaje && <p className="message">{mensaje}</p>}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;