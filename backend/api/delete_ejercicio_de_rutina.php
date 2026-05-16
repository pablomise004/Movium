<?php
// Borrar ejercicio de una rutina

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
    } catch (Exception $e) { http_response_code(401); echo json_encode(array("mensaje" => "Acceso denegado. Token inválido.")); die(); }
} else { http_response_code(401); echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token.")); die(); }

// Obtener ID a borrar
$datos = json_decode(file_get_contents("php://input"));

if (empty($datos->id)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "No se especificó el ID del ejercicio a borrar."));
    die();
}
$id_ejercicio_rutina = $datos->id;

// Borrar y reordenar
$bd = new Database();
$conexion = $bd->getConnection();

try {
    // Verificar propiedad
    $consulta_info = "SELECT 
                     re.rutina_id, re.orden 
                   FROM rutina_ejercicios re
                   JOIN rutinas ru ON re.rutina_id = ru.id
                   WHERE re.id = :ejercicio_rutina_id AND ru.usuario_id = :usuario_id
                   LIMIT 1";
    $stmt_info = $conexion->prepare($consulta_info);
    $stmt_info->bindParam(":ejercicio_rutina_id", $id_ejercicio_rutina, PDO::PARAM_INT);
    $stmt_info->bindParam(":usuario_id", $id_usuario, PDO::PARAM_INT);
    $stmt_info->execute();
    $datos = $stmt_info->fetch(PDO::FETCH_ASSOC);
    if (!$datos) {
        throw new Exception("Ejercicio no encontrado o no te pertenece.", 404);
    }

    $id_rutina = $datos['rutina_id'];
    $orden_borrado = $datos['orden'];

    // Borrar el ejercicio (ON DELETE CASCADE borra hijos)
    $consulta_borrar = "DELETE FROM rutina_ejercicios WHERE id = :ejercicio_rutina_id";
    $stmt_delete = $conexion->prepare($consulta_borrar);
    $stmt_delete->bindParam(":ejercicio_rutina_id", $id_ejercicio_rutina, PDO::PARAM_INT);
    $stmt_delete->execute();
    
    // Reordenar
    $consulta_reorden = "UPDATE rutina_ejercicios 
                      SET orden = orden - 1 
                      WHERE rutina_id = :rutina_id AND orden > :orden_borrado";
    $stmt_reorder = $conexion->prepare($consulta_reorden);
    $stmt_reorder->bindParam(":rutina_id", $id_rutina, PDO::PARAM_INT);
    $stmt_reorder->bindParam(":orden_borrado", $orden_borrado, PDO::PARAM_INT);
    $stmt_reorder->execute();

    // Devolver la lista actualizada
    $consulta_ejercicios = "SELECT re.id, re.ejercicio_id, re.orden,
                                ej.nombre as nombre_ejercicio, ej.grupo_muscular, ej.tipo
                         FROM rutina_ejercicios re
                         JOIN ejercicios ej ON re.ejercicio_id = ej.id
                         WHERE re.rutina_id = :rutina_id
                         ORDER BY re.orden ASC";
    $stmt_ejercicios = $conexion->prepare($consulta_ejercicios);
    $stmt_ejercicios->bindParam(":rutina_id", $id_rutina, PDO::PARAM_INT);
    $stmt_ejercicios->execute();
    $ejercicios = $stmt_ejercicios->fetchAll(PDO::FETCH_ASSOC);

    if (count($ejercicios) > 0) {
        $ids = [];
        $marcadores = [];
        foreach ($ejercicios as $ej) {
            $ids[] = $ej['id'];
            $marcadores[] = '?';
        }
        $placeholders = implode(',', $marcadores);
        
        // Consulta 2 (Hijos)
        $consulta_objetivos = "SELECT id, rutina_ejercicio_id, num_serie, 
                                   tipo_rep_objetivo, reps_min_objetivo, reps_max_objetivo,
                                   peso_kg_objetivo, tiempo_min_objetivo, 
                                   distancia_km_objetivo,
                                   descanso_seg_post
                            FROM rutina_objetivos
                            WHERE rutina_ejercicio_id IN ($placeholders)
                            ORDER BY num_serie ASC";
        
        $stmt_objetivos = $conexion->prepare($consulta_objetivos);
        $stmt_objetivos->execute($ids);
        $objetivos = $stmt_objetivos->fetchAll(PDO::FETCH_ASSOC);

        // Combinar
        $mapa_objetivos = [];
        foreach ($objetivos as $obj) {
            $mapa_objetivos[$obj['rutina_ejercicio_id']][] = $obj;
        }
        foreach ($ejercicios as $i => $ej) {
            $ej_id = $ej['id'];
            $ejercicios[$i]['objetivos'] = $mapa_objetivos[$ej_id] ?? [];
        }
    }

    http_response_code(200);
    echo json_encode(array(
        "mensaje" => "Ejercicio borrado y rutina reordenada.",
        "ejercicios_actualizados" => $ejercicios
    ));

} catch (Exception $e) {
    $codigo = $e->getCode() == 404 ? 404 : 500;
    http_response_code($codigo);
    echo json_encode(array(
        "mensaje" => "Error al borrar el ejercicio.",
        "error" => $e->getMessage()
    ));
}
?>