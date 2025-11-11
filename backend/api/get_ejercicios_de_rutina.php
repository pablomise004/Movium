<?php
// ---- backend/api/get_ejercicios_de_rutina.php (REESCRITO V6.0) ----

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php';
require_once '../vendor/autoload.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

// --- PASO 1: Validación de Token (Sin cambios) ---
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
        echo json_encode(array("mensaje" => "Acceso denegado. Token inválido.")); die();
    }
} else {
    http_response_code(401);
    echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token.")); die();
}

// --- PASO 2: Obtener ID de rutina (Sin cambios) ---
$rutina_id = $_GET['id'] ?? null;
if (!$rutina_id) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "No se especificó un ID de rutina."));
    die();
}

// =================================================================
// PASO 3: LÓGICA V6.0 (2 CONSULTAS ANIDADAS)
// =================================================================

try {
    $database = new Database();
    $db = $database->getConnection();

    // ---- CONSULTA 1: Obtener "Padres" (Sin cambios) ----
    $query_ejercicios = "SELECT 
                            re.id,
                            re.ejercicio_id,
                            re.orden,
                            ej.nombre as nombre_ejercicio,
                            ej.grupo_muscular,
                            ej.tipo
                         FROM 
                            rutina_ejercicios re
                         JOIN 
                            ejercicios ej ON re.ejercicio_id = ej.id
                         JOIN
                            rutinas ru ON re.rutina_id = ru.id
                         WHERE 
                            re.rutina_id = :rutina_id AND ru.usuario_id = :usuario_id
                         ORDER BY 
                            re.orden ASC";
    
    $stmt_ejercicios = $db->prepare($query_ejercicios);
    $stmt_ejercicios->bindParam(":rutina_id", $rutina_id, PDO::PARAM_INT);
    $stmt_ejercicios->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
    $stmt_ejercicios->execute();
    
    $ejercicios_en_rutina = $stmt_ejercicios->fetchAll(PDO::FETCH_ASSOC);

    if (count($ejercicios_en_rutina) > 0) {
        
        // ---- CONSULTA 2: Obtener "Hijos" (¡¡CAMBIOS V6.0 AQUÍ!!) ----
        
        $rutina_ejercicio_ids = array_map(function($ej) {
            return $ej['id'];
        }, $ejercicios_en_rutina);
        
        $placeholders = str_repeat('?,', count($rutina_ejercicio_ids) - 1) . '?';
        
        // ¡Consulta actualizada a V6.0!
        $query_objetivos = "SELECT 
                                id,
                                rutina_ejercicio_id,
                                num_serie,
                                
                                /* --- CAMPOS V6.0 --- */
                                tipo_rep_objetivo,
                                reps_min_objetivo,
                                reps_max_objetivo,
                                /* ----------------- */
                                
                                peso_kg_objetivo,
                                tiempo_min_objetivo,
                                distancia_km_objetivo,
                                descanso_seg_post
                            FROM 
                                rutina_objetivos
                            WHERE 
                                rutina_ejercicio_id IN ($placeholders)
                            ORDER BY
                                num_serie ASC";
        
        $stmt_objetivos = $db->prepare($query_objetivos);
        $stmt_objetivos->execute($rutina_ejercicio_ids);
        $objetivos = $stmt_objetivos->fetchAll(PDO::FETCH_ASSOC);

        // ---- PASO 3: Combinar los datos (Sin cambios) ----
        $objetivos_map = [];
        foreach ($objetivos as $obj) {
            $objetivos_map[$obj['rutina_ejercicio_id']][] = $obj;
        }
        
        foreach ($ejercicios_en_rutina as $i => $ej) {
            $ej_id = $ej['id'];
            if (isset($objetivos_map[$ej_id])) {
                $ejercicios_en_rutina[$i]['objetivos'] = $objetivos_map[$ej_id];
            } else {
                $ejercicios_en_rutina[$i]['objetivos'] = [];
            }
        }
    }

    // 5. Devolver el resultado
    http_response_code(200);
    echo json_encode($ejercicios_en_rutina);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error en la base de datos al obtener los ejercicios de la rutina.",
        "error" => $e->getMessage()
    ));
}
?>