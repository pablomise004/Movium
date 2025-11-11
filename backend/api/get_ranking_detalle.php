<?php
// ---- backend/api/get_ranking_detalle.php (CORREGIDO) ----

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php';
require_once '../vendor/autoload.php';
use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

// --- PASO 1: Validación de Token (Estándar) ---
$secret_key = "k#f9JLz@p7W!bN8^vG2*qR5sT&eD4hX%uY1aC6oP3zM0xQñ";
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

// --- PASO 2: Obtener ID del Ejercicio ---
$ejercicio_id = $_GET['id'] ?? null;
if (!$ejercicio_id || !is_numeric($ejercicio_id)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "No se especificó un ID de ejercicio válido."));
    die();
}

$mi_id = $usuario_id;
$database = new Database();
$db = $database->getConnection();

// --- PASO 3: Lógica de Ranking Detallado ---
try {

    // 3a. Obtener tipo de ejercicio
    $query_tipo = "SELECT tipo FROM ejercicios WHERE id = :ejercicio_id LIMIT 1";
    $stmt_tipo = $db->prepare($query_tipo);
    $stmt_tipo->bindParam(":ejercicio_id", $ejercicio_id, PDO::PARAM_INT);
    $stmt_tipo->execute();
    $ejercicio_info = $stmt_tipo->fetch(PDO::FETCH_ASSOC);

    if (!$ejercicio_info) {
        http_response_code(404);
        echo json_encode(array("mensaje" => "Ejercicio no encontrado."));
        die();
    }
    $tipo_ejercicio = $ejercicio_info['tipo'];

    // 3b. Obtener lista de IDs (Amigos + Tú)
    $query_amigos = "SELECT amigo_id FROM amistades WHERE usuario_id = :mi_id";
    $stmt_amigos = $db->prepare($query_amigos);
    $stmt_amigos->bindParam(":mi_id", $mi_id, PDO::PARAM_INT);
    $stmt_amigos->execute();
    $lista_ids_usuarios = $stmt_amigos->fetchAll(PDO::FETCH_COLUMN, 0);
    $lista_ids_usuarios[] = $mi_id;

    // 3c. Crear placeholders (?)
    if (count($lista_ids_usuarios) == 0) {
        // Devuelve respuesta vacía
        http_response_code(200);
        echo json_encode([ "max_peso" => [], "max_reps" => [], "max_dist" => [], "max_tiempo" => [] ]);
        exit();
    }
    $placeholders = str_repeat('?,', count($lista_ids_usuarios) - 1) . '?';

    // 3d. Preparamos el array de respuesta
    $respuesta = [
        "max_peso" => [],
        "max_reps" => [], // Se convertirá en e1RM si es fuerza
        "max_dist" => [],
        "max_tiempo" => []
    ];

    // 3e. Parámetros base para las consultas
    $base_params = array_merge([$ejercicio_id], $lista_ids_usuarios);

    // -----------------------------------------------------------------
    // FUNCIÓN AUXILIAR GENERALIZADA (MODIFICADA con filtro para e1RM)
    // -----------------------------------------------------------------
    function getRankingDetalle($db, $metrica_sql, $label, $ejercicio_id, $lista_ids, $placeholders, $is_e1RM = false) {
         $sql = "SELECT
                    u.id as usuario_id,
                    u.nombre_usuario,
                    MAX($metrica_sql) as valor
                FROM series_realizadas sr
                JOIN sesiones_entrenamiento s ON sr.sesion_id = s.id
                JOIN usuarios u ON s.usuario_id = u.id
                WHERE
                    sr.ejercicio_id = ?
                    AND s.usuario_id IN ($placeholders)
                    AND $metrica_sql IS NOT NULL AND $metrica_sql > 0";

        // ¡CAMBIO! Añadimos filtro extra si estamos calculando e1RM
        if ($is_e1RM) {
            $sql .= " AND sr.repeticiones_realizadas > 1
                      AND sr.peso_kg_usado > 0 ";
        }

        $sql .= " GROUP BY s.usuario_id, u.id, u.nombre_usuario
                  ORDER BY valor DESC
                  LIMIT 3";

        $stmt = $db->prepare($sql);
        $params = array_merge([$ejercicio_id], $lista_ids);
        $stmt->execute($params);
        $ranking = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($ranking as &$item) {
            $item['label'] = $label;
            $item['valor'] = is_numeric($item['valor']) ? (float)$item['valor'] : $item['valor'];
        }
        return $ranking;
    }
    // -----------------------------------------------------------------

    // 3f. Ejecutar consultas según el tipo
    if ($tipo_ejercicio == 'fuerza' || $tipo_ejercicio == 'calistenia') {
        // Max Peso (sin cambios)
        $respuesta["max_peso"] = getRankingDetalle($db, 'sr.peso_kg_usado', 'kg', $ejercicio_id, $lista_ids_usuarios, $placeholders);

        // ¡CAMBIO! Calcular e1RM para la métrica de 'max_reps'
        $metrica_e1RM = "ROUND(sr.peso_kg_usado * (1 + (sr.repeticiones_realizadas / 30)), 1)";
        $respuesta["max_reps"] = getRankingDetalle($db, $metrica_e1RM, 'e1RM (kg)', $ejercicio_id, $lista_ids_usuarios, $placeholders, true); // Pasamos true para activar filtro

    } elseif ($tipo_ejercicio == 'cardio') {
        // Cardio (sin cambios)
        $respuesta["max_dist"] = getRankingDetalle($db, 'sr.distancia_km_realizada', 'km', $ejercicio_id, $lista_ids_usuarios, $placeholders);
        $respuesta["max_tiempo"] = getRankingDetalle($db, 'sr.tiempo_min_realizado', 'min', $ejercicio_id, $lista_ids_usuarios, $placeholders);
    }

    // --- PASO 4: Devolver la respuesta ---
    http_response_code(200);
    echo json_encode($respuesta);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error al obtener el ranking detallado.",
        "error" => $e->getMessage()
    ));
}
?>