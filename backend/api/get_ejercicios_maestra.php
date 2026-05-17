<?php
// Obtener lista maestra de ejercicios

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/base_de_datos.php';

$bd = new Database();
$conexion = $bd->getConnection();

$consulta = "SELECT id, nombre, grupo_muscular, tipo
             FROM ejercicios
             ORDER BY nombre ASC";

$sentencia = $conexion->prepare($consulta);
$sentencia->execute();

$ejercicios = $sentencia->fetchAll(PDO::FETCH_ASSOC);

http_response_code(200);
echo json_encode($ejercicios);
?>
