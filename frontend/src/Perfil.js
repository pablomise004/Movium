// Pantalla de perfil

import React, { useState, useEffect } from 'react';
import './Perfil.css';
import iconoPerfil from './assets/mi-perfil.png';
import { API_BASE_URL } from './config';

function Perfil() {
  const [datosForm, setDatosForm] = useState({
    nombre_usuario: '', correo_electronico: '', telefono: '',
    nombre_real: '', apellidos: '', fecha_nacimiento: '',
    altura_cm: '', peso_kg: '', direccion: ''
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeOk, setMensajeOk] = useState(null);
  const hoy = new Date().toISOString().split('T')[0];

  const manejarTeclaNumerica = (e, permitirDecimal = false) => {
    if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
      e.preventDefault();
      return;
    }
    if (!permitirDecimal && (e.key === '.' || e.key === ',')) {
      e.preventDefault();
      return;
    }
  };

  useEffect(() => {
    const cargarPerfil = async () => {
      setCargando(true);
      setError(null); setMensajeOk(null);
      const token = localStorage.getItem('movium_token');
      if (!token) {
        setError("Error de autenticación. Por favor, inicia sesión de nuevo.");
        setCargando(false);
        return;
      }
      const respuesta = await fetch(`${API_BASE_URL}get_perfil.php`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) { setError(datos.mensaje || 'No se pudo cargar el perfil.'); setCargando(false); return; }
      setDatosForm({
        nombre_usuario: datos.nombre_usuario || '',
        correo_electronico: datos.correo_electronico || '',
        telefono: datos.telefono || '',
        nombre_real: datos.nombre_real || '',
        apellidos: datos.apellidos || '',
        fecha_nacimiento: datos.fecha_nacimiento || '',
        altura_cm: datos.altura_cm || '',
        peso_kg: datos.peso_kg || '',
        direccion: datos.direccion || ''
      });
      setCargando(false);
    };
    cargarPerfil();
  }, []);

  const manejarCambio = (e) => {
    const campo = e.target.name;
    const valor = e.target.value;
    setError(null);
    setMensajeOk(null);

    if (campo === 'correo_electronico') {
      setDatosForm({ ...datosForm, correo_electronico: valor });
    } else if (campo === 'telefono') {
      setDatosForm({ ...datosForm, telefono: valor });
    } else if (campo === 'nombre_real') {
      setDatosForm({ ...datosForm, nombre_real: valor });
    } else if (campo === 'apellidos') {
      setDatosForm({ ...datosForm, apellidos: valor });
    } else if (campo === 'fecha_nacimiento') {
      setDatosForm({ ...datosForm, fecha_nacimiento: valor });
    } else if (campo === 'altura_cm') {
      if (valor.length > 3) return;
      setDatosForm({ ...datosForm, altura_cm: valor });
    } else if (campo === 'peso_kg') {
      setDatosForm({ ...datosForm, peso_kg: valor });
    } else if (campo === 'direccion') {
      setDatosForm({ ...datosForm, direccion: valor });
    }
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError(null); setMensajeOk(null);

    // Comprueba que el correo tiene al menos el formato algo@algo.algo
    // no es perfecto pero sirve para detectar errores basicos
    if (datosForm.correo_electronico && !/\S+@\S+\.\S+/.test(datosForm.correo_electronico)) {
      setError("Por favor, introduce un formato de correo válido.");
      return;
    }
    // El telefono tiene que ser solo numeros y entre 9 y 15 digitos
    if (datosForm.telefono && (datosForm.telefono.length < 9 || datosForm.telefono.length > 15 || !/^\d+$/.test(datosForm.telefono))) {
      setError("El formato del teléfono no es válido.");
      return;
    }
    if (datosForm.altura_cm && (datosForm.altura_cm < 50 || datosForm.altura_cm > 300)) {
      setError("La altura debe estar entre 50 y 300 cm.");
      return;
    }
    if (datosForm.peso_kg && (datosForm.peso_kg < 30 || datosForm.peso_kg > 300)) {
      setError("El peso debe estar entre 30 y 300 kg.");
      return;
    }

    const token = localStorage.getItem('movium_token');
    try {
      const respuesta = await fetch(`${API_BASE_URL}update_perfil.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(datosForm)
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.mensaje || 'Error al guardar el perfil.');
      setMensajeOk(datos.mensaje || "Perfil actualizado con éxito.");
      setTimeout(() => setMensajeOk(null), 3000);
    } catch (error) {
      setError(error.message);
    }
  };

  if (cargando) {
    return <div className="perfil-container"><p className="subtitle" style={{ textAlign: 'center' }}>Cargando perfil...</p></div>;
  }

  return (
    <div className="perfil-container">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem', gap: '10px' }}>
        <img src={iconoPerfil} alt="" width="64" height="64" />
        <h2>Mi Perfil</h2>
      </div>
      <p className="subtitle" style={{ textAlign: 'center' }}>Actualiza tu información personal y de contacto.</p>

      <form className="perfil-form" onSubmit={manejarEnvio}>
        <div className="form-grid-perfil">

          <div className="form-group-perfil form-span-2">
            <label htmlFor="nombre_usuario">Nombre de Usuario (no se puede cambiar)</label>
            <input type="text" id="nombre_usuario" name="nombre_usuario" value={datosForm.nombre_usuario} readOnly className="input-disabled" />
          </div>

          <div className="form-group-perfil form-span-2">
            <label htmlFor="correo_electronico">Correo Electrónico</label>
            <input type="email" id="correo_electronico" name="correo_electronico" value={datosForm.correo_electronico} onChange={manejarCambio} placeholder="tu@correo.com" maxLength="100" />
          </div>

          <div className="form-group-perfil">
            <label htmlFor="nombre_real">Nombre</label>
            <input type="text" id="nombre_real" name="nombre_real" value={datosForm.nombre_real} onChange={manejarCambio} placeholder="Tu nombre" maxLength="100" />
          </div>

          <div className="form-group-perfil">
            <label htmlFor="apellidos">Apellidos</label>
            <input type="text" id="apellidos" name="apellidos" value={datosForm.apellidos} onChange={manejarCambio} placeholder="Tus apellidos" maxLength="150" />
          </div>

          <div className="form-group-perfil">
            <label htmlFor="telefono">Teléfono</label>
            <input type="tel" id="telefono" name="telefono" value={datosForm.telefono} onChange={manejarCambio} placeholder="Tu número de teléfono" minLength="9" maxLength="15" pattern="\d*" />
          </div>

          <div className="form-group-perfil">
            <label htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
            <input type="date" id="fecha_nacimiento" name="fecha_nacimiento" value={datosForm.fecha_nacimiento} onChange={manejarCambio} max={hoy} />
          </div>

          <div className="form-group-perfil">
            <label htmlFor="altura_cm">Altura (cm)</label>
            <input type="number" id="altura_cm" name="altura_cm" value={datosForm.altura_cm} onChange={manejarCambio} placeholder="Tu altura" min="50" max="300" step="1" onKeyDown={(e) => manejarTeclaNumerica(e, false)} />
          </div>

          <div className="form-group-perfil">
            <label htmlFor="peso_kg">Peso (kg)</label>
            <input type="number" id="peso_kg" name="peso_kg" value={datosForm.peso_kg} onChange={manejarCambio} placeholder="Tu peso" min="30" max="300" step="0.01" onKeyDown={(e) => manejarTeclaNumerica(e, true)} />
          </div>

          <div className="form-group-perfil form-span-2">
            <label htmlFor="direccion">Dirección</label>
            <input type="text" id="direccion" name="direccion" value={datosForm.direccion} onChange={manejarCambio} placeholder="Tu dirección" maxLength="255" />
          </div>

        </div>

        <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', minHeight: '2.5rem' }}>
          {error && <div className="message">{error}</div>}
          {mensajeOk && <div className="message success">{mensajeOk}</div>}
        </div>

        <div className="form-actions-perfil">
          <button type="submit" className="transparent-btn">Guardar Cambios</button>
        </div>
      </form>
    </div>
  );
}

export default Perfil;