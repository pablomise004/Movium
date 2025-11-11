// ---- frontend/src/LoginPage.js (CORREGIDO para contadores INTERNOS) ----

import React, { useState, useEffect } from 'react';
import './LoginPage.css';
import moviumIcon from './assets/movium-icono.png';
import moviumLogo from './assets/movium-logo.png';

// --- Constantes de longitud (sin cambios) ---
const MAX_USERNAME_LENGTH = 18;
const MAX_PASSWORD_LENGTH = 50;

function LoginPage() {
  // --- ESTADO DEL COMPONENTE (sin cambios) ---
  const [isLoginView, setIsLoginView] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('movium_theme');
    return savedTheme === 'light' ? 'light' : 'dark';
  });
  const [showPassword, setShowPassword] = useState(false);

  // --- MANEJADORES DE EVENTOS Y FUNCIONES (sin cambios) ---

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('movium_theme', newTheme);
      return newTheme;
    });
  };

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);
  // --- LLAMADAS A LA API (sin cambios) ---

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const loginUrl = 'http://localhost/programacion/TFG/movium/backend/api/login.php';

    try {
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('movium_token', data.token);
        localStorage.setItem('movium_user', JSON.stringify(data.usuario)); 
        window.location.href = '/';
      } else {
        setMessage(`Error: ${data.mensaje}`);
      }
      
    } catch (error) {
      setMessage('Error de red. No se pudo conectar al servidor.');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    // --- Validación (sin cambios) ---
    const minLongitud = 6;
    const regexNumero = /[0-9]/;
    const regexEspecial = /\W/;

    if (username.length < 4) {
       setMessage('El nombre de usuario debe tener al menos 4 caracteres.');
       return;
    }
    if (username.length > MAX_USERNAME_LENGTH) {
       setMessage(`El nombre de usuario no puede tener más de ${MAX_USERNAME_LENGTH} caracteres.`);
       return;
    }
    
    if (password.length < minLongitud) {
      setMessage(`La contraseña debe tener al menos ${minLongitud} caracteres.`);
      return;
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      setMessage(`La contraseña no puede tener más de ${MAX_PASSWORD_LENGTH} caracteres.`);
       return;
    }

    if (!regexNumero.test(password)) {
      setMessage("La contraseña debe contener al menos un número.");
      return;
    }
    if (!regexEspecial.test(password)) {
      setMessage("La contraseña debe contener al menos un carácter especial (ej: !@#$...).");
      return;
    }
    // --- FIN VALIDACIÓN ---


    const registerUrl = 'http://localhost/programacion/TFG/movium/backend/api/register.php';
    try {
      const response = await fetch(registerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_usuario: username,
          password: password,
        }),
      });
      const data = await response.json();

      if (response.ok) { 
        if (data.token && data.usuario) {
            localStorage.setItem('movium_token', data.token);
            localStorage.setItem('movium_user', JSON.stringify(data.usuario)); 
            window.location.href = '/';
        } else {
            setMessage('¡Registro completado! Ahora puedes iniciar sesión.');
            toggleView(true);
        }
      } else { 
        setMessage(`Error en el registro: ${data.mensaje}`);
      }
    } catch (error) {
      setMessage('Error de red. No se pudo conectar al servidor.');
    }
  };

  // Función interna (sin cambios)
  const toggleView = (isLogin) => {
    setIsLoginView(isLogin);
    setUsername('');
    setIdentifier('');
    setPassword('');
    setMessage('');
    setShowPassword(false);
  };

  // --- RENDERIZADO DEL JSX ---
  return (
    <div className="page-container">
      <button onClick={toggleTheme} className="theme-toggle" aria-label={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}>
        <span className={`theme-icon sun ${theme === 'light' ? 'active' : ''}`}>☀️</span>
        <span className={`theme-icon moon ${theme === 'dark' ? 'active' : ''}`}>🌙</span>
      </button>

      <div className="form-wrapper">
        <div className="panel-izquierdo">
           <img src={moviumIcon} alt="Movium Icon" className="icon" />
          <img src={moviumLogo} alt="Movium Logo" className="logo-text-image" />
          <p>Tu progreso, tu comunidad, tu gimnasio.</p>
        </div>

        <div className="panel-derecho">
          {isLoginView ? (
            // --- Formulario de Login ---
            <form onSubmit={handleLoginSubmit} className="login-form-view">
               <h2>Iniciar Sesión</h2>
              
              {/* --- ¡CAMBIO! Volvemos a usar .input-wrapper --- */}
              <div className="input-wrapper">
                <input
                  type="text"
                  placeholder="Nombre de usuario o Email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  minLength="4"
                  maxLength={MAX_USERNAME_LENGTH} // Límite de 18
                  required
                />
              </div>

              <div className="password-wrapper">
                 <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="4" 
                  maxLength={MAX_PASSWORD_LENGTH} // Límite de 50
                />
                <span
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </span>
              </div>

              <div className="button-group">
                <button type="submit" className="transparent-btn">
                  Entrar
                </button>
              </div>

              <p className="toggle-form">
                ¿No tienes cuenta?{' '}
                <span onClick={() => toggleView(false)}>Crear cuenta</span>
              </p>
            </form>
            ) : (
            // --- Formulario de Registro ---
            <form onSubmit={handleRegisterSubmit} className="register-form-view">
              <h2>Crear Cuenta</h2>
              
              {/* --- ¡CAMBIO! Wrapper para el contador de usuario --- */}
              <div className="input-wrapper">
                <input
                  type="text"
                  className="input-with-counter" /* ¡Clase nueva! */
                  placeholder="Nombre de usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  maxLength={MAX_USERNAME_LENGTH}
                />
                {/* Contador de usuario (DENTRO) */}
                <small className="char-counter-login">
                  {username.length} / {MAX_USERNAME_LENGTH}
                </small>
              </div>

              {/* --- ¡CAMBIO! Wrapper de Contraseña (DENTRO) --- */}
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-with-counter password" /* ¡Clase nueva! */
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="6"
                  maxLength={MAX_PASSWORD_LENGTH}
                  title="Mínimo 6 caracteres, 1 número y 1 carácter especial."
                />
                <span
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </span>
                {/* Contador de Contraseña (DENTRO) */}
                <small className="char-counter-login password">
                  {password.length} / {MAX_PASSWORD_LENGTH}
                </small>
              </div>


              <div className="button-group">
                <button type="submit" className="transparent-btn">
                  Registrarse
                </button>
              </div>

              <p className="toggle-form">
                ¿Ya tienes cuenta?{' '}
                <span onClick={() => toggleView(true)}>Inicia sesión</span>
              </p>
            </form>
            )}

          {message && <p className="message">{message}</p>}
        </div>
      </div>
    </div>
  );
}

export default LoginPage;