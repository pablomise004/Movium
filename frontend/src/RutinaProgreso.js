// Progreso de una rutina - solo graficas

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './RutinaProgreso.css';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { API_BASE_URL } from './configuracion';

function RutinaProgreso() {
  const { id: rutinaId } = useParams();
  const navigate = useNavigate();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [nombreRutina, setNombreRutina] = useState('');
  const [datosGrafica, setDatosGrafica] = useState([]);

  useEffect(() => {
    const cargarProgreso = async () => {
      setCargando(true);
      setError(null);
      const token = localStorage.getItem('movium_token');
      if (!token) { setError("Error de autenticación."); setCargando(false); return; }

      try {
        const res = await fetch(`${API_BASE_URL}get_progreso_rutina.php?id=${rutinaId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.mensaje || "Error al cargar el progreso.");
        setNombreRutina(datos.rutina_info?.nombre || 'Progreso de Rutina');
        setDatosGrafica(datos.grafica || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };
    cargarProgreso();
  }, [rutinaId]);

  if (cargando) return <div className="progreso-container"><p>Cargando...</p></div>;

  if (error) return (
    <div className="progreso-container">
      <button className="btn-volver" onClick={() => navigate('/')}>&larr; Volver</button>
      <p>{error}</p>
    </div>
  );

  const labels = datosGrafica.map(d => 'S' + d.sesion_num);
  const hayDatosFuerza = datosGrafica.some(d => parseFloat(d.volumen_fuerza) > 0);
  const hayDatosCardio = datosGrafica.some(d => parseFloat(d.tiempo_cardio) > 0 || parseFloat(d.distancia_cardio) > 0);

  const chartDataFuerza = {
    labels,
    datasets: [
      { label: 'Volumen (kg)', data: datosGrafica.map(d => d.volumen_fuerza), borderColor: 'rgb(255, 99, 132)', tension: 0.1, pointRadius: 3 },
      { label: 'Reps', data: datosGrafica.map(d => d.reps_totales_fuerza), borderColor: 'rgb(54, 162, 235)', tension: 0.1, pointRadius: 3 }
    ]
  };

  const chartDataCardio = {
    labels,
    datasets: [
      { label: 'Tiempo (min)', data: datosGrafica.map(d => d.tiempo_cardio), borderColor: 'rgb(46, 204, 113)', tension: 0.1, pointRadius: 3 },
      { label: 'Distancia (km)', data: datosGrafica.map(d => d.distancia_cardio), borderColor: 'rgb(153, 102, 255)', tension: 0.1, pointRadius: 3 }
    ]
  };

  const chartOptions = (titulo) => ({
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: titulo }
    },
    scales: { y: { beginAtZero: true } }
  });

  return (
    <div className="progreso-container">
      <button className="btn-volver" onClick={() => navigate('/')}>&larr; Volver al Inicio</button>
      <h2>{nombreRutina}</h2>

      {hayDatosFuerza && (
        <div className="chart-container-progreso">
          <Line options={chartOptions('Evolución de Fuerza')} data={chartDataFuerza} />
        </div>
      )}
      {hayDatosCardio && (
        <div className="chart-container-progreso">
          <Line options={chartOptions('Evolución de Cardio')} data={chartDataCardio} />
        </div>
      )}
      {!hayDatosFuerza && !hayDatosCardio && (
        <p className="no-data-msg">No hay datos suficientes para mostrar gráficas.</p>
      )}
    </div>
  );
}

export default RutinaProgreso;
