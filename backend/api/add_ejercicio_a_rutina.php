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
if (
    empty($datos->rutina_id) ||
    empty($datos->ejercicio_id) ||
    !isset($datos->objetivos) ||
    !is_array($datos->objetivos)
) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "Datos incompletos. Se requiere 'rutina_id', 'ejercicio_id' y un array 'objetivos'."));
    die();
}

$id_rutina = (int)$datos->rutina_id;
$id_ejercicio = (int)$datos->ejercicio_id;
$objetivos = $datos->objetivos;

$bd = new Database();
$conexion = $bd->getConnection();

try {
    $consulta_padre = "INSERT INTO rutina_ejercicios (rutina_id, ejercicio_id) VALUES (:rutina_id, :ejercicio_id)";
    $stmt_padre = $conexion->prepare($consulta_padre);
    $stmt_padre->bindParam(":rutina_id", $id_rutina, PDO::PARAM_INT);
    $stmt_padre->bindParam(":ejercicio_id", $id_ejercicio, PDO::PARAM_INT);
    $stmt_padre->execute();

    $id_rutina_ejercicio = $conexion->lastInsertId();

    if (count($objetivos) > 0) {
        $consulta_hijo = "INSERT INTO rutina_objetivos 
                            (rutina_ejercicio_id, num_serie, 
                             tipo_rep_objetivo, reps_min_objetivo, reps_max_objetivo, 
                             peso_kg_objetivo, 
                             tiempo_min_objetivo, distancia_km_objetivo,
                             descanso_seg_post) 
                           VALUES 
                            (:re_id, :num_serie, 
                             :tipo_rep, :reps_min, :reps_max, 
                             :peso, :tiempo, :dist, :desc)";
        
        $stmt_hijo = $conexion->prepare($consulta_hijo);

        foreach ($objetivos as $obj) {
            $stmt_hijo->bindValue(":re_id", $id_rutina_ejercicio);
            $stmt_hijo->bindValue(":num_serie", $obj->num_serie ?? 1);
            $stmt_hijo->bindValue(":tipo_rep", $obj->tipo_rep_objetivo ?? 'fijo');
            $stmt_hijo->bindValue(":reps_min", $obj->reps_min_objetivo ?? null);
            $stmt_hijo->bindValue(":reps_max", $obj->reps_max_objetivo ?? null);
            $stmt_hijo->bindValue(":peso", $obj->peso_kg_objetivo ?? null);
            $stmt_hijo->bindValue(":tiempo", $obj->tiempo_min_objetivo ?? null);
            $stmt_hijo->bindValue(":dist", $obj->distancia_km_objetivo ?? null);
            $stmt_hijo->bindValue(":desc", $obj->descanso_seg_post ?? null);
            $stmt_hijo->execute();
        }
    }
    
    $consulta_nuevo = "SELECT re.id, re.ejercicio_id,
                           ej.nombre as nombre_ejercicio, ej.grupo_muscular, ej.tipo
                       FROM rutina_ejercicios re
                       JOIN ejercicios ej ON re.ejercicio_id = ej.id
                       WHERE re.id = :nuevo_id LIMIT 1";

    $stmt_nuevo = $conexion->prepare($consulta_nuevo);
    $stmt_nuevo->bindParam(":nuevo_id", $id_rutina_ejercicio);
    $stmt_nuevo->execute();
    $ejercicio_agregado = $stmt_nuevo->fetch(PDO::FETCH_ASSOC);
    
    $arr_objetivos = [];
    foreach ($objetivos as $obj) {
        $arr_objetivos[] = (array)$obj;
    }
    $ejercicio_agregado['objetivos'] = $arr_objetivos;

    http_response_code(200);
    echo json_encode(array(
        "mensaje" => "Ejercicio añadido a la rutina exitosamente.",
        "ejercicio_agregado" => $ejercicio_agregado
    ));

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error al añadir el ejercicio."
    ));
}
?>