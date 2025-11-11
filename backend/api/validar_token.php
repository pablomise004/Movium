<?php
// ---- backend/api/validar_token.php ----

// Cabeceras CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST"); // O GET, según cómo decidas enviarlo
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php';
require_once '../vendor/autoload.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key; // IMPORTANTE: Necesario para la v6+ de firebase/jwt

// Tu clave secreta (debe ser LA MISMA que en login.php)
$secret_key = "k#f9JLz@p7W!bN8^vG2*qR5sT&eD4hX%uY1aC6oP3zM0xQñ";

// 1. Obtener el token del header de Autorización
$jwt = null;
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;

if ($authHeader) {
    // El header suele ser "Bearer <token>"
    // Necesitamos extraer solo el <token>
    $arr = explode(" ", $authHeader);
    $jwt = $arr[1] ?? null;
}

if ($jwt) {
    try {
        // 2. Decodificar el token
        // NOTA: Usamos 'new Key()' para la versión 6+ de la librería.
        $decoded = JWT::decode($jwt, new Key($secret_key, 'HS256'));

        // 3. Si tiene éxito, el token es válido
        http_response_code(200);
        echo json_encode(array(
            "mensaje" => "Acceso concedido.",
            "data" => $decoded->data // Enviamos los datos del usuario (id, nombre_usuario)
        ));

    } catch (Exception $e) {
        // 4. Si falla (expirado, firma incorrecta, etc.)
        http_response_code(401); // Unauthorized
        echo json_encode(array(
            "mensaje" => "Acceso denegado. Token inválido o expirado.",
            "error" => $e->getMessage()
        ));
    }
} else {
    // 5. Si no se proporcionó ningún token
    http_response_code(401); // Unauthorized
    echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token."));
}
?>