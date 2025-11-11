<?php
// ---- backend/api/get_perfil.php ----

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php';
require_once '../vendor/autoload.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

$secret_key = "k#f9JLz@p7W!bN8^vG2*qR5sT&eD4hX%uY1aC6oP3zM0xQñ";

// --- PASO 1: Validación de Token (Idéntica) ---
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

// --- PASO 2: Lógica para obtener el perfil ---
try {
    $database = new Database();
    $db = $database->getConnection();

    $query = "SELECT 
                  u.nombre_usuario, 
                  u.correo_electronico,
                  p.nombre_real,
                  p.apellidos,
                  p.fecha_nacimiento,
                  p.altura_cm,
                  p.peso_kg, -- <-- ¡CAMBIO AQUÍ!
                  p.telefono,
                  p.direccion
                FROM 
                  usuarios u
                LEFT JOIN 
                  perfiles p ON u.id = p.usuario_id
                WHERE 
                  u.id = :usuario_id
                LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $perfil = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($perfil) {
        http_response_code(200);
        echo json_encode($perfil);
    } else {
        http_response_code(404);
        echo json_encode(array("mensaje" => "Usuario no encontrado."));
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error en la base de datos.",
        "error" => $e->getMessage()
    ));
}
?>