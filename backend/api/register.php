<?php
// Registro de usuario

// Cabeceras para peticiones desde frontend
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Cargar conexion y JWT
require_once '../config/database.php';
require_once '../vendor/autoload.php';
use \Firebase\JWT\JWT;

// Preparar conexion a BD y leer body JSON
$baseDatos = new Database();
$conexion = $baseDatos->getConnection();
$datos = json_decode(file_get_contents("php://input"));

// Helper para centralizar errores
function responderError($codigo, $mensaje)
{
    http_response_code($codigo);
    echo json_encode(array("mensaje" => $mensaje));
    die();
}

// Validar campos minimos
if (empty($datos->nombre_usuario) || empty($datos->password)) {
    responderError(400, "Datos incompletos. Faltan usuario o contraseña.");
}

// Limpiar datos de entrada
$nombreUsuario = htmlspecialchars(strip_tags($datos->nombre_usuario));
$contrasena = htmlspecialchars(strip_tags($datos->password));

// Validar formato y seguridad
if (mb_strlen($nombreUsuario, 'UTF-8') > 18) {
    responderError(400, "El nombre de usuario no puede tener más de 18 caracteres.");
}

if (strlen($contrasena) > 50) {
    responderError(400, "La contraseña no puede tener más de 50 caracteres.");
}

if (strlen($contrasena) < 6) {
    responderError(400, "La contraseña debe tener al menos 6 caracteres.");
}

if (!preg_match('/[0-9]/', $contrasena)) {
    responderError(400, "La contraseña debe contener al menos un número.");
}

if (!preg_match('/\W/', $contrasena)) {
    responderError(400, "La contraseña debe contener al menos un carácter especial (ej: !@#$...).");
}

// Verificar si ya existe ese nombre de usuario
$consultaUsuario = "SELECT id FROM usuarios WHERE nombre_usuario = :nombre_usuario LIMIT 1";
$stmtUsuario = $conexion->prepare($consultaUsuario);
$stmtUsuario->bindParam(':nombre_usuario', $nombreUsuario);
$stmtUsuario->execute();

if ($stmtUsuario->rowCount() > 0) {
    responderError(409, "Ese nombre de usuario ya está en uso.");
}

// Hashear contraseña antes de guardar
$hashContrasena = password_hash($contrasena, PASSWORD_BCRYPT);

// Insertar usuario nuevo
$consultaInsert = "INSERT INTO usuarios (nombre_usuario, password_hash) VALUES (:nombre_usuario, :password_hash)";
$stmtInsert = $conexion->prepare($consultaInsert);
$stmtInsert->bindParam(':nombre_usuario', $nombreUsuario);
$stmtInsert->bindParam(':password_hash', $hashContrasena);

if (!$stmtInsert->execute()) {
    responderError(503, "No se pudo registrar al usuario. Error del servidor.");
}

// Recuperar id del usuario recien creado
$idUsuarioNuevo = $conexion->lastInsertId();

// Generar token para auto-login despues de registro
$claveSecreta = "k#f9JLz@p7W!bN8^vG2*qR5sT&eD4hX%uY1aC6oP3zM0xQñ";

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