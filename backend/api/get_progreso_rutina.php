<?php
// ---- backend/api/get_progreso_rutina.php (VERSIÓN 3.2 CON DURACIÓN Y PAGINACIÓN) ----

// Cabeceras CORS (sin cambios)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php';
require_once '../vendor/autoload.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

$secret_key = "k#f9JLz@p7W!bN8^vG2*qR5sT&eD4hX%uY1aC6oP3zM0xQñ";

// =================================================================
// PASO 1: VALIDACIÓN TOKEN (Sin cambios)
// =================================================================
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
        echo json_encode(array("mensaje" => "Acceso denigado. Token inválido."));
        die();
    }
} else {
    http_response_code(401);
    echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token."));
    die();
}

// =================================================================
// PASO 2: OBTENER ID RUTINA Y PARÁMETROS DE PAGINACIÓN (Sin cambios)
// =================================================================
$rutina_id = $_GET['id'] ?? null;
if (!$rutina_id || !is_numeric($rutina_id)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "No se especificó un ID de rutina válido."));
    die();
}

$page = (int)($_GET['page'] ?? 1);
if ($page < 1) { $page = 1; }
$limit = 10; // ¡Debe coincidir con ITEMS_PER_PAGE en RutinaProgreso.js!
$offset = ($page - 1) * $limit;

// =================================================================
// PASO 3: LÓGICA DE DOBLE CONSULTA (GRÁFICA + HISTORIAL)
// =================================================================

$respuesta = [
    "rutina_info" => null,
    "grafica" => [],
    "historial" => [],
    "total_sesiones" => 0
];
$limite_grafica = 30; // Para la gráfica (sin cambios)

try {
    $database = new Database();
    $db = $database->getConnection();

    // --- Info de la Rutina (Sin cambios) ---
    $query_info = "SELECT nombre FROM rutinas WHERE id = :rutina_id AND usuario_id = :usuario_id LIMIT 1";
    $stmt_info = $db->prepare($query_info);
    $stmt_info->bindParam(":rutina_id", $rutina_id, PDO::PARAM_INT);
    $stmt_info->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
    $stmt_info->execute();
    $info = $stmt_info->fetch(PDO::FETCH_ASSOC);
    if (!$info) {
        http_response_code(404);
        echo json_encode(array("mensaje" => "Rutina no encontrada o no te pertenece."));
        die();
    }
    $respuesta["rutina_info"] = $info;

    // --- CONSULTA DE CONTEO TOTAL DE SESIONES (Sin cambios) ---
    $query_count = "SELECT COUNT(id) as total_sesiones
                    FROM sesiones_entrenamiento
                    WHERE usuario_id = :usuario_id AND rutina_id = :rutina_id";
    $stmt_count = $db->prepare($query_count);
    $stmt_count->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
    $stmt_count->bindParam(":rutina_id", $rutina_id, PDO::PARAM_INT);
    $stmt_count->execute();
    $total_row = $stmt_count->fetch(PDO::FETCH_ASSOC);
    $respuesta["total_sesiones"] = (int)($total_row['total_sesiones'] ?? 0);

    // --- CONSULTA 1: DATOS PARA LA GRÁFICA (Sin cambios) ---
    // Solo se carga si page=1
    if ($page === 1 && $respuesta["total_sesiones"] > 0) { // Añadida condición para evitar consulta si no hay sesiones
        $query_grafica = "
            WITH SesionesNumeradas AS (
                SELECT
                    s.id as sesion_id,
                    DATE(s.fecha_inicio) as fecha,
                    ROW_NUMBER() OVER (ORDER BY s.fecha_inicio ASC) as sesion_num
                FROM sesiones_entrenamiento s
                WHERE s.usuario_id = :usuario_id AND s.rutina_id = :rutina_id_sn
            ),
            DatosAgrupados AS (
                 SELECT
                    sn.sesion_num,
                    sn.fecha,
                    SUM(CASE WHEN e.tipo <> 'cardio' THEN COALESCE(sr.repeticiones_realizadas, 0) * COALESCE(sr.peso_kg_usado, 0) ELSE 0 END) as volumen_fuerza,
                    SUM(CASE WHEN e.tipo <> 'cardio' THEN COALESCE(sr.repeticiones_realizadas, 0) ELSE 0 END) as reps_totales_fuerza,
                    SUM(CASE WHEN e.tipo = 'cardio' THEN COALESCE(sr.tiempo_min_realizado, 0) ELSE 0 END) as tiempo_cardio,
                    SUM(CASE WHEN e.tipo = 'cardio' THEN COALESCE(sr.distancia_km_realizada, 0) ELSE 0 END) as distancia_cardio,
                    ( SUM(CASE WHEN e.tipo = 'cardio' THEN COALESCE(sr.distancia_km_realizada, 0) ELSE 0 END) / NULLIF(SUM(CASE WHEN e.tipo = 'cardio' THEN COALESCE(sr.tiempo_min_realizado, 0) ELSE 0 END) / 60, 0) ) as velocidad_media_kmh
                 FROM SesionesNumeradas sn
                 JOIN series_realizadas sr ON sn.sesion_id = sr.sesion_id
                 JOIN ejercicios e ON sr.ejercicio_id = e.id
                 GROUP BY sn.sesion_num, sn.fecha
            )
            SELECT * FROM DatosAgrupados
            WHERE sesion_num > (SELECT COALESCE(MAX(sesion_num), 0) FROM DatosAgrupados) - :limite_grafica
            ORDER BY sesion_num ASC";
        $stmt_grafica = $db->prepare($query_grafica);
        $stmt_grafica->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
        $stmt_grafica->bindParam(":rutina_id_sn", $rutina_id, PDO::PARAM_INT);
        $stmt_grafica->bindParam(":limite_grafica", $limite_grafica, PDO::PARAM_INT);
        $stmt_grafica->execute();
        if ($stmt_grafica->rowCount() > 0) {
            $respuesta["grafica"] = $stmt_grafica->fetchAll(PDO::FETCH_ASSOC);
        }
    }

    // --- MODIFICADO: CONSULTA 2: DATOS PARA EL HISTORIAL (PAGINADO Y CON DURACIÓN) ---

    // 2a. Obtener los IDs de las sesiones para la página actual (sin cambios)
    $query_sesion_ids = "SELECT id
                         FROM sesiones_entrenamiento
                         WHERE usuario_id = :usuario_id AND rutina_id = :rutina_id
                         ORDER BY fecha_inicio DESC
                         LIMIT :limit OFFSET :offset";
    $stmt_sesion_ids = $db->prepare($query_sesion_ids);
    $stmt_sesion_ids->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
    $stmt_sesion_ids->bindParam(":rutina_id", $rutina_id, PDO::PARAM_INT);
    $stmt_sesion_ids->bindParam(":limit", $limit, PDO::PARAM_INT);
    $stmt_sesion_ids->bindParam(":offset", $offset, PDO::PARAM_INT);
    $stmt_sesion_ids->execute();
    $sesion_ids = $stmt_sesion_ids->fetchAll(PDO::FETCH_COLUMN, 0);

    $series_flat_list = [];

    // 2b. Si encontramos IDs, buscamos las series y datos de sesión para ESAS sesiones
    if (count($sesion_ids) > 0) {
        $placeholders = str_repeat('?,', count($sesion_ids) - 1) . '?';

        // **** CONSULTA MODIFICADA: Añadimos TIMEDIFF y seleccionamos fecha_fin ****
        $query_historial = "SELECT
                                s.id as sesion_id,
                                s.fecha_inicio,
                                s.fecha_fin, -- <-- Añadido fecha_fin
                                TIMEDIFF(s.fecha_fin, s.fecha_inicio) as duracion, -- <-- Calculamos duración
                                s.notas_sesion,
                                e.nombre as nombre_ejercicio,
                                e.tipo as tipo_ejercicio,
                                sr.num_serie,
                                sr.repeticiones_realizadas,
                                sr.fue_al_fallo,
                                sr.peso_kg_usado,
                                sr.tiempo_min_realizado,
                                sr.distancia_km_realizada,
                                sr.notas_serie,
                                sr.orden_ejercicio_rutina
                             FROM
                                sesiones_entrenamiento s
                            JOIN
                                series_realizadas sr ON s.id = sr.sesion_id
                            JOIN
                                ejercicios e ON sr.ejercicio_id = e.id
                            WHERE
                                s.id IN ($placeholders) -- Usamos los IDs paginados
                            ORDER BY
                                s.fecha_inicio DESC, sr.orden_ejercicio_rutina ASC, sr.num_serie ASC";

        $stmt_historial = $db->prepare($query_historial);
        $stmt_historial->execute($sesion_ids);
        $series_flat_list = $stmt_historial->fetchAll(PDO::FETCH_ASSOC);
    }
    // **** FIN MODIFICACIÓN CONSULTA ****

    // --- AGRUPACIÓN EN PHP (MODIFICADO para añadir duración) ---
    $historial_agrupado = [];
    foreach ($series_flat_list as $serie) {
        $sesion_id = $serie['sesion_id'];
        $ejercicio_nombre = $serie['nombre_ejercicio'];
        $tipo_ejercicio = $serie['tipo_ejercicio'];

        // Si es la primera vez que vemos esta sesión, inicializamos sus datos
        if (!isset($historial_agrupado[$sesion_id])) {
            // **** AÑADIMOS 'duracion' al inicializar ****
            $historial_agrupado[$sesion_id] = [
                "sesion_id" => $sesion_id,
                "fecha_inicio" => $serie['fecha_inicio'],
                "notas_sesion" => $serie['notas_sesion'],
                "duracion" => $serie['duracion'], // <-- Guardamos la duración calculada por SQL
                "total_volumen_fuerza" => 0,
                "total_reps_fuerza" => 0,
                "total_tiempo_cardio" => 0,
                "total_distancia_cardio" => 0,
                "ejercicios" => []
            ];
            // **** FIN MODIFICACIÓN INICIALIZACIÓN ****
        }

        // --- Cálculo de totales (Sin cambios) ---
        if ($tipo_ejercicio <> 'cardio') {
            $historial_agrupado[$sesion_id]["total_volumen_fuerza"] += (floatval($serie['repeticiones_realizadas'] ?? 0) * floatval($serie['peso_kg_usado'] ?? 0));
            $historial_agrupado[$sesion_id]["total_reps_fuerza"] += intval($serie['repeticiones_realizadas'] ?? 0);
        } else {
            $historial_agrupado[$sesion_id]["total_tiempo_cardio"] += intval($serie['tiempo_min_realizado'] ?? 0);
            $historial_agrupado[$sesion_id]["total_distancia_cardio"] += floatval($serie['distancia_km_realizada'] ?? 0);
        }

        // --- Agrupación por ejercicio (Sin cambios) ---
        $ejercicio_key = ($serie['orden_ejercicio_rutina'] ?? '0') . '_' . $ejercicio_nombre;
        if (!isset($historial_agrupado[$sesion_id]["ejercicios"][$ejercicio_key])) {
             $historial_agrupado[$sesion_id]["ejercicios"][$ejercicio_key] = [
                "nombre_ejercicio" => $ejercicio_nombre,
                "tipo_ejercicio" => $tipo_ejercicio,
                "orden" => $serie['orden_ejercicio_rutina'],
                "series" => []
             ];
        }

        // --- Añadir serie al ejercicio (Sin cambios) ---
        $historial_agrupado[$sesion_id]["ejercicios"][$ejercicio_key]["series"][] = [
            "num_serie" => $serie['num_serie'],
            "repeticiones_realizadas" => $serie['repeticiones_realizadas'],
            "fue_al_fallo" => (bool)$serie['fue_al_fallo'],
            "peso_kg_usado" => $serie['peso_kg_usado'],
            "tiempo_min_realizado" => $serie['tiempo_min_realizado'],
            "distancia_km_realizada" => $serie['distancia_km_realizada'],
            "notas_serie" => $serie['notas_serie']
        ];
    }

    // --- Ordenar ejercicios dentro de la sesión (Sin cambios) ---
    foreach ($historial_agrupado as $sesion_id => $sesion_data) {
        $ejercicios_array = array_values($sesion_data["ejercicios"]);
        usort($ejercicios_array, function($a, $b) {
            return ($a['orden'] ?? 0) <=> ($b['orden'] ?? 0);
        });
        $historial_agrupado[$sesion_id]["ejercicios"] = $ejercicios_array;
    }

    // --- PASO 4: DEVOLVER LA RESPUESTA COMPLETA (Sin cambios en esta parte) ---
    $respuesta["historial"] = array_values($historial_agrupado);

    http_response_code(200);
    echo json_encode($respuesta);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error en la base de datos al obtener el progreso de la rutina.",
        "error" => $e->getMessage()
    ));
}
?>