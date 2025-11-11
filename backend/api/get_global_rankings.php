<?php
// ---- backend/api/get_global_rankings.php (CORREGIDO) ----

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php';
require_once '../vendor/autoload.php';
use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

// --- PASO 1: Validación de Token (Estándar) ---
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
        http_response_code(401);
        echo json_encode(array("mensaje" => "Acceso denegado. Token inválido.")); die();
    }
} else {
    http_response_code(401);
    echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token.")); die();
}

// --- PASO 2: IDs de Ejercicios Clave (FUERZA) y Nombre (CARDIO) ---
$ID_BANCA = 1;       // 'Press de Banca con Barra' (Asumimos ID fijo)
$ID_SENTADILLA = 20; // 'Sentadilla con Barra (Squat)' (Asumimos ID fijo)
$ID_PESO_MUERTO = 18;// 'Peso Muerto (Deadlift)' (Asumimos ID fijo)
// ¡CAMBIO! Usamos nombre para cardio
$NOMBRE_CORRER = 'Cinta - Correr';

$mi_id = $usuario_id;
$database = new Database();
$db = $database->getConnection();

// --- PASO 3: Lógica de Ranking ---
try {

    // 3a. Obtener la lista de IDs (Amigos + Tú)
    $query_amigos = "SELECT amigo_id FROM amistades WHERE usuario_id = :mi_id";
    $stmt_amigos = $db->prepare($query_amigos);
    $stmt_amigos->bindParam(":mi_id", $mi_id, PDO::PARAM_INT);
    $stmt_amigos->execute();
    $lista_ids_usuarios = $stmt_amigos->fetchAll(PDO::FETCH_COLUMN, 0);
    $lista_ids_usuarios[] = $mi_id; // Añadimos nuestro propio ID

    // 3b. Crear placeholders (?) para las consultas "IN (...)"
    // Prevenir error si no hay amigos (lista_ids_usuarios solo tendría 1 elemento)
    if (count($lista_ids_usuarios) == 0) {
        // Devuelve respuesta vacía si no hay usuario (imposible por token) o amigos
        http_response_code(200);
        echo json_encode([
            "press_banca" => [], "sentadilla" => [], "peso_muerto" => [],
            "max_distancia" => [], "max_tiempo" => [], "max_velocidad_media" => []
        ]);
        exit();
    }
    $placeholders = str_repeat('?,', count($lista_ids_usuarios) - 1) . '?';

    // 3c. Preparamos el array de respuesta
    $respuesta = [
        "press_banca" => [],
        "sentadilla" => [],
        "peso_muerto" => [],
        "max_distancia" => [],
        "max_tiempo" => [],
        "max_velocidad_media" => []
    ];

    // -----------------------------------------------------------------
    // FUNCIÓN AUXILIAR (Helper) para no repetir código de Fuerza (MODIFICADA)
    // -----------------------------------------------------------------
    function getRankingFuerza($db, $ejercicio_id, $lista_ids, $placeholders) {
        // Busca el MAX(peso_kg_usado) para un ejercicio dado
        // ¡CAMBIO! Añadimos u.id y lo incluimos en GROUP BY
        $sql = "SELECT
                    u.id as usuario_id, -- <<< AÑADIDO
                    u.nombre_usuario,
                    MAX(sr.peso_kg_usado) as valor
                FROM series_realizadas sr
                JOIN sesiones_entrenamiento s ON sr.sesion_id = s.id
                JOIN usuarios u ON s.usuario_id = u.id
                WHERE
                    sr.ejercicio_id = ?
                    AND s.usuario_id IN ($placeholders)
                    AND sr.peso_kg_usado > 0
                GROUP BY s.usuario_id, u.id, u.nombre_usuario -- <<< u.id AÑADIDO
                ORDER BY valor DESC
                LIMIT 3";

        $stmt = $db->prepare($sql);
        $params = array_merge([$ejercicio_id], $lista_ids);
        $stmt->execute($params);
        $ranking = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Añadimos el 'label' (kg) al resultado
        foreach ($ranking as &$item) {
            $item['label'] = 'kg';
            // Asegurarse de que el valor es numérico para JSON
            $item['valor'] = is_numeric($item['valor']) ? (float)$item['valor'] : $item['valor'];
        }
        return $ranking;
    }
    // -----------------------------------------------------------------

    // 3d. Consultas de Fuerza (Usan la función auxiliar modificada)
    $respuesta["press_banca"] = getRankingFuerza($db, $ID_BANCA, $lista_ids_usuarios, $placeholders);
    $respuesta["sentadilla"] = getRankingFuerza($db, $ID_SENTADILLA, $lista_ids_usuarios, $placeholders);
    $respuesta["peso_muerto"] = getRankingFuerza($db, $ID_PESO_MUERTO, $lista_ids_usuarios, $placeholders);

    // 3e. Consultas de Cardio (MODIFICADAS)

    // ¡CAMBIO! Los parámetros ahora usan el nombre del ejercicio
    $params_correr = array_merge([$NOMBRE_CORRER], $lista_ids_usuarios);

    // Max Distancia (MODIFICADA: usa nombre, añade u.id)
    $sql_dist = "SELECT
                    u.id as usuario_id, -- <<< AÑADIDO
                    u.nombre_usuario,
                    MAX(sr.distancia_km_realizada) as valor
                 FROM series_realizadas sr
                 JOIN sesiones_entrenamiento s ON sr.sesion_id = s.id
                 JOIN usuarios u ON s.usuario_id = u.id
                 JOIN ejercicios e ON sr.ejercicio_id = e.id -- <<< JOIN AÑADIDO
                 WHERE e.nombre = ? -- <<< CAMBIO A NOMBRE
                   AND s.usuario_id IN ($placeholders)
                   AND sr.distancia_km_realizada > 0
                 GROUP BY s.usuario_id, u.id, u.nombre_usuario -- <<< u.id AÑADIDO
                 ORDER BY valor DESC LIMIT 3";
    $stmt_dist = $db->prepare($sql_dist);
    $stmt_dist->execute($params_correr); // Usamos los nuevos params
    $ranking_dist = $stmt_dist->fetchAll(PDO::FETCH_ASSOC);
    foreach ($ranking_dist as &$item) {
        $item['label'] = 'km';
        $item['valor'] = is_numeric($item['valor']) ? (float)$item['valor'] : $item['valor'];
    }
    $respuesta["max_distancia"] = $ranking_dist;

    // Max Tiempo (MODIFICADA: usa nombre, añade u.id)
    $sql_tiempo = "SELECT
                       u.id as usuario_id, -- <<< AÑADIDO
                       u.nombre_usuario,
                       MAX(sr.tiempo_min_realizado) as valor
                   FROM series_realizadas sr
                   JOIN sesiones_entrenamiento s ON sr.sesion_id = s.id
                   JOIN usuarios u ON s.usuario_id = u.id
                   JOIN ejercicios e ON sr.ejercicio_id = e.id -- <<< JOIN AÑADIDO
                   WHERE e.nombre = ? -- <<< CAMBIO A NOMBRE
                     AND s.usuario_id IN ($placeholders)
                     AND sr.tiempo_min_realizado > 0
                   GROUP BY s.usuario_id, u.id, u.nombre_usuario -- <<< u.id AÑADIDO
                   ORDER BY valor DESC LIMIT 3";
    $stmt_tiempo = $db->prepare($sql_tiempo);
    $stmt_tiempo->execute($params_correr); // Reutilizamos los params
    $ranking_tiempo = $stmt_tiempo->fetchAll(PDO::FETCH_ASSOC);
    foreach ($ranking_tiempo as &$item) {
        $item['label'] = 'min';
        $item['valor'] = is_numeric($item['valor']) ? (float)$item['valor'] : $item['valor'];
    }
    $respuesta["max_tiempo"] = $ranking_tiempo;

    // 3f. Consulta de Velocidad Media (MODIFICADA: usa nombre, añade u.id)

    // ¡CAMBIO! Los parámetros se invierten y usan nombre
    $params_velocidad = array_merge($lista_ids_usuarios, [$NOMBRE_CORRER]);

    $sql_velocidad = "
        WITH SesionesCardio AS (
            SELECT
                s.usuario_id,
                s.id as sesion_id,
                (
                    SUM(sr.distancia_km_realizada) /
                    NULLIF(SUM(sr.tiempo_min_realizado) / 60, 0)
                ) as velocidad_media_sesion
            FROM
                sesiones_entrenamiento s
            JOIN
                series_realizadas sr ON s.id = sr.sesion_id
            JOIN
                ejercicios e ON sr.ejercicio_id = e.id -- <<< JOIN AÑADIDO
            WHERE
                s.usuario_id IN ($placeholders)
                AND e.nombre = ? -- <<< CAMBIO A NOMBRE
                AND sr.tiempo_min_realizado > 0
                AND sr.distancia_km_realizada > 0
            GROUP BY
                s.usuario_id, s.id
        )
        SELECT
            u.id as usuario_id, -- <<< AÑADIDO
            u.nombre_usuario,
            MAX(sc.velocidad_media_sesion) as valor
        FROM
            SesionesCardio sc
        JOIN
            usuarios u ON sc.usuario_id = u.id
        WHERE
            sc.velocidad_media_sesion IS NOT NULL
        GROUP BY
            sc.usuario_id, u.id, u.nombre_usuario -- <<< u.id AÑADIDO
        ORDER BY
            valor DESC
        LIMIT 3";

    $stmt_velocidad = $db->prepare($sql_velocidad);
    $stmt_velocidad->execute($params_velocidad); // Usamos los nuevos params
    $ranking_velocidad = $stmt_velocidad->fetchAll(PDO::FETCH_ASSOC);
    foreach ($ranking_velocidad as &$item) {
        $item['valor'] = round((float)$item['valor'], 1); // Redondeamos a 1 decimal y aseguramos float
        $item['label'] = 'km/h';
    }
    $respuesta["max_velocidad_media"] = $ranking_velocidad;


    // --- PASO 4: Devolver la respuesta ---
    http_response_code(200);
    echo json_encode($respuesta);


} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error al obtener los rankings globales.",
        "error" => $e->getMessage()
    ));
}
?>