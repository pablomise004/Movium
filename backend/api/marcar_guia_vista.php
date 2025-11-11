<?php
// ---- backend/api/marcar_guia_vista.php ----

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

// --- PASO 1: Validación de Token (Reutilizado) ---
$secret_key = "k#f9JLz@p7W!bN8^vG2*qR5sT&eD4hX%uY1aC6oP3zM0xQñ";
$jwt = null;
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
$usuario_id = null;
// ... (Pega aquí todo el bloque de validación de token de add_amigo.php) ...
// (Asegúrate de que $usuario_id se establece correctamente)
if ($authHeader) { $arr = explode(" ", $authHeader);
$jwt = $arr[1] ?? null; }
if ($jwt) {
    try { $decoded = JWT::decode($jwt, new Key($secret_key, 'HS256'));
$usuario_id = $decoded->data->id; } 
    catch (Exception $e) { http_response_code(401); echo json_encode(array("mensaje" => "Acceso denegado. Token inválido."));
die(); }
} else { http_response_code(401); echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token.")); die();
}


// --- PASO 2: Obtener qué guía se ha visto ---
$data = json_decode(file_get_contents("php://input"));
if (empty($data->guia_vista)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "Datos incompletos. Se requiere 'guia_vista'."));
    die();
}

$guia = $data->guia_vista; // "inicio", "rutina", "records", "comunidad", o "entreno"
$columna_a_actualizar = "";
// Validamos la entrada para evitar inyección SQL
if ($guia === 'inicio') {
    $columna_a_actualizar = "ha_visto_guia_inicio";
} elseif ($guia === 'rutina') {
    $columna_a_actualizar = "ha_visto_guia_rutina";
} elseif ($guia === 'records') {
    $columna_a_actualizar = "ha_visto_guia_records";
} elseif ($guia === 'comunidad') {
    $columna_a_actualizar = "ha_visto_guia_comunidad";
} elseif ($guia === 'entreno') { /* <-- ¡AQUÍ ESTÁ EL NUEVO! */
    $columna_a_actualizar = "ha_visto_guia_entreno";
} else {
    http_response_code(400);
    echo json_encode(array("mensaje" => "Nombre de guía no válido."));
    die();
}

// --- PASO 3: Actualizar la BBDD ---
$database = new Database();
$db = $database->getConnection();
try {
    // Usamos INSERT ... ON DUPLICATE KEY UPDATE para crear la fila en 'perfiles' si no existía
    $query = "INSERT INTO perfiles (usuario_id, $columna_a_actualizar)
              VALUES (:usuario_id, 1)
              ON DUPLICATE KEY UPDATE
              $columna_a_actualizar = 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
    
    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(array("mensaje" => "Guía marcada como vista."));
    } else {
        throw new Exception("Error al actualizar la base de datos.");
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error en la base de datos.",
        "error" => $e->getMessage()
    ));
}
?>