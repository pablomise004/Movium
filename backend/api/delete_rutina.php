<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

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

$datos = json_decode(file_get_contents("php://input"));

if (empty($datos->id)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "No se especificó el ID de la rutina a borrar."));
    die();
}
$id_rutina = $datos->id;

$bd = new Database();
$conexion = $bd->getConnection();

$consulta_dueno = "SELECT id FROM rutinas WHERE id = :rutina_id AND usuario_id = :usuario_id";
$stmt_check = $conexion->prepare($consulta_dueno);
$stmt_check->bindParam(":rutina_id", $id_rutina, PDO::PARAM_INT);
$stmt_check->bindParam(":usuario_id", $id_usuario, PDO::PARAM_INT);
$stmt_check->execute();

if ($stmt_check->rowCount() == 0) {
    http_response_code(404);
    echo json_encode(array("mensaje" => "Rutina no encontrada o no te pertenece."));
    die();
}

try {
    // CASCADE borra ejercicios y objetivos asociados
    $consulta_borrar = "DELETE FROM rutinas WHERE id = :rutina_id";
    $stmt_delete = $conexion->prepare($consulta_borrar);
    $stmt_delete->bindParam(":rutina_id", $id_rutina, PDO::PARAM_INT);
    $stmt_delete->execute();

    http_response_code(200);
    echo json_encode(array("mensaje" => "Rutina eliminada exitosamente."));

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error al eliminar la rutina."
    ));
}
?>