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

$conexion = (new Database())->getConnection();
$datos = json_decode(file_get_contents("php://input"));

if (empty($datos->nombre_usuario) || empty($datos->password)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "Datos incompletos."));
    die();
}

$nombreUsuario = $datos->nombre_usuario;
$contrasena = $datos->password;

$consulta = "SELECT id, nombre_usuario, password_hash
             FROM usuarios
             WHERE nombre_usuario = :nombre_usuario
             LIMIT 1";

$stmt = $conexion->prepare($consulta);
$stmt->bindParam(':nombre_usuario', $nombreUsuario);
$stmt->execute();

if ($stmt->rowCount() === 0) {
    http_response_code(401);
    echo json_encode(array("mensaje" => "Usuario no encontrado."));
    die();
}

$usuario = $stmt->fetch(PDO::FETCH_ASSOC);

if (!password_verify($contrasena, $usuario['password_hash'])) {
    http_response_code(401);
    echo json_encode(array("mensaje" => "Contraseña incorrecta."));
    die();
}

$claveSecreta = JWT_SECRET;
$payload = array(
    "iat" => time(),
    "exp" => time() + (24 * 60 * 60),
    "data" => array(
        "id" => $usuario['id'],
        "nombre_usuario" => $usuario['nombre_usuario']
    )
);

$token = JWT::encode($payload, $claveSecreta, 'HS256');

http_response_code(200);
echo json_encode(array(
    "token" => $token,
    "usuario" => array(
        "id" => $usuario['id'],
        "nombre_usuario" => $usuario['nombre_usuario']
    )
));
?>