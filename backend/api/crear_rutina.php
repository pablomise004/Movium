<?php
// ---- backend/api/crear_rutina.php (MODIFICADO para 'orden') ----

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php';
require_once '../vendor/autoload.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

// ... (Validación de Token sin cambios) ...
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
        echo json_encode(array("mensaje" => "Acceso denegado. Token inválido o expirado.", "error" => $e->getMessage()));
        die();
    }
} else {
    http_response_code(401);
    echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token."));
    die();
}

define("MAX_NOMBRE_RUTINA_LENGTH", 38);
define("MAX_DIAS_SEMANA_LENGTH", 60);

$data = json_decode(file_get_contents("php://input"));
if (empty($data->nombre_rutina) || empty($usuario_id)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "Datos incompletos. Se requiere nombre_rutina y un usuario válido."));
    die();
}

$nombre = trim($data->nombre_rutina);
$dias_semana = isset($data->dias_semana) ? trim($data->dias_semana) : null;

// ... (Validaciones de longitud sin cambios) ...
if (mb_strlen($nombre, 'UTF-8') > MAX_NOMBRE_RUTINA_LENGTH) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "El nombre de la rutina no puede exceder los " . MAX_NOMBRE_RUTINA_LENGTH . " caracteres."));
    die();
}
if ($dias_semana !== null && mb_strlen($dias_semana, 'UTF-8') > MAX_DIAS_SEMANA_LENGTH) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "La descripción/días no puede exceder los " . MAX_DIAS_SEMANA_LENGTH . " caracteres."));
    die();
}

// 3. Preparar la conexión a la BBDD
try {
    $database = new Database();
    $db = $database->getConnection();

    // --- ¡NUEVO! Obtener el orden máximo actual para ESE usuario ---
    $query_orden = "SELECT MAX(orden) as max_orden FROM rutinas WHERE usuario_id = :usuario_id";
    $stmt_orden = $db->prepare($query_orden);
    $stmt_orden->bindParam(":usuario_id", $usuario_id);
    $stmt_orden->execute();
    $resultado = $stmt_orden->fetch(PDO::FETCH_ASSOC);
    // El nuevo orden será 1 más que el máximo, o 1 si no tiene rutinas (max_orden será NULL)
    $nuevo_orden = ($resultado['max_orden'] ?? 0) + 1;
    // --- FIN NUEVO ---

    // --- ¡MODIFICADO! Añadir 'orden' al INSERT ---
    $query = "INSERT INTO rutinas (usuario_id, nombre, dias_semana, orden)
              VALUES (:usuario_id, :nombre, :dias_semana, :orden)";
    
    $stmt = $db->prepare($query);

    $stmt->bindParam(":usuario_id", $usuario_id);
    $stmt->bindParam(":nombre", $nombre);
    $stmt->bindParam(":dias_semana", $dias_semana);
    $stmt->bindParam(":orden", $nuevo_orden); // <-- Añadido
    // --- FIN MODIFICACIÓN ---

    if ($stmt->execute()) {
        $nueva_rutina_id = $db->lastInsertId();
        http_response_code(201);
        echo json_encode(array(
            "mensaje" => "Rutina creada exitosamente.",
            "rutina" => [
                "id" => $nueva_rutina_id,
                "nombre" => $nombre,
                "dias" => $dias_semana
                // No necesitamos devolver el orden aquí, pero podríamos
            ]
        ));
    } else {
        http_response_code(500);
        echo json_encode(array("mensaje" => "No se pudo crear la rutina en la base de datos."));
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error en la base de datos.",
        "error" => $e->getMessage()
    ));
}

?>