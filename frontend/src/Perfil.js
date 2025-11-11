// ---- frontend/src/Perfil.js (AHORA SÍ, CON onKeyDown + handleChange) ----

import React, { useState, useEffect } from 'react';
import './Perfil.css'; // Asegúrate que la ruta es correcta
import iconoPerfil from './assets/mi-perfil.png';
// Asegúrate que la ruta es correcta

function Perfil() {
  // --- Estados del Componente (sin cambios) ---
  const [formData, setFormData] = useState({
    nombre_usuario: '', correo_electronico: '', telefono: '',
    nombre_real: '', apellidos: '', fecha_nacimiento: '',
    altura_cm: '', peso_kg: '', direccion: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const today = new Date().toISOString().split('T')[0];

  // --- ¡FUNCIÓN REINTRODUCIDA! ---
  /**
   * Bloquea la entrada de teclas no deseadas en inputs numéricos.
   * @param {Event} e El evento de teclado (onKeyDown)
   * @param {boolean} allowDecimal Si es true, permite '.' y ','
   */
  const handleNumericKeyDown = (e, allowDecimal = false) => {
    // Teclas siempre permitidas: Backspace, Tab, Flechas, Supr, Inicio, Fin
    if ([8, 9, 37, 39, 46, 35, 36].includes(e.keyCode)) {
      return;
    }

    // Bloquear 'e', '+', '-' (signo menos)
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
      return;
    }

    // Si NO se permite decimal, bloquear '.' y ','
    if (!allowDecimal && ['.', ','].includes(e.key)) {
      e.preventDefault();
      return;
    }
  };
  // --- FIN FUNCIÓN REINTRODUCIDA ---

  // --- useEffect para mensajes temporales (sin cambios) ---
  useEffect(() => {
    if (error) {
      const errorTimer = setTimeout(() => {
        setError(null);
      }, 5000); 
      return () => clearTimeout(errorTimer);
    }
  }, [error]);

  useEffect(() => {
    if (mensajeExito) {
      const successTimer = setTimeout(() => {
        setMensajeExito(null);
      }, 3000); 
      return () => clearTimeout(successTimer);
    }
  }, [mensajeExito]);

  // --- useEffect para Cargar Datos Iniciales (sin cambios) ---
  useEffect(() => {
    const cargarPerfil = async () => {
      setLoading(true);
      setError(null); 
      setMensajeExito(null); 
      const token = localStorage.getItem('movium_token');

      if (!token) {
        setError("Error de autenticación. Por favor, inicia sesión de nuevo.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost/programacion/TFG/movium/backend/api/get_perfil.php', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.mensaje || 'No se pudo cargar el perfil.');
        }

        setFormData({
          nombre_usuario: data.nombre_usuario || '',
          correo_electronico: data.correo_electronico || '',
          telefono: data.telefono || '',
          nombre_real: data.nombre_real || '',
          apellidos: data.apellidos || '',
          fecha_nacimiento: data.fecha_nacimiento || '',
          altura_cm: data.altura_cm || '',
          peso_kg: data.peso_kg || '',
          direccion: data.direccion || ''
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    cargarPerfil();
  }, []);

  // --- ¡CAMBIO PRINCIPAL AQUÍ! ---
  // --- Manejador de Cambios en Inputs (AHORA CON VALIDACIÓN DE LONGITUD Y FORMATO) ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Limpiar mensajes al escribir
    setError(null);
    setMensajeExito(null);

    // --- REGLAS DE VALIDACIÓN ---

    if (name === 'altura_cm') {
      // onKeyDown ya ha bloqueado '-', 'e', '.' etc.
      // Solo necesitamos preocuparnos por la longitud máxima.
      if (value.length > 3) {
        return; // No actualiza el estado si se excede
      }
      setFormData(prevData => ({ ...prevData, [name]: value }));
      
    } else if (name === 'peso_kg') {
      // onKeyDown ya ha bloqueado '-', 'e', '+'.
      // Solo nos preocupamos por el formato (ej: 123.45) y la longitud.
      
      // Esta regex permite:
      // - Un string vacío
      // - Hasta 3 dígitos enteros (ej: 123)
      // - Hasta 3 dígitos, un punto/coma, y hasta 2 decimales (ej: 123.45)
      const regexPeso = /^(|\d{1,3}([.,]\d{0,2})?)$/;
      
      // Comprobamos la regex Y la longitud total (incluyendo el punto/coma)
      if (regexPeso.test(value) && value.length <= 6) {
        // Estandariza la coma a un punto para el estado
        const standardizedValue = value.replace(',', '.');
        setFormData(prevData => ({ ...prevData, [name]: standardizedValue }));
      }
      // Si no cumple (ej: 70.555 o 1234.5), no actualiza el estado
      // (Evita que escribas el 3er decimal o el 4º dígito entero)

    } else {
      // Comportamiento normal para el resto de inputs (que usan maxLength HTML)
      setFormData(prevData => ({ ...prevData, [name]: value }));
    }
  };
  // --- FIN DEL CAMBIO ---

  // --- Manejador de Envío del Formulario (sin cambios) ---
  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError(null); 
    setMensajeExito(null);
    const token = localStorage.getItem('movium_token');
    
    // Validaciones (sin cambios, ya las tenías)
    try {
      if (formData.correo_electronico && !/\S+@\S+\.\S+/.test(formData.correo_electronico)) {
        throw new Error("Por favor, introduce un formato de correo válido.");
      }
      if (formData.telefono && (formData.telefono.length < 9 || formData.telefono.length > 15 || !/^\d+$/.test(formData.telefono))) {
         throw new Error("El formato del teléfono no es válido (debe tener entre 9 y 15 dígitos numéricos).");
      }
      if (formData.altura_cm && (formData.altura_cm < 50 || formData.altura_cm > 300)) {
         throw new Error("La altura debe estar entre 50 y 300 cm.");
      }
      if (formData.peso_kg && (formData.peso_kg < 30 || formData.peso_kg > 300)) {
         throw new Error("El peso debe estar entre 30 y 300 kg.");
      }
      if (formData.nombre_real && formData.nombre_real.length > 100) {
        throw new Error("El nombre no puede tener más de 100 caracteres.");
      }
       if (formData.apellidos && formData.apellidos.length > 150) {
        throw new Error("Los apellidos no pueden tener más de 150 caracteres.");
      }
       if (formData.direccion && formData.direccion.length > 255) {
        throw new Error("La dirección no puede tener más de 255 caracteres.");
      }

      const dataToSend = { ...formData };
      
      const response = await fetch('http://localhost/programacion/TFG/movium/backend/api/update_perfil.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al guardar el perfil.');
      }
      setMensajeExito(data.mensaje || "Perfil actualizado con éxito.");
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Renderizado Condicional (Loading) ---
  if (loading) {
    return (
      <div className="perfil-container">
        <p className="subtitle" style={{ textAlign: 'center' }}>Cargando perfil...</p>
      </div>
    );
  }

  // --- Renderizado Principal ---
  return (
    <div className="perfil-container">

      {/* Cabecera con Icono y Títulos */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem', gap: '10px' }}>
        <img src={iconoPerfil} alt="" width="64" height="64" />
        <h2>Mi Perfil</h2>
      </div>
      <p className="subtitle" style={{ textAlign: 'center' }}>
        Actualiza tu información personal y de contacto.
       </p>

      {/* Formulario */}
      <form className="perfil-form" onSubmit={handleSubmit}>

        {/* Grid para los campos del formulario */}
        <div className="form-grid-perfil">

          {/* Nombre de Usuario (Deshabilitado) */}
          <div className="form-group-perfil form-span-2">
            <label htmlFor="nombre_usuario">Nombre de Usuario (no se puede cambiar)</label>
             <input
              type="text"
              id="nombre_usuario"
              name="nombre_usuario"
              value={formData.nombre_usuario}
              readOnly
              className="input-disabled"
            />
           </div>

          {/* Correo Electrónico */}
          <div className="form-group-perfil form-span-2">
            <label htmlFor="correo_electronico">Correo Electrónico</label>
            <input
              type="email"
              id="correo_electronico"
              name="correo_electronico"
              value={formData.correo_electronico}
              onChange={handleChange}
              placeholder="tu@correo.com"
              maxLength="100" 
            />
           </div>

                     {/* Nombre Real */}
          <div className="form-group-perfil">
            <label htmlFor="nombre_real">Nombre</label>
           <input
              type="text"
              id="nombre_real"
              name="nombre_real"
              value={formData.nombre_real}
              onChange={handleChange}
              placeholder="Tu nombre"
              maxLength="100" 
            />
          </div>

          {/* Apellidos */}
          <div className="form-group-perfil">
            <label htmlFor="apellidos">Apellidos</label>
            <input
              type="text"
               id="apellidos"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              placeholder="Tus apellidos"
              maxLength="150" 
            />
           </div>

          {/* Teléfono */}
           <div className="form-group-perfil">
            <label htmlFor="telefono">Teléfono</label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
               onChange={handleChange}
              placeholder="Tu número de teléfono"
              minLength="9"
              maxLength="15" 
              pattern="\d*" 
            />
          </div>

        
           {/* Fecha de Nacimiento */}
           <div className="form-group-perfil">
            <label htmlFor="fecha_nacimiento">Fecha de Nacimiento</label>
            <input
              type="date"
              id="fecha_nacimiento"
              name="fecha_nacimiento"
               value={formData.fecha_nacimiento}
              onChange={handleChange}
              max={today} 
            />
          </div>

           {/* Altura */}
           <div className="form-group-perfil">
            <label htmlFor="altura_cm">Altura (cm)</label>
            <input
              type="number" // Mantenemos type="number" por el teclado numérico en móviles
              id="altura_cm"
              name="altura_cm"
               value={formData.altura_cm}
              onChange={handleChange} // ¡Validación al cambiar!
              placeholder="Tu altura"
              min="50" 
              max="300" 
              step="1" 
              onKeyDown={(e) => handleNumericKeyDown(e, false)} // ¡Bloqueo de teclas!
            />
          </div>

           {/* Peso */}
          <div className="form-group-perfil">
            <label htmlFor="peso_kg">Peso (kg)</label>
            <input
              type="number" // Mantenemos type="number"
              id="peso_kg"
              name="peso_kg"
              value={formData.peso_kg}
               onChange={handleChange} // ¡Validación al cambiar!
              placeholder="Tu peso"
              min="30"  
              max="300" 
              step="0.01" 
              onKeyDown={(e) => handleNumericKeyDown(e, true)} // ¡Bloqueo de teclas!
            />
           </div>
           {/* --- FIN DEL CAMBIO --- */}


          {/* Dirección */}
          <div className="form-group-perfil form-span-2">
            <label htmlFor="direccion">Dirección</label>
            <input
              type="text"
              id="direccion"
              name="direccion"
               value={formData.direccion}
              onChange={handleChange}
              placeholder="Tu dirección"
              maxLength="255" 
            />
          </div>

        </div> {/* Fin del form-grid-perfil */}

        {/* --- Zona de Mensajes (sin cambios) --- */}
        <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem', minHeight: '2.5rem' }}> 
          {error && <div className="message">{error}</div>}
          {mensajeExito && <div className="message success">{mensajeExito}</div>}
        </div>
        {/* --- FIN MENSAJES --- */}


        {/* Botón Guardar Cambios */}
        <div className="form-actions-perfil">
          <button type="submit" className="transparent-btn">
             Guardar Cambios
           </button>
        </div>

      </form> {/* Fin del perfil-form */}
    </div> // Fin del perfil-container
  );
}

export default Perfil;