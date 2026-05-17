<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

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
        echo json_encode(array("mensaje" => "Acceso denegado. Token inválido o expirado."));
        die();
    }
} else {
    http_response_code(401);
    echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token."));
    die();
}

$datos = json_decode(file_get_contents("php://input"));
if (empty($datos->nombre_rutina) || empty($id_usuario)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "Datos incompletos."));
    die();
}

$nombre = trim($datos->nombre_rutina);
$dias = isset($datos->dias_semana) ? trim($datos->dias_semana) : null;

if (strlen($nombre) > 38) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "El nombre de la rutina no puede exceder los 38 caracteres."));
    die();
}
if ($dias !== null && strlen($dias) > 60) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "La descripción/días no puede exceder los 60 caracteres."));
    die();
}

try {
    $bd = new Database();
    $conexion = $bd->getConnection();

    $consulta = "INSERT INTO rutinas (usuario_id, nombre, dias_semana)
                 VALUES (:usuario_id, :nombre, :dias_semana)";
    $sentencia = $conexion->prepare($consulta);
    $sentencia->bindParam(":usuario_id", $id_usuario);
    $sentencia->bindParam(":nombre", $nombre);
    $sentencia->bindParam(":dias_semana", $dias);

    $sentencia->execute();
    $id_rutina = $conexion->lastInsertId();
    http_response_code(201);
    echo json_encode(array(
        "mensaje" => "Rutina creada exitosamente.",
        "rutina" => [
            "id" => $id_rutina,
            "nombre" => $nombre,
            "dias" => $dias
        ]
    ));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error en la base de datos."
    ));
}

?>