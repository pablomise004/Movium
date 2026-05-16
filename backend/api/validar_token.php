<?php
// Validar token JWT

// Cabeceras para permitir peticiones desde el frontend
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Cargar conexion y libreria JWT
require_once '../config/base_de_datos.php';
require_once '../vendor/autoload.php';
require_once '../config/configuracion_jwt.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key; // Necesario para la v6+ de firebase/jwt

// Clave secreta (la misma que en login.php)
$clave_secreta = JWT_SECRET;

// Obtener el token del header Authorization
$token = null;
$cabecera = $_SERVER['HTTP_AUTHORIZATION'] ?? null;

if ($cabecera) {
    // El header suele ser "Bearer <token>"
    $partes = explode(" ", $cabecera);
    $token = $partes[1] ?? null;
}

if ($token) {
    try {
        // Decodificar el token
        $decodificado = JWT::decode($token, new Key($clave_secreta, 'HS256'));

        // Si es valido, devolver datos de usuario
        http_response_code(200);
        echo json_encode(array(
            "mensaje" => "Acceso concedido.",
            "data" => $decodificado->data
        ));

    } catch (Exception $e) {
        // Si falla (expirado, firma incorrecta, etc.)
        http_response_code(401);
        echo json_encode(array(
            "mensaje" => "Acceso denegado. Token invalido o expirado.",
            "error" => $e->getMessage()
        ));
    }
} else {
    // Si no se proporciona token
    http_response_code(401);
    echo json_encode(array("mensaje" => "Acceso denegado. No se proporciono token."));
}
?>