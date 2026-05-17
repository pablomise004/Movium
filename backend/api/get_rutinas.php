<?php
// Obtener rutinas del usuario

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

$bd = new Database();
$conexion = $bd->getConnection();

$consulta = "SELECT r.id, r.nombre, r.dias_semana as dias,
                    (SELECT MAX(fecha_inicio) FROM sesiones_entrenamiento
                     WHERE rutina_id = r.id AND usuario_id = :usuario_id) as ultima_sesion
              FROM rutinas r
              WHERE r.usuario_id = :usuario_id2
              ORDER BY r.fecha_creacion DESC";

$sentencia = $conexion->prepare($consulta);
$sentencia->bindParam(":usuario_id", $id_usuario, PDO::PARAM_INT);
$sentencia->bindParam(":usuario_id2", $id_usuario, PDO::PARAM_INT);
$sentencia->execute();

$filas = $sentencia->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode($filas);
?>
