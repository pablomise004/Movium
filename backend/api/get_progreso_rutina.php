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

$token = null;
$cabecera = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
$id_usuario = null;
if ($cabecera) {
    $partes = explode(" ", $cabecera);
    $token = $partes[1] ?? null;
}

if ($token) {
    try {
        $decodificado = JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
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

$rutina_id = $_GET['id'] ?? null;
if (!$rutina_id || !is_numeric($rutina_id)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "No se especificó un ID de rutina válido."));
    die();
}

try {
    $bd = new Database();
    $conexion = $bd->getConnection();

    // Comprobar que la rutina existe y obtener su nombre
    $stmt_info = $conexion->prepare("SELECT nombre FROM rutinas WHERE id = :rutina_id LIMIT 1");
    $stmt_info->bindParam(":rutina_id", $rutina_id, PDO::PARAM_INT);
    $stmt_info->execute();
    $datos_rutina = $stmt_info->fetch();
    if (!$datos_rutina) {
        http_response_code(404);
        echo json_encode(array("mensaje" => "Rutina no encontrada."));
        die();
    }

    // Obtener series de las ultimas sesiones para calcular totales por sesion
    $stmt_grafica = $conexion->prepare(
        "SELECT s.id as sesion_id, DATE(s.fecha_inicio) as fecha,
                sr.repeticiones_realizadas, sr.peso_kg_usado,
                sr.tiempo_min_realizado, sr.distancia_km_realizada,
                e.tipo as tipo_ejercicio
         FROM sesiones_entrenamiento s
         JOIN series_realizadas sr ON s.id = sr.sesion_id
         JOIN ejercicios e ON sr.ejercicio_id = e.id
         WHERE s.usuario_id = :usuario_id AND s.rutina_id = :rutina_id
         ORDER BY s.fecha_inicio DESC
         LIMIT 300"
    );
    $stmt_grafica->bindParam(":usuario_id", $id_usuario, PDO::PARAM_INT);
    $stmt_grafica->bindParam(":rutina_id", $rutina_id, PDO::PARAM_INT);
    $stmt_grafica->execute();
    $series_grafica = $stmt_grafica->fetchAll(PDO::FETCH_ASSOC);

    // juntar las series de cada sesion
    $sesiones_grafica = [];
    foreach ($series_grafica as $serie) {
        $sid = $serie['sesion_id'];
        // buscar si ya tengo esta sesion en el array
        $pos = -1;
        for ($j = 0; $j < count($sesiones_grafica); $j++) {
            if ($sesiones_grafica[$j]['sesion_id'] == $sid) {
                $pos = $j;
                break;
            }
        }
        if ($pos == -1) {
            // sesion nueva, la meto al array
            $sesiones_grafica[] = [
                'sesion_id' => $sid,
                'fecha' => $serie['fecha'],
                'volumen_fuerza' => 0,
                'reps_totales_fuerza' => 0,
                'tiempo_cardio' => 0,
                'distancia_cardio' => 0
            ];
            $pos = count($sesiones_grafica) - 1;
        }
        if ($serie['tipo_ejercicio'] == 'cardio') {
            $sesiones_grafica[$pos]['tiempo_cardio'] += $serie['tiempo_min_realizado'];
            $sesiones_grafica[$pos]['distancia_cardio'] += $serie['distancia_km_realizada'];
        } else {
            $sesiones_grafica[$pos]['volumen_fuerza'] += $serie['repeticiones_realizadas'] * $serie['peso_kg_usado'];
            $sesiones_grafica[$pos]['reps_totales_fuerza'] += $serie['repeticiones_realizadas'];
        }
    }

    if (count($sesiones_grafica) > 30) {
        $sesiones_grafica = array_slice($sesiones_grafica, 0, 30);
    }
    // darle la vuelta (llega de mas reciente a mas antigua)
    $sesiones_grafica = array_reverse($sesiones_grafica);

    for ($i = 0; $i < count($sesiones_grafica); $i++) {
        $sesiones_grafica[$i]['sesion_num'] = $i + 1;
    }

    http_response_code(200);
    echo json_encode(array(
        "rutina_info" => $datos_rutina,
        "grafica" => $sesiones_grafica
    ));

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array("mensaje" => "Error en la base de datos."));
}
?>