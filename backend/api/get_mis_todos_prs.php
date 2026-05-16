<?php
// Obtener todos los PRs del usuario

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// El navegador manda OPTIONS antes del GET real para ver si el servidor lo permite.
// Si no respondes aqui con 200 te falla todo por CORS aunque el GET estuviera bien.
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
        http_response_code(401); echo json_encode(array("mensaje" => "Acceso denegado. Token inválido.")); die();
    }
} else {
    http_response_code(401); echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token.")); die();
}

$bd = new Database();
$conexion = $bd->getConnection();

try {
    // Obtener los máximos de peso, reps, tiempo y distancia por ejercicio
    $consulta = "
        SELECT
            e.id as ejercicio_id,
            e.nombre,
            e.tipo,
            e.grupo_muscular,
            MAX(sr.peso_kg_usado) as max_peso,
            MAX(sr.repeticiones_realizadas) as max_reps,
            MAX(sr.tiempo_min_realizado) as max_tiempo,
            MAX(sr.distancia_km_realizada) as max_dist
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

    // Calcular velocidad aproximada y normalizar nulls
    for ($i = 0; $i < count($prs); $i++) {
        $prs[$i]['max_peso']   = $prs[$i]['max_peso']   ?? null;
        $prs[$i]['max_reps']   = $prs[$i]['max_reps']   ?? null;
        $prs[$i]['max_tiempo'] = $prs[$i]['max_tiempo'] ?? null;
        $prs[$i]['max_dist']   = $prs[$i]['max_dist']   ?? null;

        if ($prs[$i]['max_tiempo'] > 0 && $prs[$i]['max_dist'] > 0) {
            $tiempo_horas = $prs[$i]['max_tiempo'] / 60;
            $prs[$i]['max_velocidad_media'] = round($prs[$i]['max_dist'] / $tiempo_horas, 1);
        } else {
            $prs[$i]['max_velocidad_media'] = null;
        }
    }

    http_response_code(200);
    echo json_encode($prs);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error al obtener tus PRs.",
        "error" => $e->getMessage()
    ));
}
?>
