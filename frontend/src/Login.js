import React, { useState, useEffect } from 'react';
import './Login.css';
import moviumIcon from './assets/movium-icono.png';
import moviumLogo from './assets/movium-logo.png';
import { API_BASE_URL } from './config';

const MAX_USUARIO = 18;
const MAX_CLAVE = 50;

function LoginPage() {
  const [esLogin, setEsLogin] = useState(true);
  const [usuarioLogin, setUsuarioLogin] = useState('');
  const [clave, setClave] = useState('');
  const [usuarioRegistro, setUsuarioRegistro] = useState('');
  const [mensaje, setMensaje] = useState('');
  const temaGuardado = localStorage.getItem('movium_theme');
  const [tema, setTema] = useState(temaGuardado === 'light' ? 'light' : 'dark');
  const [mostrarClave, setMostrarClave] = useState(false);

  const toggleTheme = () => {
    const temaNuevo = tema === 'dark' ? 'light' : 'dark';
    localStorage.setItem('movium_theme', temaNuevo);
    setTema(temaNuevo);
  };

  useEffect(() => {
    document.body.className = tema;
  }, [tema]);

  const enviarLogin = async (e) => {
    e.preventDefault();
    setMensaje('');
    const urlLogin = `${API_BASE_URL}iniciar_sesion.php`;

    try {
      const respuesta = await fetch(urlLogin, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_usuario: usuarioLogin, password: clave }),
      });
      const datos = await respuesta.json();

      if (respuesta.ok) {
        localStorage.setItem('movium_token', datos.token);
        localStorage.setItem('movium_user', JSON.stringify(datos.usuario));
        window.location.href = '/';
      } else {
        setMensaje(`Error: ${datos.mensaje}`);
      }

    } catch (error) {
      setMensaje('Error de red. No se pudo conectar al servidor.');
    }
  };

  const enviarRegistro = async (e) => {
    e.preventDefault();
    setMensaje('');

    if (usuarioRegistro.length < 4) {
      setMensaje('El nombre de usuario debe tener al menos 4 caracteres.');
      return;
    }
    if (usuarioRegistro.length > MAX_USUARIO) {
      setMensaje(`El nombre de usuario no puede tener más de ${MAX_USUARIO} caracteres.`);
      return;
    }
    if (clave.length < 6) {
      setMensaje('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (clave.length > MAX_CLAVE) {
      setMensaje(`La contraseña no puede tener más de ${MAX_CLAVE} caracteres.`);
      return;
    }

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
        if (datos.token && datos.usuario) {
            localStorage.setItem('movium_token', datos.token);
            localStorage.setItem('movium_user', JSON.stringify(datos.usuario));
            window.location.href = '/';
        } else {
            setMensaje('¡Registro completado! Ahora puedes iniciar sesión.');
            cambiarVista(true);
        }
      } else {
        setMensaje(`Error en el registro: ${datos.mensaje}`);
      }
    } catch (error) {
      setMensaje('Error de red. No se pudo conectar al servidor.');
    }
  };

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

          {mensaje && <p className="message">{mensaje}</p>}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;