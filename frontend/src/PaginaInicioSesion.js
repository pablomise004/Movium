// Pantalla de acceso y registro

import React, { useState, useEffect } from 'react';
import './PaginaInicioSesion.css';
import moviumIcon from './assets/movium-icono.png';
import moviumLogo from './assets/movium-logo.png';
import { API_BASE_URL } from './configuracion';

// Limites basicos
const MAX_USUARIO = 18;
const MAX_CLAVE = 50;

function LoginPage() {
  // Estado para cambiar entre login y registro
  const [esLogin, setEsLogin] = useState(true);
  // Campo de usuario del formulario de login
  const [usuarioLogin, setUsuarioLogin] = useState('');
  // Contraseña compartida entre ambas vistas
  const [clave, setClave] = useState('');
  // Campo de usuario del formulario de registro
  const [usuarioRegistro, setUsuarioRegistro] = useState('');
  // Mensaje de error o aviso
  const [mensaje, setMensaje] = useState('');
  // Tema guardado en localStorage
  const temaGuardado = localStorage.getItem('movium_theme');
  const [tema, setTema] = useState(temaGuardado === 'light' ? 'light' : 'dark');
  // Mostrar/ocultar texto de contraseña
  const [mostrarClave, setMostrarClave] = useState(false);

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
  const enviarLogin = async (e) => {
    e.preventDefault();
    setMensaje('');
    const urlLogin = `${API_BASE_URL}iniciar_sesion.php`;

    try {
      // Enviar credenciales al backend
      const respuesta = await fetch(urlLogin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_usuario: usuarioLogin, password: clave }),
      });
      const datos = await respuesta.json();

      if (respuesta.ok) {
        // Guardar sesión y entrar a la app
        localStorage.setItem('movium_token', datos.token);
        localStorage.setItem('movium_user', JSON.stringify(datos.usuario));
        window.location.href = '/';
      } else {
        // Mostrar mensaje devuelto por API
        setMensaje(`Error: ${datos.mensaje}`);
      }
      
    } catch (error) {
      // Error de conexión
      setMensaje('Error de red. No se pudo conectar al servidor.');
    }
  };

  // Registro con validaciones básicas en cliente
  const enviarRegistro = async (e) => {
    e.preventDefault();
    setMensaje('');

    // Reglas de contraseña
    const longitudMinima = 6;
    const regexNumero = /[0-9]/;
    const regexEspecial = /\W/;

    // Validaciones de nombre
     if (usuarioRegistro.length < 4) {
       setMensaje('El nombre de usuario debe tener al menos 4 caracteres.');
       return;
    }
     if (usuarioRegistro.length > MAX_USUARIO) {
       setMensaje(`El nombre de usuario no puede tener más de ${MAX_USUARIO} caracteres.`);
       return;
    }
    
     // Validaciones de contraseña
    if (clave.length < longitudMinima) {
      setMensaje(`La contraseña debe tener al menos ${longitudMinima} caracteres.`);
      return;
    }
    if (clave.length > MAX_CLAVE) {
      setMensaje(`La contraseña no puede tener más de ${MAX_CLAVE} caracteres.`);
       return;
    }

    if (!regexNumero.test(clave)) {
      setMensaje("La contraseña debe contener al menos un número.");
      return;
    }
    if (!regexEspecial.test(clave)) {
      setMensaje("La contraseña debe contener al menos un carácter especial (ej: !@#$...).");
      return;
    }

    // Enviar datos de registro
    const urlRegistro = `${API_BASE_URL}registrarse.php`;
    try {
      const respuesta = await fetch(urlRegistro, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_usuario: usuarioRegistro,
          password: clave,
        }),
      });
      const datos = await respuesta.json();

      if (respuesta.ok) {
        // Si backend devuelve token, entrar directo
        if (datos.token && datos.usuario) {
            localStorage.setItem('movium_token', datos.token);
            localStorage.setItem('movium_user', JSON.stringify(datos.usuario));
            window.location.href = '/';
        } else {
            // Si no, mostrar aviso y volver a login
            setMensaje('¡Registro completado! Ahora puedes iniciar sesión.');
            cambiarVista(true);
        }
      } else {
        // Mensaje de validación del backend
        setMensaje(`Error en el registro: ${datos.mensaje}`);
      }
    } catch (error) {
      // Error de conexión
      setMensaje('Error de red. No se pudo conectar al servidor.');
    }
  };

  // Cambiar de vista y limpiar formulario
  const cambiarVista = (esLogin) => {
    setEsLogin(esLogin);
    setUsuarioRegistro('');
    setUsuarioLogin('');
    setClave('');
    setMensaje('');
    setMostrarClave(false);
  };

  return (
    <div className="page-container">
      {/* Botón de tema en la esquina superior */}
      <button onClick={toggleTheme} className="theme-toggle">
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
          {esLogin ? (
            // Vista de login
            <form onSubmit={enviarLogin} className="login-form-view">
               <h2>Iniciar Sesión</h2>

              <div className="input-wrapper">
                <input
                  type="text"
                  id="login-username"
                  name="login-username"
                  placeholder="Nombre de usuario"
                  value={usuarioLogin}
                  onChange={(e) => setUsuarioLogin(e.target.value)}
                  minLength="4"
                  maxLength={MAX_USUARIO}
                  required
                />
              </div>

              <div className="password-wrapper">
                <input
                  type={mostrarClave ? 'text' : 'password'}
                  id="login-password"
                  name="login-password"
                  placeholder="Contraseña"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  required
                  minLength="4" 
                  maxLength={MAX_CLAVE}
                />
                <span
                  className="password-toggle"
                  onClick={() => setMostrarClave(!mostrarClave)}
                >
                  {mostrarClave ? 'Ocultar' : 'Mostrar'}
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
            <form onSubmit={enviarRegistro} className="register-form-view">
              <h2>Crear Cuenta</h2>

              <div className="input-wrapper">
                <input
                  type="text"
                  id="register-username"
                  name="register-username"
                  placeholder="Nombre de usuario"
                  value={usuarioRegistro}
                  onChange={(e) => setUsuarioRegistro(e.target.value)}
                  required
                  maxLength={MAX_USUARIO}
                />
              </div>

              <div className="password-wrapper">
                <input
                  type={mostrarClave ? 'text' : 'password'}
                  id="register-password"
                  name="register-password"
                  placeholder="Contraseña"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  required
                  minLength="6"
                  maxLength={MAX_CLAVE}
                  title="Mínimo 6 caracteres, 1 número y 1 carácter especial."
                />
                <span
                  className="password-toggle"
                  onClick={() => setMostrarClave(!mostrarClave)}
                >
                  {mostrarClave ? 'Ocultar' : 'Mostrar'}
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