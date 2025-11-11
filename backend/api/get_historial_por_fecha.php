<?php
// ---- backend/api/get_historial_por_fecha.php (NUEVO ARCHIVO) ----

// Cabeceras CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Dependencias
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
        http_response_code(401);
        echo json_encode(array("mensaje" => "Acceso denegado. Token inválido.")); 
        die();
    }
} else { 
    http_response_code(401);
    echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token.")); 
    die();
}

// --- PASO 2: Obtener Fecha ---
$fecha_seleccionada = $_GET['fecha'] ?? null;

if (!$fecha_seleccionada) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "No se especificó una fecha válida.")); // <-- Este es tu error
    die();
}

// --- PASO 3: Lógica de Consulta ---
$database = new Database();
$db = $database->getConnection();

try {
    // 1. Obtenemos todas las series de todas las sesiones de ESE DÍA
    $query_historial = "SELECT
                            s.id as sesion_id,
                            s.fecha_inicio,
                            s.fecha_fin,
                            TIMEDIFF(s.fecha_fin, s.fecha_inicio) as duracion,
                            s.notas_sesion,
                            
                            r.nombre as nombre_rutina,
                            r.color_tag, 

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
                         INNER JOIN
                            rutinas r ON s.rutina_id = r.id
                         WHERE
                            s.usuario_id = :usuario_id
                            AND DATE(s.fecha_inicio) = :fecha_seleccionada
                         ORDER BY
                            s.fecha_inicio ASC, 
                            sr.orden_ejercicio_rutina ASC, 
                            sr.num_serie ASC";
    
    $stmt_historial = $db->prepare($query_historial);
    $stmt_historial->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
    $stmt_historial->bindParam(":fecha_seleccionada", $fecha_seleccionada, PDO::PARAM_STR);
    $stmt_historial->execute();

    $series_flat_list = $stmt_historial->fetchAll(PDO::FETCH_ASSOC);

    // 2. Agrupar en PHP
    $historial_agrupado = [];
    foreach ($series_flat_list as $serie) {
        $sesion_id = $serie['sesion_id'];
        $ejercicio_nombre = $serie['nombre_ejercicio'];
        $tipo_ejercicio = $serie['tipo_ejercicio'];

        if (!isset($historial_agrupado[$sesion_id])) {
            $historial_agrupado[$sesion_id] = [
                "sesion_id" => $sesion_id,
                "fecha_inicio" => $serie['fecha_inicio'],
                "nombre_rutina" => $serie['nombre_rutina'] ?? 'Rutina Eliminada',
                "color_tag" => $serie['color_tag'],
                "notas_sesion" => $serie['notas_sesion'],
                "duracion" => $serie['duracion'],
                "total_volumen_fuerza" => 0,
                "total_reps_fuerza" => 0,
                "total_tiempo_cardio" => 0,
                "total_distancia_cardio" => 0,
                "ejercicios" => []
            ];
        }

        if ($tipo_ejercicio <> 'cardio') {
            $historial_agrupado[$sesion_id]["total_volumen_fuerza"] += (floatval($serie['repeticiones_realizadas'] ?? 0) * floatval($serie['peso_kg_usado'] ?? 0));
            $historial_agrupado[$sesion_id]["total_reps_fuerza"] += intval($serie['repeticiones_realizadas'] ?? 0);
        } else {
            $historial_agrupado[$sesion_id]["total_tiempo_cardio"] += intval($serie['tiempo_min_realizado'] ?? 0);
            $historial_agrupado[$sesion_id]["total_distancia_cardio"] += floatval($serie['distancia_km_realizada'] ?? 0);
        }

        $ejercicio_key = ($serie['orden_ejercicio_rutina'] ?? '0') . '_' . $ejercicio_nombre;
        if (!isset($historial_agrupado[$sesion_id]["ejercicios"][$ejercicio_key])) {
             $historial_agrupado[$sesion_id]["ejercicios"][$ejercicio_key] = [
                "nombre_ejercicio" => $ejercicio_nombre,
                "tipo_ejercicio" => $tipo_ejercicio,
                "orden" => $serie['orden_ejercicio_rutina'],
                "series" => []
             ];
        }

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

    foreach ($historial_agrupado as $sesion_id => $sesion_data) {
        $ejercicios_array = array_values($sesion_data["ejercicios"]);
        usort($ejercicios_array, function($a, $b) {
            return ($a['orden'] ?? 0) <=> ($b['orden'] ?? 0);
        });
        $historial_agrupado[$sesion_id]["ejercicios"] = $ejercicios_array;
    }

    http_response_code(200);
    echo json_encode(array_values($historial_agrupado)); 

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error al obtener el historial de la fecha.",
        "error" => $e->getMessage()
    ));
}
?>