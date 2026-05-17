<?php
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
        echo json_encode(array("mensaje" => "Acceso denegado. Token inválido.")); die();
    }
} else {
    http_response_code(401);
    echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token.")); die();
}

$id_rutina = $_GET['id'] ?? null;
if (!$id_rutina) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "No se especificó un ID de rutina."));
    die();
}

try {
    $bd = new Database();
    $conexion = $bd->getConnection();

    $consulta_ejercicios = "SELECT re.id, re.ejercicio_id,
                                ej.nombre as nombre_ejercicio, ej.grupo_muscular, ej.tipo
                            FROM rutina_ejercicios re
                            JOIN ejercicios ej ON re.ejercicio_id = ej.id
                            JOIN rutinas ru ON re.rutina_id = ru.id
                            WHERE re.rutina_id = :rutina_id AND ru.usuario_id = :usuario_id
                            ORDER BY re.id ASC";
    $stmt_ejercicios = $conexion->prepare($consulta_ejercicios);
    $stmt_ejercicios->bindParam(":rutina_id", $id_rutina, PDO::PARAM_INT);
    $stmt_ejercicios->bindParam(":usuario_id", $id_usuario, PDO::PARAM_INT);
    $stmt_ejercicios->execute();
    
    $ejercicios = $stmt_ejercicios->fetchAll(PDO::FETCH_ASSOC);

    if (count($ejercicios) > 0) {
        $ids = [];
        foreach ($ejercicios as $ej) {
            $ids[] = $ej['id'];
        }
        $ids_str = implode(',', $ids);

        $consulta_objetivos = "SELECT id, rutina_ejercicio_id, num_serie, tipo_rep_objetivo,
                                reps_min_objetivo, reps_max_objetivo, peso_kg_objetivo,
                                tiempo_min_objetivo, distancia_km_objetivo, descanso_seg_post
                            FROM rutina_objetivos
                            WHERE rutina_ejercicio_id IN ($ids_str)
                            ORDER BY num_serie ASC";
        $stmt_objetivos = $conexion->query($consulta_objetivos);
        $objetivos = $stmt_objetivos->fetchAll(PDO::FETCH_ASSOC);

        foreach ($ejercicios as $i => $ej) {
            $ejercicios[$i]['objetivos'] = [];
            foreach ($objetivos as $obj) {
                if ($obj['rutina_ejercicio_id'] == $ej['id']) {
                    $ejercicios[$i]['objetivos'][] = $obj;
                }
            }
        }
    }

    http_response_code(200);
    echo json_encode($ejercicios);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error al obtener los ejercicios de la rutina."
    ));
}
?>