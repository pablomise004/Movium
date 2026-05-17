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

$baseDatos = new Database();
$conexion = $baseDatos->getConnection();
$datos = json_decode(file_get_contents("php://input"));

if (empty($datos->nombre_usuario) || empty($datos->password)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "Datos incompletos. Faltan usuario o contraseña."));
    die();
}

$nombreUsuario = $datos->nombre_usuario;
$contrasena = $datos->password;

if (strlen($nombreUsuario) > 18) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "El nombre de usuario no puede tener más de 18 caracteres."));
    die();
}

if (strlen($contrasena) < 6) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "La contraseña debe tener al menos 6 caracteres."));
    die();
}

if (strlen($contrasena) > 50) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "La contraseña no puede tener más de 50 caracteres."));
    die();
}

$consultaUsuario = "SELECT id FROM usuarios WHERE nombre_usuario = :nombre_usuario LIMIT 1";
$stmtUsuario = $conexion->prepare($consultaUsuario);
$stmtUsuario->bindParam(':nombre_usuario', $nombreUsuario);
$stmtUsuario->execute();

if ($stmtUsuario->rowCount() > 0) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "Ese nombre de usuario ya está en uso."));
    die();
}

$hashContrasena = password_hash($contrasena, PASSWORD_BCRYPT);

$consultaInsert = "INSERT INTO usuarios (nombre_usuario, password_hash) VALUES (:nombre_usuario, :password_hash)";
$stmtInsert = $conexion->prepare($consultaInsert);
$stmtInsert->bindParam(':nombre_usuario', $nombreUsuario);
$stmtInsert->bindParam(':password_hash', $hashContrasena);

if (!$stmtInsert->execute()) {
    http_response_code(500);
    echo json_encode(array("mensaje" => "No se pudo registrar al usuario. Error del servidor."));
    die();
}

$idUsuarioNuevo = $conexion->lastInsertId();

$claveSecreta = JWT_SECRET;
$payload = array(
    "iat" => time(),
    "exp" => time() + (24 * 60 * 60),
    "data" => array(
        "id" => $idUsuarioNuevo,
        "nombre_usuario" => $nombreUsuario
    )
);

$token = JWT::encode($payload, $claveSecreta, 'HS256');

http_response_code(200);
echo json_encode(array(
    "token" => $token,
    "usuario" => array(
        "id" => $idUsuarioNuevo,
        "nombre_usuario" => $nombreUsuario
    )
));
?>