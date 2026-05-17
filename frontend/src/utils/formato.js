export function formatearObjetivo(obj, tipo) {
  if (!obj) return '';

  if (tipo === 'cardio') {
    const metricas = [];
    if (obj.tiempo_min_objetivo) metricas.push(`${obj.tiempo_min_objetivo} min`);
    if (obj.distancia_km_objetivo) metricas.push(`${obj.distancia_km_objetivo} km`);
    return metricas.join(' y ');
  }

  let texto = '';
  if (obj.tipo_rep_objetivo === 'fallo') {
    texto = 'Al Fallo';
  } else if (obj.tipo_rep_objetivo === 'rango') {
    texto = `${obj.reps_min_objetivo || '?'}-${obj.reps_max_objetivo || '?'} reps`;
  } else {
    texto = `${obj.reps_min_objetivo || '?'} reps`;
  }
  if (obj.peso_kg_objetivo != null) texto += ` con ${obj.peso_kg_objetivo} kg`;
  if (obj.descanso_seg_post != null) texto += ` (${obj.descanso_seg_post}s)`;
  return texto;
}

export function formatearTooltip(objetivo, serieReal, tipo) {
  let tooltip = `Objetivo: ${formatearObjetivo(objetivo, tipo)}`;
  if (!serieReal) return tooltip;

  tooltip += '\n---\nRealizado:';
  if (tipo === 'cardio') {
    if (serieReal.tiempo_min_realizado != null) tooltip += ` ${serieReal.tiempo_min_realizado} min`;
    if (serieReal.distancia_km_realizada != null) {
      tooltip += (serieReal.tiempo_min_realizado != null)
        ? ` y ${serieReal.distancia_km_realizada} km`
        : ` ${serieReal.distancia_km_realizada} km`;
    }
  } else {
    tooltip += ` ${serieReal.repeticiones_realizadas ?? '?'} reps`;
    if (serieReal.fue_al_fallo) tooltip += ' (¡Al Fallo!)';
    if (serieReal.peso_kg_usado != null) tooltip += ` con ${serieReal.peso_kg_usado} kg`;
  }
  if (serieReal.notas_serie) tooltip += `\nNotas: ${serieReal.notas_serie}`;
  return tooltip;
}

