<?php
// Actualizar rutina

// Cabeceras para peticiones desde el frontend
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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
        echo json_encode(array("mensaje" => "Acceso denegado. Token inválido."));
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

// Leer datos JSON
$datos = json_decode(file_get_contents("php://input"));
if (empty($datos->id) || !isset($datos->nombre)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "Datos incompletos. Se requiere 'id' y 'nombre'."));
    die();
}

$id_rutina = $datos->id;
$nombre = trim($datos->nombre);
$dias = isset($datos->dias_semana) ? trim($datos->dias_semana) : null;

// Validaciones
if (mb_strlen($nombre, 'UTF-8') === 0) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "El nombre de la rutina no puede estar vacío."));
    die();
}
if (mb_strlen($nombre, 'UTF-8') > MAX_NOMBRE_RUTINA) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "El nombre no puede exceder los " . MAX_NOMBRE_RUTINA . " caracteres."));
    die();
}
if ($dias !== null && mb_strlen($dias, 'UTF-8') > MAX_DIAS_SEMANA) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "La descripción/días no puede exceder los " . MAX_DIAS_SEMANA . " caracteres."));
    die();
}

// ==================================================================
// Actualizar la rutina
$bd = new Database();
$conexion = $bd->getConnection();

try {
    // Validar propiedad
    $consulta_info = "SELECT id FROM rutinas
                      WHERE id = :rutina_id AND usuario_id = :usuario_id
                      LIMIT 1";
    $stmt_info = $conexion->prepare($consulta_info);
    $stmt_info->bindParam(":rutina_id", $id_rutina, PDO::PARAM_INT);
    $stmt_info->bindParam(":usuario_id", $id_usuario, PDO::PARAM_INT);
    $stmt_info->execute();

    if (!$stmt_info->fetch(PDO::FETCH_ASSOC)) {
        throw new Exception("Rutina no encontrada o no te pertenece.", 404);
    }

    // Actualizar la rutina
    $consulta_update = "UPDATE rutinas
                        SET
                          nombre = :nombre,
                          dias_semana = :dias_semana
                        WHERE
                          id = :rutina_id AND usuario_id = :usuario_id_main";

    $stmt_update = $conexion->prepare($consulta_update);
    $stmt_update->bindParam(":nombre", $nombre);
    $stmt_update->bindParam(":dias_semana", $dias);
    $stmt_update->bindParam(":rutina_id", $id_rutina, PDO::PARAM_INT);
    $stmt_update->bindParam(":usuario_id_main", $id_usuario, PDO::PARAM_INT);

    $stmt_update->execute();
    http_response_code(200);
    echo json_encode(array(
        "mensaje" => "Rutina actualizada.",
        "rutina_info" => array(
            "id" => $id_rutina,
            "nombre" => $nombre,
            "dias_semana" => $dias
        )
    ));

} catch (Exception $e) {
    $codigo = $e->getCode() == 404 ? 404 : 500;
    http_response_code($codigo);
    echo json_encode(array(
        "mensaje" => "Error al actualizar la rutina.",
        "error" => $e->getMessage()
    ));
}
?>