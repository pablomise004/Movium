<?php
// Obtener todos los PRs del usuario

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

// sacar el token del header
$token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION'] ?? '');
if (!$token) {
    http_response_code(401);
    echo json_encode(["mensaje" => "Sin token."]);
    die();
}
try {
    $decoded = JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
    $id_usuario = $decoded->data->id;
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["mensaje" => "Token no válido."]);
    die();
}

$bd = new Database();
$conexion = $bd->getConnection();

try {
    $consulta = "
        SELECT
            e.id as ejercicio_id,
            e.nombre,
            e.tipo,
            e.grupo_muscular,
            MAX(sr.peso_kg_usado) as max_peso,
            MAX(sr.repeticiones_realizadas) as max_reps,
            MAX(sr.tiempo_min_realizado) as max_tiempo,
            MAX(sr.distancia_km_realizada) as max_dist,
            ROUND(MAX(
                CASE
                    WHEN sr.repeticiones_realizadas > 0 AND sr.peso_kg_usado > 0
                    THEN sr.peso_kg_usado * (1 + sr.repeticiones_realizadas / 30.0)
                    ELSE NULL
                END
            ), 1) as max_e1rm
        FROM ejercicios e
        JOIN series_realizadas sr ON e.id = sr.ejercicio_id
        JOIN sesiones_entrenamiento s ON sr.sesion_id = s.id
        WHERE s.usuario_id = :usuario_id
          AND (sr.peso_kg_usado > 0 OR sr.repeticiones_realizadas > 0 OR sr.tiempo_min_realizado > 0 OR sr.distancia_km_realizada > 0)
        GROUP BY e.id, e.nombre, e.tipo, e.grupo_muscular
        ORDER BY e.nombre ASC
    ";
    $sentencia = $conexion->prepare($consulta);
    $sentencia->bindParam(":usuario_id", $id_usuario, PDO::PARAM_INT);
    $sentencia->execute();
    $prs = $sentencia->fetchAll(PDO::FETCH_ASSOC);

    // calcular velocidad en km/h
    for ($i = 0; $i < count($prs); $i++) {
        if ($prs[$i]['max_tiempo'] > 0 && $prs[$i]['max_dist'] > 0) {
            $vel = ($prs[$i]['max_dist'] / $prs[$i]['max_tiempo']) * 60;
            $prs[$i]['max_velocidad_media'] = round($vel, 2);
        } else {
            $prs[$i]['max_velocidad_media'] = null;
        }
    }

    http_response_code(200);
    echo json_encode($prs);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error al obtener tus PRs."
    ));
}
?>