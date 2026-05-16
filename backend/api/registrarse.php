<?php
// Registro de usuario

// Cabeceras para peticiones desde frontend
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Cargar conexion y JWT
require_once '../config/base_de_datos.php';
require_once '../vendor/autoload.php';
require_once '../config/configuracion_jwt.php';
use \Firebase\JWT\JWT;

// Preparar conexion a BD y leer body JSON
$baseDatos = new Database();
$conexion = $baseDatos->getConnection();
$datos = json_decode(file_get_contents("php://input"));

// Validar campos minimos
if (empty($datos->nombre_usuario) || empty($datos->password)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "Datos incompletos. Faltan usuario o contraseña."));
    die();
}

// Limpiar datos de entrada
$nombreUsuario = htmlspecialchars(strip_tags($datos->nombre_usuario));
$contrasena = htmlspecialchars(strip_tags($datos->password));

// Validar formato y seguridad
if (strlen($nombreUsuario) > 18) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "El nombre de usuario no puede tener más de 18 caracteres."));
    die();
}

if (strlen($contrasena) > 50) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "La contraseña no puede tener más de 50 caracteres."));
    die();
}

if (strlen($contrasena) < 6) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "La contraseña debe tener al menos 6 caracteres."));
    die();
}

if (!preg_match('/[0-9]/', $contrasena)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "La contraseña debe contener al menos un número."));
    die();
}

if (!preg_match('/[!@#$%^&*()\-_+=.,;:?]/', $contrasena)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "La contraseña debe contener al menos un carácter especial (ej: !@#$...)."));
    die();
}

// Verificar si ya existe ese nombre de usuario
$consultaUsuario = "SELECT id FROM usuarios WHERE nombre_usuario = :nombre_usuario LIMIT 1";
$stmtUsuario = $conexion->prepare($consultaUsuario);
$stmtUsuario->bindParam(':nombre_usuario', $nombreUsuario);
$stmtUsuario->execute();

if ($stmtUsuario->rowCount() > 0) {
    http_response_code(409);
    echo json_encode(array("mensaje" => "Ese nombre de usuario ya está en uso."));
    die();
}

// Hashear contraseña antes de guardar
$hashContrasena = password_hash($contrasena, PASSWORD_BCRYPT);

// Insertar usuario nuevo
$consultaInsert = "INSERT INTO usuarios (nombre_usuario, password_hash) VALUES (:nombre_usuario, :password_hash)";
$stmtInsert = $conexion->prepare($consultaInsert);
$stmtInsert->bindParam(':nombre_usuario', $nombreUsuario);
$stmtInsert->bindParam(':password_hash', $hashContrasena);

if (!$stmtInsert->execute()) {
    http_response_code(503);
    echo json_encode(array("mensaje" => "No se pudo registrar al usuario. Error del servidor."));
    die();
}

// Recuperar id del usuario recien creado
$idUsuarioNuevo = $conexion->lastInsertId();

// Generar token para auto-login despues de registro
$claveSecreta = JWT_SECRET;

$payload = array(
    // Emitido ahora
    "iat" => time(),
    // Caduca en 24 horas
    "exp" => time() + (24 * 60 * 60),
    // Datos para guardar en el token
    "data" => array(
        "id" => $idUsuarioNuevo,
        "nombre_usuario" => $nombreUsuario
    )
);

$token = JWT::encode($payload, $claveSecreta, 'HS256');

// Respuesta de registro correcto
http_response_code(201);
echo json_encode(array(
    "token" => $token,
    "usuario" => array(
        "id" => $idUsuarioNuevo,
        "nombre_usuario" => $nombreUsuario
    )
));
?>