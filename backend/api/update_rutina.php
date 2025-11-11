<?php
// ---- backend/api/update_rutina.php (MODIFICADO para 'orden' y 'color_tag' CON REORDENACIÓN) ----

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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
        echo json_encode(array("mensaje" => "Acceso denegado. Token inválido."));
        die();
    }
} else {
    http_response_code(401);
    echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token."));
    die();
}

// --- Constantes (Sin cambios) ---
define("MAX_NOMBRE_RUTINA_LENGTH", 38);
define("MAX_DIAS_SEMANA_LENGTH", 60);

// --- PASO 2: Obtener datos JSON (Sin cambios) ---
$data = json_decode(file_get_contents("php://input"));
if (empty($data->id) || !isset($data->nombre)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "Datos incompletos. Se requiere 'id' y 'nombre'."));
    die();
}

$rutina_id = $data->id;
$nombre = trim($data->nombre);
$dias_semana = isset($data->dias_semana) ? trim($data->dias_semana) : null;
$nuevo_orden = isset($data->orden) ? (int)$data->orden : 0;
$color_tag = isset($data->color_tag) ? trim($data->color_tag) : null;

// --- VALIDACIONES (Sin cambios) ---
if (mb_strlen($nombre, 'UTF-8') === 0) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "El nombre de la rutina no puede estar vacío."));
    die();
}
if (mb_strlen($nombre, 'UTF-8') > MAX_NOMBRE_RUTINA_LENGTH) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "El nombre no puede exceder los " . MAX_NOMBRE_RUTINA_LENGTH . " caracteres."));
    die();
}
if ($dias_semana !== null && mb_strlen($dias_semana, 'UTF-8') > MAX_DIAS_SEMANA_LENGTH) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "La descripción/días no puede exceder los " . MAX_DIAS_SEMANA_LENGTH . " caracteres."));
    die();
}
if ($color_tag !== null && $color_tag !== "" && !preg_match('/^#[a-fA-F0-9]{6}$/', $color_tag)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "El formato de color no es válido. Debe ser un código HEX (ej: #FF5733)."));
    die();
}

// ==================================================================
// --- PASO 3: Lógica de Actualización (¡MODIFICADA CON TRANSACCIÓN!) ---
// ==================================================================
$database = new Database();
$db = $database->getConnection();

try {
    // ¡¡NUEVO!! Iniciar Transacción
    $db->beginTransaction();

    // 1. OBTENER ORDEN ANTIGUO Y VALIDAR PROPIEDAD
    // (Lógica adaptada de update_ejercicio_en_rutina.php)
    $query_info = "SELECT orden FROM rutinas 
                   WHERE id = :rutina_id AND usuario_id = :usuario_id
                   LIMIT 1";
    $stmt_info = $db->prepare($query_info);
    $stmt_info->bindParam(":rutina_id", $rutina_id, PDO::PARAM_INT);
    $stmt_info->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
    $stmt_info->execute();
    $info = $stmt_info->fetch(PDO::FETCH_ASSOC);

    if (!$info) {
        throw new Exception("Rutina no encontrada o no te pertenece.", 404);
    }
    $antiguo_orden = (int)$info['orden'];

    // 2. LÓGICA DE REORDENACIÓN (PUSH/PULL)
    // (Lógica adaptada de update_ejercicio_en_rutina.php)
    if ($nuevo_orden != $antiguo_orden) {
        
        // Aseguramos que el nuevo orden esté dentro de los límites
        $query_max = "SELECT MAX(orden) as max_orden FROM rutinas WHERE usuario_id = :usuario_id";
        $stmt_max = $db->prepare($query_max);
        $stmt_max->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
        $stmt_max->execute();
        $max_orden = (int)$stmt_max->fetch(PDO::FETCH_ASSOC)['max_orden'];
        
        if ($nuevo_orden > $max_orden) { $nuevo_orden = $max_orden; }
        if ($nuevo_orden < 1) { $nuevo_orden = 1; }

        // Dependiendo de si movemos hacia arriba o abajo, "empujamos" o "tiramos"
        if ($nuevo_orden < $antiguo_orden) {
            // "Push" (Mover 5 a 2 -> 2,3,4 se vuelven 3,4,5)
            $query_shift = "UPDATE rutinas SET orden = orden + 1 
                            WHERE usuario_id = :usuario_id AND orden >= :nuevo_orden AND orden < :antiguo_orden";
        } else {
            // "Pull" (Mover 2 a 5 -> 3,4,5 se vuelven 2,3,4)
            $query_shift = "UPDATE rutinas SET orden = orden - 1 
                            WHERE usuario_id = :usuario_id AND orden > :antiguo_orden AND orden <= :nuevo_orden";
        }
        
        $stmt_shift = $db->prepare($query_shift);
        $stmt_shift->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
        $stmt_shift->bindParam(":nuevo_orden", $nuevo_orden, PDO::PARAM_INT);
        $stmt_shift->bindParam(":antiguo_orden", $antiguo_orden, PDO::PARAM_INT);
        $stmt_shift->execute();
    }

    // 3. ACTUALIZAR LA RUTINA OBJETIVO
    // (Esta es la consulta original que tenías)
    $query_update = "UPDATE rutinas
                     SET 
                       nombre = :nombre, 
                       dias_semana = :dias_semana,
                       orden = :orden,
                       color_tag = :color_tag
                     WHERE 
                       id = :rutina_id AND usuario_id = :usuario_id_main";
    
    $stmt_update = $db->prepare($query_update);

    $stmt_update->bindParam(":nombre", $nombre);
    $stmt_update->bindParam(":dias_semana", $dias_semana);
    $stmt_update->bindParam(":orden", $nuevo_orden, PDO::PARAM_INT); // Usamos el $nuevo_orden (ya validado)
    $stmt_update->bindValue(":color_tag", ($color_tag === "" ? null : $color_tag), PDO::PARAM_STR | PDO::PARAM_NULL);
    $stmt_update->bindParam(":rutina_id", $rutina_id, PDO::PARAM_INT);
    $stmt_update->bindParam(":usuario_id_main", $usuario_id, PDO::PARAM_INT);

    // 4. EJECUTAR Y CONFIRMAR
    if ($stmt_update->execute()) {
        
        // ¡¡NUEVO!! Confirmar la transacción
        $db->commit();
        
        http_response_code(200);
        echo json_encode(array(
            "mensaje" => "Rutina actualizada.",
            "rutina_info" => array(
                "id" => $rutina_id,
                "nombre" => $nombre,
                "dias_semana" => $dias_semana,
                "orden" => $nuevo_orden, // Devolvemos el orden final
                "color_tag" => ($color_tag === "" ? null : $color_tag) // Devolvemos null si estaba vacío
            )
        ));
    } else {
        throw new Exception("Error en la base de datos durante la actualización final.");
    }

} catch (Exception $e) {
    // ¡¡NUEVO!! Revertir en caso de error
    if ($db && $db->inTransaction()) {
        $db->rollBack();
    }
    
    $codigo = $e->getCode() == 404 ? 404 : 500;
    http_response_code($codigo);
    echo json_encode(array(
        "mensaje" => "Error al actualizar la rutina.",
        "error" => $e->getMessage()
    ));
}
?>