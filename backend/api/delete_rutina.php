<?php
// ---- backend/api/delete_rutina.php ----

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS"); // Usamos POST para borrar
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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

// --- PASO 2: Obtener ID a borrar ---
$data = json_decode(file_get_contents("php://input"));

if (empty($data->id)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "No se especificó el ID de la rutina a borrar."));
    die();
}
$rutina_id_a_borrar = $data->id;

// --- PASO 3: Lógica de Borrado ---
$database = new Database();
$db = $database->getConnection();

try {
    $db->beginTransaction();
    
    // 1. (SEGURIDAD) Verificar propiedad
    $check_query = "SELECT id FROM rutinas 
                    WHERE id = :rutina_id AND usuario_id = :usuario_id";
    $stmt_check = $db->prepare($check_query);
    $stmt_check->bindParam(":rutina_id", $rutina_id_a_borrar, PDO::PARAM_INT);
    $stmt_check->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
    $stmt_check->execute();
    
    if ($stmt_check->rowCount() == 0) {
        throw new Exception("Rutina no encontrada o no te pertenece.", 404);
    }
    
    // 2. BORRAR la rutina (CASCADE se encarga de lo demás)
    $query_delete = "DELETE FROM rutinas WHERE id = :rutina_id";
    $stmt_delete = $db->prepare($query_delete);
    $stmt_delete->bindParam(":rutina_id", $rutina_id_a_borrar, PDO::PARAM_INT);
    $stmt_delete->execute();

    // 3. Commit
    $db->commit();
    
    http_response_code(200);
    echo json_encode(array("mensaje" => "Rutina eliminada exitosamente."));

} catch (Exception $e) {
    $db->rollBack();
    $codigo = $e->getCode() == 404 ? 404 : 500;
    http_response_code($codigo);
    echo json_encode(array(
        "mensaje" => "Error al eliminar la rutina.",
        "error" => $e->getMessage()
    ));
}
?>