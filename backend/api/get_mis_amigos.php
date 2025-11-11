<?php
// ---- backend/api/get_mis_amigos.php ----

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

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

// --- PASO 2: Lógica de Consulta ---
$database = new Database();
$db = $database->getConnection();

try {
    // Buscamos en 'amistades' las filas donde 'usuario_id' es el mío
    // y hacemos JOIN con 'usuarios' para obtener los datos de 'amigo_id'
    $query = "SELECT 
                u.id, 
                u.nombre_usuario, 
                a.fecha_amistad,
                a.solicitante_id
              FROM 
                usuarios u
              JOIN 
                amistades a ON u.id = a.amigo_id
              WHERE 
                a.usuario_id = :mi_id
              ORDER BY 
                u.nombre_usuario ASC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":mi_id", $usuario_id, PDO::PARAM_INT);
    $stmt->execute();

    $amigos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($amigos); // Devuelve el array (estará vacío si no tiene amigos)

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error al obtener la lista de amigos.",
        "error" => $e->getMessage()
    ));
}
?>