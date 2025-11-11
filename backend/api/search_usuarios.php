<?php
// ---- backend/api/search_usuarios.php (CORREGIDO) ----

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

// --- PASO 2: Obtener Query de Búsqueda (Sin cambios) ---
$query_str = $_GET['query'] ?? '';
$mi_id = $usuario_id;

// --- PASO 3: Lógica de Búsqueda (¡MODIFICADA!) ---
$database = new Database();
$db = $database->getConnection();

try {
    // Esta consulta busca usuarios (u)
    // Y hace un LEFT JOIN con 'amistades' (a) para ver si existe
    // una fila donde (a.usuario_id = mi_id) y (a.amigo_id = u.id)
    $query = "SELECT 
                u.id, 
                u.nombre_usuario,
                (a.amigo_id IS NOT NULL) AS son_amigos 
              FROM 
                usuarios u
              LEFT JOIN 
                amistades a ON u.id = a.amigo_id AND a.usuario_id = :mi_id
              WHERE 
                /* --- ¡CAMBIO AQUÍ! --- */
                /* Convertimos ambos lados a minúsculas antes de comparar */
                LOWER(u.nombre_usuario) LIKE LOWER(:query_str) 
                /* --- FIN DEL CAMBIO --- */
                AND u.id != :mi_id 
              LIMIT 20";
              
    $stmt = $db->prepare($query);
    
    // El bindValue sigue siendo el mismo, con los %
    $stmt->bindValue(':query_str', '%' . htmlspecialchars(strip_tags($query_str)) . '%');
    $stmt->bindParam(':mi_id', $mi_id, PDO::PARAM_INT);
    $stmt->execute();

    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Convertimos 'son_amigos' a booleano (Sin cambios)
    foreach ($usuarios as $key => $user) {
        $usuarios[$key]['son_amigos'] = (bool)$user['son_amigos'];
    }

    http_response_code(200);
    echo json_encode($usuarios);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error al buscar usuarios.",
        "error" => $e->getMessage()
    ));
}
?>