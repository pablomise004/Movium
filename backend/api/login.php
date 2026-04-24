<?php
// Inicio de sesion por nombre de usuario

// Cabeceras para permitir peticiones desde el frontend
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Cargar conexion a BD y libreria JWT
require_once '../config/database.php';
require_once '../vendor/autoload.php';

use \Firebase\JWT\JWT;

// Preparar conexion y leer JSON del body
$baseDatos = new Database();
$conexion = $baseDatos->getConnection();
$datos = json_decode(file_get_contents("php://input"));

// Helper para responder error y terminar ejecucion
function responderErrorLogin($codigo, $mensaje)
{
    http_response_code($codigo);
    echo json_encode(array("mensaje" => $mensaje));
    die();
}

// Validar entrada minima
if (empty($datos->nombre_usuario) || empty($datos->password)) {
    responderErrorLogin(400, "Datos incompletos.");
}

// Limpiar datos de entrada
$nombreUsuario = htmlspecialchars(strip_tags($datos->nombre_usuario));
$contrasena = htmlspecialchars(strip_tags($datos->password));

// Buscar usuario por nombre (sin login por email)
$consulta = "SELECT id, nombre_usuario, password_hash
             FROM usuarios
             WHERE nombre_usuario = :nombre_usuario
             LIMIT 1";

// Ejecutar consulta preparada para evitar SQL injection
$stmt = $conexion->prepare($consulta);
$stmt->bindParam(':nombre_usuario', $nombreUsuario);
$stmt->execute();

// Si no existe el usuario, devolver 401
if ($stmt->rowCount() === 0) {
    responderErrorLogin(401, "Usuario no encontrado.");
}

// Leer fila del usuario encontrado
$usuario = $stmt->fetch(PDO::FETCH_ASSOC);

// Comparar password enviada vs hash guardado
if (!password_verify($contrasena, $usuario['password_hash'])) {
    responderErrorLogin(401, "Contraseña incorrecta.");
}

// Si todo va bien, generar token JWT
$claveSecreta = "k#f9JLz@p7W!bN8^vG2*qR5sT&eD4hX%uY1aC6oP3zM0xQñ";
$payload = array(
    // Fecha de emision del token
    "iat" => time(),
    // Fecha de expiracion (24h)
    "exp" => time() + (24 * 60 * 60),
    // Datos de usuario para guardar en el token
    "data" => array(
        "id" => $usuario['id'],
        "nombre_usuario" => $usuario['nombre_usuario']
    )
);

$token = JWT::encode($payload, $claveSecreta, 'HS256');

// Respuesta final de login correcto
http_response_code(200);
echo json_encode(array(
    "token" => $token,
    "usuario" => array(
        "id" => $usuario['id'],
        "nombre_usuario" => $usuario['nombre_usuario']
    )
));
?>