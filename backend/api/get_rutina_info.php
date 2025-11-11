<?php
// ---- backend/api/get_rutina_info.php (MODIFICADO) ----

// Cabeceras CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
require_once '../config/database.php';
require_once '../vendor/autoload.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

// Tu clave secreta
$secret_key = "k#f9JLz@p7W!bN8^vG2*qR5sT&eD4hX%uY1aC6oP3zM0xQñ";
// =================================================================
// PASO 1: LÓGICA DE VALIDACIÓN DE TOKEN (Idéntica)
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
        echo json_encode(array("mensaje" => "Acceso denegado. Token inválido."));
        die();
    }
} else {
    http_response_code(401);
    echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token."));
    die();
}

// =================================================================
// PASO 2: OBTENER EL ID DE LA RUTINA DESDE LA URL
// =================================================================
$rutina_id = $_GET['id'] ?? null;
if (!$rutina_id) {
    http_response_code(400); // Bad Request
    echo json_encode(array("mensaje" => "No se especificó un ID de rutina."));
    die();
}

// =================================================================
// PASO 3: LÓGICA PARA OBTENER LA INFO DE ESA RUTINA (MODIFICADA)
// =================================================================

try {
    $database = new Database();
    $db = $database->getConnection();

    // --- ¡NUEVO BLOQUE! ---
    // 1. Obtenemos el orden máximo actual del usuario
    $query_max = "SELECT MAX(orden) as max_orden FROM rutinas WHERE usuario_id = :usuario_id_max";
    $stmt_max = $db->prepare($query_max);
    $stmt_max->bindParam(":usuario_id_max", $usuario_id, PDO::PARAM_INT);
    $stmt_max->execute();
    $max_orden_row = $stmt_max->fetch(PDO::FETCH_ASSOC);
    // Si no tiene rutinas, max_orden será NULL, así que usamos ?? 0
    $max_orden_usuario = (int)($max_orden_row['max_orden'] ?? 0);
    // --- FIN NUEVO BLOQUE ---

    // 2. Preparar la sentencia SQL (¡MODIFICADA!)
    // Añadimos 'orden' y 'color_tag'
    $query = "SELECT id, nombre, dias_semana, orden, color_tag 
              FROM rutinas 
              WHERE id = :rutina_id AND usuario_id = :usuario_id
              LIMIT 1";
    $stmt = $db->prepare($query);
    
    // 3. Bindear (enlazar) los parámetros
    $stmt->bindParam(":rutina_id", $rutina_id, PDO::PARAM_INT);
    $stmt->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
    // 4. Ejecutar
    $stmt->execute();
    
    // 5. Obtener el resultado
    $rutina = $stmt->fetch(PDO::FETCH_ASSOC);
    // 6. Comprobar si se encontró la rutina
    if ($rutina) {
        // ¡Éxito!
        
        // --- ¡CAMBIO AQUÍ! ---
        // 7. Añadimos el max_orden a la respuesta
        // Si no hay rutinas (max_orden_usuario es 0), al menos enviamos 1
        $rutina['max_orden_disponible'] = ($max_orden_usuario > 0) ? $max_orden_usuario : 1;
        // --- FIN CAMBIO ---

        http_response_code(200);
        echo json_encode($rutina);
        // Ahora incluye 'orden', 'color_tag' y 'max_orden_disponible'
    } else {
        // No se encontró la rutina
        http_response_code(404);
        // Not Found
        echo json_encode(array("mensaje" => "Rutina no encontrada o no te pertenece."));
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error en la base de datos.",
        "error" => $e->getMessage()
    ));
}
?>