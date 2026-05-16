<?php
// Finalizar entrenamiento

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/base_de_datos.php';
require_once '../vendor/autoload.php';
require_once '../config/configuracion_jwt.php';
use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

$clave_secreta = JWT_SECRET;

// Sacar el token del header
$id_usuario = null;
$tokenJWT = null;

if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $partes = explode(" ", $_SERVER['HTTP_AUTHORIZATION']);
    if (count($partes) === 2) {
        $tokenJWT = $partes[1];
    }
}

if ($tokenJWT === null) {
    http_response_code(401);
    echo json_encode(["mensaje" => "No se ha proporcionado token."]);
    exit();
}

try {
    $datos_token = JWT::decode($tokenJWT, new Key($clave_secreta, 'HS256'));
    $id_usuario = $datos_token->data->id;
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["mensaje" => "Token no válido o caducado."]);
    exit();
}

// Leer datos de entrada
$datos = json_decode(file_get_contents('php://input'));

if (!$datos || !isset($datos->rutina_id) || !is_numeric($datos->rutina_id) || !isset($datos->series) || !is_array($datos->series)) {
    http_response_code(400);
    echo json_encode(["mensaje" => "Datos incompletos."]);
    exit();
}

$id_rutina = (int)$datos->rutina_id;
$series = $datos->series;
$notas = isset($datos->notas_sesion) ? trim($datos->notas_sesion) : null;

try {
    $bd = new Database();
    $conexion = $bd->getConnection();

    // Crear la sesión de entrenamiento
    $consulta_sesion = "INSERT INTO sesiones_entrenamiento (usuario_id, rutina_id, fecha_inicio, fecha_fin, notas_sesion) VALUES (?, ?, NOW(), NOW(), ?)";
    $stmt_sesion = $conexion->prepare($consulta_sesion);
    $stmt_sesion->execute([$id_usuario, $id_rutina, $notas]);
    $id_sesion = $conexion->lastInsertId();

    // Insertar las series realizadas
    if (!empty($series)) {
        $consulta_serie = "INSERT INTO series_realizadas (sesion_id, ejercicio_id, orden_ejercicio_rutina, num_serie, repeticiones_realizadas, fue_al_fallo, peso_kg_usado, tiempo_min_realizado, distancia_km_realizada, notas_serie) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt_serie = $conexion->prepare($consulta_serie);

        foreach ($series as $serie) {
            $id_ej    = (int)$serie->ejercicio_id;
            $orden    = isset($serie->orden_ejercicio_rutina) ? (int)$serie->orden_ejercicio_rutina : 1;
            $num_serie = (int)$serie->num_serie;
            $reps     = isset($serie->repeticiones_realizadas) ? (int)$serie->repeticiones_realizadas : null;
            $fallo    = (isset($serie->fue_al_fallo) && $serie->fue_al_fallo) ? 1 : 0;
            $peso     = isset($serie->peso_kg_usado) ? (float)$serie->peso_kg_usado : null;
            $tiempo   = isset($serie->tiempo_min_realizado) ? (int)$serie->tiempo_min_realizado : null;
            $dist     = isset($serie->distancia_km_realizada) ? (float)$serie->distancia_km_realizada : null;
            $notas_serie = isset($serie->notas_serie) ? trim($serie->notas_serie) : null;

            // bindValue explícito para controlar el tipo exacto de cada parámetro
            // así MySQL no confunde el 0/1 de fue_al_fallo con una cadena de texto
            $stmt_serie->bindValue(1, $id_sesion,   PDO::PARAM_INT);
            $stmt_serie->bindValue(2, $id_ej,       PDO::PARAM_INT);
            $stmt_serie->bindValue(3, $orden,       PDO::PARAM_INT);
            $stmt_serie->bindValue(4, $num_serie,   PDO::PARAM_INT);
            $stmt_serie->bindValue(5, $reps,        $reps   === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $stmt_serie->bindValue(6, $fallo,       PDO::PARAM_INT);
            $stmt_serie->bindValue(7, $peso,        $peso   === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $stmt_serie->bindValue(8, $tiempo,      $tiempo === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $stmt_serie->bindValue(9, $dist,        $dist   === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $stmt_serie->bindValue(10, $notas_serie, $notas_serie === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
            $stmt_serie->execute();
        }
    }

    http_response_code(201);
    echo json_encode(["mensaje" => "Entrenamiento guardado con éxito.", "sesion_id" => (int)$id_sesion]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["mensaje" => "Error al guardar entrenamiento: " . $e->getMessage()]);
}
?>
