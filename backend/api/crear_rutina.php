<?php
// Crear rutina del usuario

// Cabeceras para peticiones desde el frontend
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Cargar conexion y JWT
require_once '../config/base_de_datos.php';
require_once '../vendor/autoload.php';
require_once '../config/configuracion_jwt.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

// Validar token y extraer usuario
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
        echo json_encode(array("mensaje" => "Acceso denegado. Token inválido o expirado.", "error" => $e->getMessage()));
        die();
    }
} else {
    http_response_code(401);
    echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token."));
    die();
}

// Limites de entrada
define("MAX_NOMBRE_RUTINA", 38);
define("MAX_DIAS_SEMANA", 60);

// Leer body JSON
$datos = json_decode(file_get_contents("php://input"));
if (empty($datos->nombre_rutina) || empty($id_usuario)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "Datos incompletos. Se requiere nombre_rutina y un usuario válido."));
    die();
}

// Limpiar datos de entrada
$nombre = trim($datos->nombre_rutina);
$dias = isset($datos->dias_semana) ? trim($datos->dias_semana) : null;

// Validar longitudes
if (strlen($nombre) > MAX_NOMBRE_RUTINA) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "El nombre de la rutina no puede exceder los " . MAX_NOMBRE_RUTINA . " caracteres."));
    die();
}
if ($dias !== null && strlen($dias) > MAX_DIAS_SEMANA) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "La descripción/días no puede exceder los " . MAX_DIAS_SEMANA . " caracteres."));
    die();
}

// Preparar la conexion a la BBDD
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
        "mensaje" => "Error en la base de datos.",
        "error" => $e->getMessage()
    ));
}

?>