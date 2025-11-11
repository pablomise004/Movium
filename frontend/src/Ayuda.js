// ---- frontend/src/Ayuda.js (ACTUALIZADO CON CALENDARIO, COLORES Y FEED) ----

import React from 'react';
import './Ayuda.css';
import iconoAyuda from './assets/ayuda.png';
// Importa el icono de ayuda

function Ayuda() {
  return (
    <div className="ayuda-container">
      {/* --- DIV contenedor para Icono y Título, CENTRADO --- */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '0.5rem', gap: '10px' }}>
        <img src={iconoAyuda} alt="" width="64" height="64" /> {/* Icono 64x64 y ARRIBA */}
        <h2>Guía de Uso y Ayuda</h2> {/* Título CENTRADO */}
      </div>

      <p className="subtitle" style={{ textAlign: 'center' }}>
        Aquí encontrarás explicaciones sobre cómo usar Movium y qué significan algunos términos.
      </p>

      {/* --- SECCIÓN 1: Rutinas --- */}
      <section className="ayuda-seccion">
        <h3>Gestión de Rutinas</h3>
        <p>
          En la pantalla de <b>Inicio</b>, puedes ver todas tus rutinas. Haz clic en <b>"Crear Nueva Rutina"</b> para empezar una desde cero. Solo necesitas
          darle un nombre y opcionalmente indicar qué días la harás o alguna descripción útil.
        </p>
        
        {/* --- PÁRRAFO MODIFICADO (COLORES Y ORDEN) --- */}
        <p>
          Para <b>editar</b> una rutina existente, haz clic en el icono del lápiz ✏️ en la tarjeta de la rutina en Inicio.
          Una vez dentro, podrás modificar su información:
        </p>
        <ul style={{ lineHeight: '1.7' }}>
            <li><b>Nombre/Descripción:</b> El nombre principal y su descripción (ej: "Lunes y Jueves").</li>
            <li><b>Orden en Inicio:</b> Un número para priorizarla. La rutina con orden "1" saldrá primero en la pantalla de Inicio.</li>
            <li><b>Color de Tarjeta:</b> ¡Importante! Puedes asignarle un <strong>color personalizado</strong> (ej: rojo para pierna, azul para pecho). Así puedes personalizar el Inicio y se usará en el <strong>Calendario del Historial</strong> para ver qué días has entrenado esa rutina de un vistazo.</li>
        </ul>
        <p>
          Desde esta vista también podrás añadir o quitar ejercicios.
        </p>
        {/* --- FIN DE MODIFICACIÓN --- */}

        <h4>¿Cuándo entrenaste por última vez?</h4>
        <p>
          En cada rutina en la pantalla de Inicio, verás rápidamente cuándo fue la última vez que registraste un entrenamiento para ella.
          Las fechas recientes se mostrarán como <b>"Hoy"</b>, <b>"Ayer"</b> o el <b>día de la semana pasado</b> (ej: "Miércoles pasado").
          Si ha pasado una semana o más, verás la <b>fecha completa</b> (ej: 20/10/2025).
          Si una rutina nunca ha sido entrenada, indicará <b>"Nunca entrenada"</b>.
        </p>
      </section>

      {/* --- SECCIÓN 2: Ejercicios y Series --- */}
      <section className="ayuda-seccion">
        <h3>Añadir Ejercicios y Series</h3>
        <p>
          Dentro de la edición de una rutina, verás un formulario para <b>"Añadir Ejercicio"</b>.
          Primero, selecciona un ejercicio de la <b>lista completa de ejercicios</b> (puedes buscar por nombre o filtrar por grupo muscular).
        </p>
        <p>
          Luego, define el <b>objetivo</b> para ese ejercicio:
        </p>
        <ul>
          <li>
            <b>Fuerza/Calistenia:</b> Añade una o varias series.
            Para cada serie, puedes definir:
            <ul>
              <li><b>Tipo de Reps:</b> Fijo (un número exacto), Rango (mínimo-máximo) o Al Fallo.</li>
              <li><b>Reps:</b> El número o rango objetivo.</li>
              <li><b>Peso:</b> El peso en kg que planeas usar.</li>
              <li><b>Descanso (opcional):</b> El tiempo en
                segundos a descansar <i>después</i> de esa serie.</li>
            </ul>
            Haz clic en "Añadir Serie" para agregarla a la lista temporal y luego en "Guardar Ejercicio".
          </li>
          <li>
            <b>Cardio:</b> Define un objetivo de Tiempo (minutos) y Distancia (km).
            También puedes añadir un descanso posterior. Aquí puedes añadir intervalos.
          </li>
        </ul>
        <p>
          Puedes <b>editar</b> o <b>borrar</b> ejercicios ya añadidos a la rutina usando los botones correspondientes en la tabla inferior.
          Al editar, podrás cambiar el orden del ejercicio en la rutina y modificar/añadir/borrar sus series objetivo.
        </p>
        <h4>¿Dudas sobre un ejercicio?</h4>
        <p>
          Si no estás seguro de cómo se realiza un ejercicio o qué músculos trabaja, consulta la <b>"Lista de Ejercicios y Descripciones"</b> más abajo en esta guía.
          ¡Te ayudará a elegir correctamente!
        </p>
      </section>

      {/* --- SECCIÓN 3: Entrenar --- */}
      <section className="ayuda-seccion">
        <h3>Registrar un Entrenamiento</h3>
        <p>
          Desde la pantalla de <b>Inicio</b>, haz clic en el botón <b>"Entrenar"</b> de la rutina que quieras realizar.
          Esto te llevará a la pantalla de sesión.
        </p>
        <p>
          Verás la lista de ejercicios planificados.
          Para cada serie:
        </p>
        <ul>
          <li>Haz clic en el <b>círculo (✓)</b> para marcarla como completada con los valores objetivo.</li>
          <li>Haz clic en el <b>lápiz (✏️)</b> para abrir un modal donde puedes registrar los valores <i>reales</i> que hiciste (reps, peso, si fue al fallo, tiempo, distancia) y añadir notas específicas para esa serie.</li>
        </ul>
        <p>
          Cuando termines todos los ejercicios (o los que vayas a hacer ese día), pulsa <b>"Finalizar Entrenamiento"</b>.
          Se mostrará un resumen. Puedes añadir notas generales para la sesión completa y luego confirmar para guardar tu progreso.
        </p>
      </section>

      {/* --- NUEVA SECCIÓN: HISTORIAL (CALENDARIO) --- */}
      <section className="ayuda-seccion">
        <h3>Calendario</h3>
        <p>
          Accesible desde el <strong>icono de calendario</strong> en <b>Inicio</b>, esta pantalla te ofrece una vista de calendario de todos tus entrenamientos.
        </p>
        <h4>¿Cómo funciona?</h4>
        <ul>
          <li>Cada día que hayas registrado un entrenamiento aparecerá marcado con un punto de color.</li>
          <li>El color del punto corresponde al <strong>color que asignaste a la rutina</strong> que entrenaste ese día (puedes asignarlo al editar la rutina).</li>
          <li>Si entrenaste más de una rutina (ej: mañana y tarde), verás verás tantos puntos como rutinas hayas entrenado en ese día.</li>
          <li><strong>Importante:</strong> Si una rutina no tiene un color asignado, sus entrenamientos aparecerán en el calendario con un <strong>punto de color gris</strong>.</li>
          <li>Al <strong>hacer clic en un día marcado</strong>, se desplegará debajo un resumen detallado de todas las sesiones que completaste ese día, incluyendo cada ejercicio y serie registrada.</li>
        </ul>
      </section>
      {/* --- FIN NUEVA SECCIÓN --- */}

      {/* --- SECCIÓN 4: Progreso y Estadísticas (REESCRITA) --- */}
      <section className="ayuda-seccion">
        <h3>Progreso (por Rutina) y Estadísticas (PRs)</h3>

        <h4>Progreso por Rutina</h4>
        <p>
          En la pantalla de <b>Inicio</b>, haz clic en el botón <b>"Progreso"</b> de una rutina para acceder a su historial detallado (diferente del calendario general).
          Aquí encontrarás:
        </p>
        <ul>
            <li><b>Gráficas de Evolución:</b> Visualiza cómo has progresado en volumen total, repeticiones, tiempo, etc., a lo largo de las últimas sesiones <b>para esa rutina específica</b>.</li>
            <li><b>Historial Detallado de Sesiones:</b> Una lista de todas las sesiones que has completado para esa rutina, ordenadas de la más reciente a la más antigua.</li>
        </ul>

        <h4>Entendiendo el Historial de Sesiones (en "Progreso" y "Calendario")</h4>
        <p>
          En la cabecera de cada sesión registrada en el historial, verás unos iconos con resúmenes rápidos:
        </p>
        <ul>
          <li><b>🕒 Tiempo Total:</b> Indica la duración completa de la sesión de entrenamiento.</li>
          <li><b>🏋️ Volumen Total (Fuerza):</b> Representa el peso total levantado (Peso x Repeticiones de cada serie).</li>
          <li><b>Importante:</b> Si marcas una serie "Al Fallo" pero no indicas cuántas repeticiones hiciste, esas repeticiones no se sumarán al volumen total. ¡Es recomendable registrar las reps hechas!</li>
          <li><b>⏱️ Tiempo Total (Cardio):</b> Suma de todos los minutos registrados en cardio.</li>
          <li><b>📍 Distancia Total (Cardio):</b> Suma de todos los kilómetros registrados en cardio.</li>
          <li><b>📝 Nota:</b> Este icono aparece si añadiste algún comentario a la sesión. Pulsa sobre él para ver la nota.</li>
          <li><b><span className="ayuda-fallo-tag">F</span> (Al Fallo):</b> Esta etiqueta azul aparece junto a una serie si la marcaste como realizada "Al Fallo".</li>
        </ul>

        <h4>Estadísticas (PRs y Rankings)</h4>
        <p>
          La sección <b>"Estadísticas"</b>, accesible desde el menú lateral, centraliza tus mejores marcas y te permite compararte con amigos. Se divide en dos pestañas:
        </p>
        <ul>
            <li>
                <b>Mis PRs:</b> Aquí puedes ver <b>todos tus Récords Personales (PRs)</b> históricos para cada ejercicio que has registrado alguna vez (Mayor Peso, Máximas Reps, etc.). Puedes usar los filtros para encontrar un ejercicio específico.
            </li>
            <li>
                <b>Rankings de Amigos:</b> Esta pestaña te permite comparar tus récords con los de tus amigos. Verás rankings para ejercicios clave (Press de Banca, Sentadilla...) y un botón para seleccionar cualquier otro ejercicio y ver un ranking específico.
            </li>
        </ul>
      </section>

      {/* --- SECCIÓN: Comunidad y Amigos (MODIFICADA) --- */}
      <section className="ayuda-seccion">
        <h3>Comunidad y Amigos</h3>
        <p>
          La sección <b>"Comunidad"</b>, accesible desde el menú lateral, te permite conectar con otros usuarios de Movium.
        </p>
        
        {/* --- NUEVA SUB-SECCIÓN FEED --- */}
        <h4>Feed de Actividad</h4>
        <p>
          Al entrar en Comunidad, verás un <strong>botón con el icono de 'feed'</strong> en la esquina superior derecha.
        </p>
        <p>
          Esta pantalla te muestra, en orden cronológico, las últimas sesiones de entrenamiento que <strong>tus amigos</strong> han completado. Es una forma fantástica de ver qué están entrenando y mantener la motivación.
        </p>
        <p>
          Puedes pulsar <strong>"Ver Detalles"</strong> en una actividad del feed para ver un desglose de los ejercicios y series que registraron.
        </p>
        {/* --- FIN NUEVA SUB-SECCIÓN --- */}

        <h4>Mis Amigos</h4>
        <p>
          La pestaña <b>"Mis Amigos"</b> muestra una lista de todos los usuarios con los que has conectado.
          Desde aquí puedes:
        </p>
        <ul>
          <li>Ver rápidamente quién te añadió a ti y a quién añadiste tú.</li>
          <li>Hacer clic en <b>"Ver PRs"</b> para consultar los récords personales de un amigo.</li>
          <li><b>Eliminar</b> a un amigo de tu lista (esta acción es mutua).</li>
        </ul>

        <h4>Buscar Usuarios</h4>
        <p>
          Usa la pestaña <b>"Buscar Usuarios"</b> para encontrar a otros miembros por su nombre de usuario.
        </p>
        {/* --- PÁRRAFO MODIFICADO (SIN EMOJI 🔍) --- */}
        <p>
          Escribe al menos dos caracteres en la barra de búsqueda y pulsa Enter o haz clic en el <strong>icono de la lupa</strong>.
        </p>
        {/* --- FIN MODIFICACIÓN --- */}
        <ul>
          <li>En los resultados, verás si ya eres amigo de alguien.</li>
          <li>Puedes <b>"Añadir Amigo"</b> si aún no lo eres.</li>
          <li>También puedes <b>"Eliminar Amigo"</b> directamente desde los resultados.</li>
        </ul>
      </section>

      {/* --- SECCIÓN: Perfil --- */}
      <section className="ayuda-seccion">
        <h3>Tu Perfil y Cuenta</h3>
        <p>
          Desde el menú lateral, puedes acceder a la sección <b>"Perfil"</b> para ver y actualizar tu información personal (nombre, fecha de nacimiento, altura, peso, etc.).
        </p>
        <p>
          <b>¡Importante!</b> Si añades tu <b>correo electrónico</b> en el perfil, podrás usarlo como alternativa a tu nombre de usuario para <b>iniciar sesión</b>.
          Esto es útil si alguna vez olvidas tu nombre de usuario exacto.
        </p>
        <p>
          Recuerda que tu nombre de usuario no se puede cambiar una vez registrado.
        </p>
      </section>

      {/* --- SECCIÓN: Conceptos Técnicos --- */}
      <section className="ayuda-seccion">
        <h3>Conceptos Clave</h3>
        <dl>
          <dt>PR (Personal Record)</dt>
          <dd>Tu mejor marca personal registrada para un ejercicio específico (ej: máximo peso, máximas repeticiones, mayor distancia).</dd>

          <dt>e1RM (estimated 1 Repetition Maximum)</dt>
          <dd>
            Máximo Estimado para 1 Repetición.
            Es una fórmula que <i>estima</i> cuál sería el peso máximo que podrías levantar para una sola repetición, basándose en el peso y las repeticiones de una serie que ya hiciste.
            Utilizamos esta métrica en los rankings de amigos porque permite hacer una <b>comparación de fuerza más justa</b>.
            La fórmula que usamos es la de Epley:
            <br />
            <code>e1RM = Peso * (1 + Repeticiones / 30)</code>
          </dd>

          <dt>Serie al Fallo</dt>
          <dd>Una serie llevada hasta el punto en que no puedes completar ni una repetición más con buena forma.</dd>

          <dt>Volumen (en Fuerza)</dt>
          <dd>
            Es una medida del trabajo total realizado en un ejercicio o sesión.
            Generalmente se calcula multiplicando el peso levantado por las repeticiones realizadas y por el número de series.
            <br />
            <code>Volumen = Peso * Repeticiones * Series</code>
          </dd>
        </dl>
      </section>
      
      {/* --- SECCIÓN: Lista de Ejercicios CON GRUPO MUSCULAR (COMPLETA) --- */}
      <section className="ayuda-seccion">
        <h3>Lista de Ejercicios y Descripciones</h3>
        <p>Aquí tienes una lista de los ejercicios disponibles en la aplicación, su grupo muscular principal y una breve descripción</p>
        <dl className="lista-ejercicios-descripcion">
          {/* PECHO */}
          <dt>Press de Banca con Barra <span className="ejercicio-grupo-tag">Pecho</span></dt>
          <dd>Acostado en un banco plano, bajar la barra al pecho y empujar hacia arriba.</dd>
          <dt>Press de Banca Inclinado con Barra <span className="ejercicio-grupo-tag">Pecho</span></dt>
          <dd>En un banco inclinado, bajar la barra a la parte superior del pecho y empujar.</dd>
          <dt>Press de Banca Declinado con Barra <span className="ejercicio-grupo-tag">Pecho</span></dt>
          <dd>En un banco declinado, bajar la barra a la parte inferior del pecho.</dd>
          <dt>Press de Banca con Mancuernas <span className="ejercicio-grupo-tag">Pecho</span></dt>
          <dd>Acostado en un banco plano, bajar las mancuernas a los lados del pecho.</dd>
          <dt>Press Inclinado con Mancuernas <span className="ejercicio-grupo-tag">Pecho</span></dt>
          <dd>En un banco inclinado, bajar las mancuernas a los lados del pecho.</dd>
          <dt>Aperturas con Mancuernas <span className="ejercicio-grupo-tag">Pecho</span></dt>
          <dd>Acostado en un banco plano, abrir y cerrar los brazos con una ligera flexión de codo.</dd>
          <dt>Aperturas en Cable (Cruce de Poleas) <span className="ejercicio-grupo-tag">Pecho</span></dt>
          <dd>De pie, cruzar las poleas por delante del pecho contrayendo los pectorales.</dd>
          <dt>Fondos en Paralelas (Dips) <span className="ejercicio-grupo-tag">Pecho</span></dt>
          <dd>Suspender el cuerpo en barras paralelas y bajar flexionando los codos. (Enfocado a pecho inclinándose).</dd>
          <dt>Flexiones (Push-ups) <span className="ejercicio-grupo-tag">Pecho</span></dt>
          <dd>Tumbado boca abajo, empujar el suelo para levantar el cuerpo.</dd>
          <dt>Pullover con Mancuerna <span className="ejercicio-grupo-tag">Pecho</span></dt>
          <dd>Acostado transversalmente en un banco, bajar una mancuerna por detrás de la cabeza.</dd>

          {/* ESPALDA */}
          <dt>Dominadas (Pull-ups) <span className="ejercicio-grupo-tag">Espalda</span></dt>
          <dd>Colgado de una barra, subir el cuerpo hasta que la barbilla la supere (agarre prono).</dd>
          <dt>Dominadas Agarre Neutro/Supino (Chin-ups) <span className="ejercicio-grupo-tag">Espalda</span></dt>
          <dd>Colgado de una barra, subir el cuerpo (agarre neutro o supino, enfoca más bíceps).</dd>
          <dt>Jalón al Pecho (Lat Pulldown) <span className="ejercicio-grupo-tag">Espalda</span></dt>
          <dd>Sentado, tirar de una barra hacia la parte superior del pecho, simulando una dominada.</dd>
          <dt>Remo con Barra (Barbell Row) <span className="ejercicio-grupo-tag">Espalda</span></dt>
          <dd>Inclinado con espalda recta, tirar de la barra hacia el abdomen.</dd>
          <dt>Remo con Mancuerna (Dumbbell Row) <span className="ejercicio-grupo-tag">Espalda</span></dt>
          <dd>Apoyado en un banco, remar con una mancuerna con un solo brazo.</dd>
          <dt>Remo en Punta (T-Bar Row) <span className="ejercicio-grupo-tag">Espalda</span></dt>
          <dd>Usando una barra T, tirar del peso hacia el pecho.</dd>
          <dt>Remo Sentado en Máquina (Gironda) <span className="ejercicio-grupo-tag">Espalda</span></dt>
          <dd>Sentado con las piernas apoyadas, tirar de un agarre (V o ancho) hacia el abdomen.</dd>
          <dt>Peso Muerto (Deadlift) <span className="ejercicio-grupo-tag">Espalda</span></dt>
          <dd>Levantar la barra del suelo hasta estar erguido, con la espalda recta. (Implica pierna y espalda).</dd>
          <dt>Hiperextensiones (Back Extensions) <span className="ejercicio-grupo-tag">Lumbar</span></dt>
          <dd>En un banco de hiperextensiones, flexionar y extender la cadera.</dd>

          {/* PIERNA */}
          <dt>Sentadilla con Barra (Squat) <span className="ejercicio-grupo-tag">Pierna</span></dt>
          <dd>Con la barra en la espalda, bajar la cadera por debajo de las rodillas y subir.</dd>
          <dt>Sentadilla Frontal (Front Squat) <span className="ejercicio-grupo-tag">Pierna</span></dt>
          <dd>Con la barra en los hombros (delante), bajar la cadera. Enfoca más cuádriceps.</dd>
          <dt>Prensa de Piernas (Leg Press) <span className="ejercicio-grupo-tag">Pierna</span></dt>
          <dd>Sentado en la máquina, empujar la plataforma con las piernas.</dd>
          <dt>Zancadas (Lunges) con Mancuerna <span className="ejercicio-grupo-tag">Pierna</span></dt>
          <dd>Dar un paso adelante y flexionar ambas rodillas a 90 grados.</dd>
          <dt>Sentadilla Búlgara <span className="ejercicio-grupo-tag">Pierna</span></dt>
          <dd>Con un pie elevado detrás, hacer una sentadilla con la pierna delantera.</dd>
          <dt>Extensión de Cuádriceps (Quad Extension) <span className="ejercicio-grupo-tag">Pierna</span></dt>
          <dd>Sentado, extender las piernas contra la resistencia de la máquina.</dd>
          <dt>Curl Femoral Tumbado <span className="ejercicio-grupo-tag">Femoral</span></dt>
          <dd>Tumbado boca abajo, flexionar las rodillas para llevar los talones al glúteo.</dd>
          <dt>Curl Femoral Sentado <span className="ejercicio-grupo-tag">Femoral</span></dt>
          <dd>Sentado, flexionar las rodillas contra la resistencia.</dd>
          <dt>Peso Muerto Rumano (RDL) <span className="ejercicio-grupo-tag">Femoral</span></dt>
          <dd>Bajar la barra con las piernas casi rectas, enfocando el estiramiento del femoral.</dd>
          <dt>Hip Thrust <span className="ejercicio-grupo-tag">Glúteo</span></dt>
          <dd>Con la espalda apoyada en un banco, levantar la cadera con una barra.</dd>
          <dt>Patada de Glúteo en Polea <span className="ejercicio-grupo-tag">Glúteo</span></dt>
          <dd>Dar una patada hacia atrás con una polea atada al tobillo.</dd>
          <dt>Elevación de Gemelos de Pie <span className="ejercicio-grupo-tag">Gemelo</span></dt>
          <dd>Ponerse de puntillas contra una resistencia (máquina o peso).</dd>
          <dt>Elevación de Gemelos Sentado <span className="ejercicio-grupo-tag">Gemelo</span></dt>
          <dd>Sentado, ponerse de puntillas contra la resistencia.</dd>

          {/* HOMBRO */}
          <dt>Press Militar con Barra (Overhead Press) <span className="ejercicio-grupo-tag">Hombro</span></dt>
          <dd>De pie o sentado, empujar la barra desde los hombros por encima de la cabeza.</dd>
          <dt>Press Militar con Mancuernas <span className="ejercicio-grupo-tag">Hombro</span></dt>
          <dd>Sentado, empujar las mancuernas desde los hombros por encima de la cabeza.</dd>
          <dt>Press Arnold <span className="ejercicio-grupo-tag">Hombro</span></dt>
          <dd>Un press con mancuernas que incluye una rotación de muñeca.</dd>
          <dt>Elevaciones Laterales con Mancuerna <span className="ejercicio-grupo-tag">Hombro</span></dt>
          <dd>Levantar mancuernas hacia los lados hasta la altura de los hombros.</dd>
          <dt>Elevaciones Laterales en Polea <span className="ejercicio-grupo-tag">Hombro</span></dt>
          <dd>Usando una polea baja, elevar el brazo lateralmente.</dd>
          <dt>Elevaciones Frontales (Front Raises) <span className="ejercicio-grupo-tag">Hombro</span></dt>
          <dd>Levantar mancuernas o un disco hacia el frente.</dd>
          <dt>Pájaros (Reverse Flyes) <span className="ejercicio-grupo-tag">Hombro</span></dt>
          <dd>Inclinado, abrir los brazos para trabajar la parte posterior del hombro.</dd>
          <dt>Encogimientos (Shrugs) con Barra <span className="ejercicio-grupo-tag">Trapecio</span></dt>
          <dd>Encoger los hombros hacia las orejas sosteniendo una barra pesada.</dd>

          {/* BÍCEPS */}
          <dt>Curl de Bíceps con Barra <span className="ejercicio-grupo-tag">Bíceps</span></dt>
          <dd>De pie, flexionar los codos para levantar la barra.</dd>
          <dt>Curl de Bíceps con Mancuernas (Alterno) <span className="ejercicio-grupo-tag">Bíceps</span></dt>
          <dd>De pie o sentado, flexionar los codos alternando los brazos.</dd>
          <dt>Curl Martillo (Hammer Curl) <span className="ejercicio-grupo-tag">Bíceps</span></dt>
          <dd>Curl con agarre neutro (palmas enfrentadas), trabaja más el braquial.</dd>
          <dt>Curl Predicador (Scott Curl) <span className="ejercicio-grupo-tag">Bíceps</span></dt>
          <dd>Apoyando el brazo en un banco Scott, flexionar el codo.</dd>
          <dt>Curl de Concentración <span className="ejercicio-grupo-tag">Bíceps</span></dt>
          <dd>Sentado, apoyar el codo en el muslo y flexionar.</dd>

          {/* TRÍCEPS */}
          <dt>Fondos de Tríceps (en banco) <span className="ejercicio-grupo-tag">Tríceps</span></dt>
          <dd>De espaldas a un banco, bajar y subir el cuerpo con las manos apoyadas.</dd>
          <dt>Press Francés (Skullcrushers) <span className="ejercicio-grupo-tag">Tríceps</span></dt>
          <dd>Acostado, bajar una barra Z o mancuernas hacia la frente y extender.</dd>
          <dt>Extensión de Tríceps en Polea (Cuerda) <span className="ejercicio-grupo-tag">Tríceps</span></dt>
          <dd>En una polea alta, extender los codos hacia abajo usando una cuerda.</dd>
          <dt>Extensión de Tríceps en Polea (Barra V) <span className="ejercicio-grupo-tag">Tríceps</span></dt>
          <dd>En una polea alta, extender los codos hacia abajo usando una barra V.</dd>
          <dt>Patada de Tríceps (Tricep Kickback) <span className="ejercicio-grupo-tag">Tríceps</span></dt>
          <dd>Inclinado, extender el codo hacia atrás con una mancuerna.</dd>

          {/* ABDOMEN */}
          <dt>Crunch Abdominal <span className="ejercicio-grupo-tag">Abdomen</span></dt>
          <dd>Acostado, contraer el abdomen para levantar los hombros del suelo.</dd>
          <dt>Plancha (Plank) <span className="ejercicio-grupo-tag">Abdomen</span></dt>
          <dd>Mantener una posición recta apoyado en antebrazos y pies.</dd>
          <dt>Elevación de Piernas Colgado <span className="ejercicio-grupo-tag">Abdomen</span></dt>
          <dd>Colgado de una barra, levantar las piernas (rectas o flexionadas).</dd>
          <dt>Rueda Abdominal (Ab Wheel) <span className="ejercicio-grupo-tag">Abdomen</span></dt>
          <dd>Arrodillado, deslizar una rueda hacia adelante y volver.</dd>
          <dt>Russian Twist <span className="ejercicio-grupo-tag">Abdomen</span></dt>
          <dd>Sentado en V, girar el torso de un lado a otro (con o sin peso).</dd>

          {/* CARDIO */}
          <dt>Cinta - Correr <span className="ejercicio-grupo-tag">Cardio</span></dt>
          <dd>Correr a una velocidad constante o en intervalos en la cinta.</dd>
          <dt>Cinta - Caminar Inclinado <span className="ejercicio-grupo-tag">Cardio</span></dt>
          <dd>Caminar a buen ritmo en la cinta con una inclinación elevada.</dd>
          <dt>Bicicleta Estática <span className="ejercicio-grupo-tag">Cardio</span></dt>
          <dd>Pedalear en una bicicleta estática, ajustando resistencia y velocidad.</dd>
          <dt>Elíptica <span className="ejercicio-grupo-tag">Cardio</span></dt>
          <dd>Simular un movimiento de carrera/esquí en la máquina elíptica.</dd>
          <dt>Máquina de Remo (Rowing) <span className="ejercicio-grupo-tag">Cardio</span></dt>
          <dd>Simular el movimiento de remo, trabajando todo el cuerpo.</dd>
          <dt>Saltar a la Cuerda (Comba) <span className="ejercicio-grupo-tag">Cardio</span></dt>
          <dd>Saltar a la comba a diferentes ritmos.</dd>
        </dl>
      </section>

    </div>
  );
}

export default Ayuda;