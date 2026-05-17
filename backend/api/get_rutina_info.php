<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// El navegador primero comprueba con OPTIONS si puede hacer la peticion real
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

$rutina_id = $_GET['id'] ?? null;
if (!$rutina_id) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "No se especificó un ID de rutina."));
    die();
}

try {
    $bd = new Database();
    $conexion = $bd->getConnection();

    $consulta = "SELECT id, nombre, dias_semana
                 FROM rutinas
                 WHERE id = :rutina_id AND usuario_id = :usuario_id
                 LIMIT 1";

    $sentencia = $conexion->prepare($consulta);
    $sentencia->bindParam(":rutina_id", $rutina_id, PDO::PARAM_INT);
    $sentencia->bindParam(":usuario_id", $id_usuario, PDO::PARAM_INT);
    $sentencia->execute();

    $rutina = $sentencia->fetch(PDO::FETCH_ASSOC);
    if ($rutina) {
        http_response_code(200);
        echo json_encode($rutina);
    } else {
        http_response_code(404);
        echo json_encode(array("mensaje" => "Rutina no encontrada o no te pertenece."));
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error en la base de datos."
    ));
}
?>