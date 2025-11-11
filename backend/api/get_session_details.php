<?php
// ---- backend/api/get_session_details.php (NUEVO ARCHIVO) ----

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

// --- PASO 2: Obtener ID de la Sesión ---
$sesion_id_solicitada = $_GET['id'] ?? null;

if (!$sesion_id_solicitada || !is_numeric($sesion_id_solicitada)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "No se especificó un ID de sesión válido."));
    die();
}

// --- PASO 3: Lógica de Consulta ---
$database = new Database();
$db = $database->getConnection();

try {
    // 1. (SEGURIDAD) Verificar que el usuario que pide los detalles
    //    sea amigo del dueño de la sesión.
    $query_check = "
        SELECT s.usuario_id 
        FROM sesiones_entrenamiento s
        WHERE s.id = :sesion_id
        AND (
            -- O soy yo mismo
            s.usuario_id = :mi_id 
            -- O el dueño de la sesión está en mi lista de amigos
            OR s.usuario_id IN (SELECT amigo_id FROM amistades WHERE usuario_id = :mi_id_amistad)
        )
        LIMIT 1
    ";
    $stmt_check = $db->prepare($query_check);
    $stmt_check->bindParam(":sesion_id", $sesion_id_solicitada, PDO::PARAM_INT);
    $stmt_check->bindParam(":mi_id", $usuario_id, PDO::PARAM_INT);
    $stmt_check->bindParam(":mi_id_amistad", $usuario_id, PDO::PARAM_INT);
    $stmt_check->execute();

    if ($stmt_check->rowCount() == 0) {
        http_response_code(403); // Forbidden
        echo json_encode(array("mensaje" => "No tienes permiso para ver esta sesión."));
        die();
    }

    // 2. Si hay permiso, obtener los detalles (Copiado de get_historial_por_fecha.php)
    $query_detalles = "SELECT
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
                            series_realizadas sr
                         JOIN
                            ejercicios e ON sr.ejercicio_id = e.id
                         WHERE
                            sr.sesion_id = :sesion_id -- ¡AQUÍ ESTÁ EL CAMBIO!
                         ORDER BY
                            sr.orden_ejercicio_rutina ASC, 
                            sr.num_serie ASC";
    
    $stmt_detalles = $db->prepare($query_detalles);
    $stmt_detalles->bindParam(":sesion_id", $sesion_id_solicitada, PDO::PARAM_INT);
    $stmt_detalles->execute();

    $series_flat_list = $stmt_detalles->fetchAll(PDO::FETCH_ASSOC);

    // 3. Agrupar en PHP (Copiado de get_historial_por_fecha.php)
    $ejercicios_agrupados = [];
    foreach ($series_flat_list as $serie) {
        $ejercicio_nombre = $serie['nombre_ejercicio'];
        $tipo_ejercicio = $serie['tipo_ejercicio'];
        
        $ejercicio_key = ($serie['orden_ejercicio_rutina'] ?? '0') . '_' . $ejercicio_nombre;
        
        if (!isset($ejercicios_agrupados[$ejercicio_key])) {
             $ejercicios_agrupados[$ejercicio_key] = [
                "nombre_ejercicio" => $ejercicio_nombre,
                "tipo_ejercicio" => $tipo_ejercicio,
                "orden" => $serie['orden_ejercicio_rutina'],
                "series" => []
             ];
        }

        $ejercicios_agrupados[$ejercicio_key]["series"][] = [
            "num_serie" => $serie['num_serie'],
            "repeticiones_realizadas" => $serie['repeticiones_realizadas'],
            "fue_al_fallo" => (bool)$serie['fue_al_fallo'],
            "peso_kg_usado" => $serie['peso_kg_usado'],
            "tiempo_min_realizado" => $serie['tiempo_min_realizado'],
            "distancia_km_realizada" => $serie['distancia_km_realizada'],
            "notas_serie" => $serie['notas_serie']
        ];
    }

    // Ordenar el array final
    $ejercicios_array = array_values($ejercicios_agrupados);
    usort($ejercicios_array, function($a, $b) {
        return ($a['orden'] ?? 0) <=> ($b['orden'] ?? 0);
    });

    http_response_code(200);
    echo json_encode($ejercicios_array); // Devolvemos solo el array de ejercicios

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error al obtener los detalles de la sesión.",
        "error" => $e->getMessage()
    ));
}
?>