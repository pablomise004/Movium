<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// El navegador hace una peticion previa OPTIONS antes de mandar el token,
// si no la gestionamos aqui devuelve error y no carga el perfil
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/base_de_datos.php';
require_once '../vendor/autoload.php';
require_once '../config/configuracion_jwt.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

$clave_secreta = JWT_SECRET;

$token = null;
$cabecera = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
$id_usuario = null; 

if ($cabecera) {
    $partes = explode(" ", $cabecera);
    $token = $partes[1] ?? null;
}
if ($token) {
    try {
        $decodificado = JWT::decode($token, new Key($clave_secreta, 'HS256'));
        $id_usuario = $decodificado->data->id;
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

try {
    $bd = new Database();
    $conexion = $bd->getConnection();

    $consulta = "SELECT
                  u.nombre_usuario, 
                  u.correo_electronico,
                  p.nombre_real,
                  p.apellidos,
                  p.fecha_nacimiento,
                  p.altura_cm,
                  p.peso_kg,
                  p.telefono,
                  p.direccion
                FROM 
                  usuarios u
                LEFT JOIN 
                  perfiles p ON u.id = p.usuario_id
                WHERE 
                  u.id = :usuario_id
                LIMIT 1";
    
    $sentencia = $conexion->prepare($consulta);
    $sentencia->bindParam(":usuario_id", $id_usuario, PDO::PARAM_INT);
    $sentencia->execute();

    $perfil = $sentencia->fetch(PDO::FETCH_ASSOC);

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
        "mensaje" => "Error en la base de datos."
    ));
}
?>