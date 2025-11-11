<?php
// ---- backend/api/delete_amigo.php ----

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

// --- PASO 1: Validación de Token ---
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

// --- PASO 2: Obtener ID a borrar ---
$data = json_decode(file_get_contents("php://input"));
if (empty($data->amigo_a_borrar_id)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "Datos incompletos. Se requiere 'amigo_a_borrar_id'."));
    die();
}

$mi_id = $usuario_id;
$otro_id = (int)$data->amigo_a_borrar_id;

// --- PASO 3: Lógica de Borrado (Transacción) ---
$database = new Database();
$db = $database->getConnection();

try {
    $db->beginTransaction();

    // 1. Borrar mi fila (Yo ya no soy amigo de 'otro_id')
    $query1 = "DELETE FROM amistades WHERE usuario_id = :mi_id AND amigo_id = :otro_id";
    $stmt1 = $db->prepare($query1);
    $stmt1->bindParam(":mi_id", $mi_id, PDO::PARAM_INT);
    $stmt1->bindParam(":otro_id", $otro_id, PDO::PARAM_INT);
    $stmt1->execute();

    // 2. Borrar su fila ('otro_id' ya no es amigo mío)
    $query2 = "DELETE FROM amistades WHERE usuario_id = :otro_id AND amigo_id = :mi_id";
    $stmt2 = $db->prepare($query2);
    $stmt2->bindParam(":otro_id", $otro_id, PDO::PARAM_INT);
    $stmt2->bindParam(":mi_id", $mi_id, PDO::PARAM_INT);
    $stmt2->execute();
    
    $db->commit();
    http_response_code(200);
    echo json_encode(array("mensaje" => "Amistad eliminada."));

} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error al eliminar la amistad.",
        "error" => $e->getMessage()
    ));
}
?>