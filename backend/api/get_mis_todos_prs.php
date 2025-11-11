<?php
// ---- backend/api/get_mis_todos_prs.php (MODIFICADO para Max Velocidad) ----

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php';
require_once '../vendor/autoload.php';
use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

// --- PASO 1: Validación de Token (Estándar - sin cambios) ---
$secret_key = "k#f9JLz@p7W!bN8^vG2*qR5sT&eD4hX%uY1aC6oP3zM0xQñ"; // Clave secreta para JWT
$jwt = null;
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
$usuario_id = null;
if ($authHeader) {
    $arr = explode(" ", $authHeader);
    $jwt = $arr[1] ?? null;
}
if ($jwt) {
    try {
        $decoded = JWT::decode($jwt, new Key($secret_key, 'HS256'));
        $usuario_id = $decoded->data->id;
    } catch (Exception $e) {
        http_response_code(401); echo json_encode(array("mensaje" => "Acceso denegado. Token inválido.")); die();
    }
} else {
    http_response_code(401); echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token.")); die();
}

// --- PASO 2: Lógica de Consulta (MODIFICADA) ---
$database = new Database();
$db = $database->getConnection();

try {
    // ¡NUEVA CONSULTA CON CÁLCULO DE VELOCIDAD MEDIA MÁXIMA POR EJERCICIO!
    $query_data = "
        WITH MaxRawValues AS (
            -- Subconsulta para obtener máximos de peso, reps, tiempo, distancia por serie
            SELECT
                sr.ejercicio_id,
                MAX(sr.peso_kg_usado) as max_peso,
                MAX(sr.repeticiones_realizadas) as max_reps,
                MAX(sr.tiempo_min_realizado) as max_tiempo,
                MAX(sr.distancia_km_realizada) as max_dist
            FROM
                series_realizadas sr
            JOIN
                sesiones_entrenamiento s ON sr.sesion_id = s.id
            WHERE
                s.usuario_id = :usuario_id_raw -- Usamos un alias diferente aquí
            GROUP BY
                sr.ejercicio_id
        ),
        SessionSpeeds AS (
             -- Subconsulta para calcular velocidad media de CADA sesión para CADA ejercicio
            SELECT
                sr.ejercicio_id,
                s.id as sesion_id,
                ( SUM(sr.distancia_km_realizada) / NULLIF(SUM(sr.tiempo_min_realizado) / 60, 0) ) as velocidad_media_sesion
            FROM series_realizadas sr
            JOIN sesiones_entrenamiento s ON sr.sesion_id = s.id
            WHERE s.usuario_id = :usuario_id_speed -- Y otro alias aquí
              AND sr.tiempo_min_realizado > 0
              AND sr.distancia_km_realizada > 0
            GROUP BY sr.ejercicio_id, s.id -- Agrupamos por ejercicio Y sesión
        ),
        MaxAvgSpeedPerExercise AS (
            -- Subconsulta para encontrar la MÁXIMA velocidad media por ejercicio
            SELECT
                ejercicio_id,
                MAX(velocidad_media_sesion) as max_velocidad_media
            FROM SessionSpeeds
            WHERE velocidad_media_sesion IS NOT NULL
            GROUP BY ejercicio_id
        )
        -- Consulta final que une todo
        SELECT
            e.id as ejercicio_id,
            e.nombre,
            e.tipo,
            e.grupo_muscular,
            raw.max_peso,
            raw.max_reps,
            raw.max_tiempo,
            raw.max_dist,
            -- Añadimos la velocidad media máxima redondeada
            ROUND(max_speed.max_velocidad_media, 1) as max_velocidad_media
        FROM
            ejercicios e
        -- Unimos con los valores máximos directos (peso, reps, etc.)
        LEFT JOIN MaxRawValues raw ON e.id = raw.ejercicio_id
        -- Unimos con la velocidad media máxima calculada
        LEFT JOIN MaxAvgSpeedPerExercise max_speed ON e.id = max_speed.ejercicio_id
        -- Filtramos para mostrar solo ejercicios donde el usuario tenga algún récord registrado
        WHERE
            e.id IN (SELECT DISTINCT ejercicio_id FROM series_realizadas sr JOIN sesiones_entrenamiento s ON sr.sesion_id = s.id WHERE s.usuario_id = :usuario_id_filter)
            AND (raw.max_peso > 0 OR raw.max_reps > 0 OR raw.max_tiempo > 0 OR raw.max_dist > 0 OR max_speed.max_velocidad_media > 0)
        ORDER BY
            e.nombre ASC;
    ";

    $stmt_data = $db->prepare($query_data);
    // Bindeamos el ID del usuario a todos los placeholders necesarios
    $stmt_data->bindParam(":usuario_id_raw", $usuario_id, PDO::PARAM_INT);
    $stmt_data->bindParam(":usuario_id_speed", $usuario_id, PDO::PARAM_INT);
    $stmt_data->bindParam(":usuario_id_filter", $usuario_id, PDO::PARAM_INT);
    $stmt_data->execute();

    $prs = $stmt_data->fetchAll(PDO::FETCH_ASSOC);

    // Convertimos NULL a 0 para consistencia en el frontend si es necesario, aunque quizás sea mejor manejar NULL
     foreach ($prs as &$pr) {
         $pr['max_peso'] = $pr['max_peso'] ?? null;
         $pr['max_reps'] = $pr['max_reps'] ?? null;
         $pr['max_tiempo'] = $pr['max_tiempo'] ?? null;
         $pr['max_dist'] = $pr['max_dist'] ?? null;
         $pr['max_velocidad_media'] = $pr['max_velocidad_media'] ?? null; // Mantenemos null si no hay dato
     }


    http_response_code(200);
    echo json_encode($prs); // Devuelve el array de PRs con la nueva métrica

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error al obtener tus PRs.",
        "error" => $e->getMessage()
    ));
}
?>