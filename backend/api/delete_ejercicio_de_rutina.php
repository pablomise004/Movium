<?php
// ---- backend/api/delete_ejercicio_de_rutina.php (REESCRITO V6.0) ----

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS"); 
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../vendor/autoload.php';
use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

// --- PASO 1: Validación de Token (Sin cambios) ---
$secret_key = "k#f9JLz@p7W!bN8^vG2*qR5sT&eD4hX%uY1aC6oP3zM0xQñ";
$jwt = null;
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
$usuario_id = null; 
if ($authHeader) {
    $arr = explode(" ", $authHeader);
    $jwt = $arr[1] ?? null;
}
if ($jwt) {
    try {
        $decoded = JWT::decode($jwt, new Key($secret_key, 'HS256'));
        $usuario_id = $decoded->data->id;
    } catch (Exception $e) { http_response_code(401); echo json_encode(array("mensaje" => "Acceso denegado. Token inválido.")); die(); }
} else { http_response_code(401); echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token.")); die(); }

// --- PASO 2: Obtener ID a borrar (Sin cambios) ---
$data = json_decode(file_get_contents("php://input"));

if (empty($data->id)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "No se especificó el ID del ejercicio a borrar."));
    die();
}
$ejercicio_rutina_id = $data->id;

// --- PASO 3: Lógica de Borrado y Reordenación (Sin cambios) ---
$database = new Database();
$db = $database->getConnection();

try {
    $db->beginTransaction();
    
    // 1. (SEGURIDAD) Verificar propiedad
    $query_info = "SELECT 
                     re.rutina_id, re.orden 
                   FROM rutina_ejercicios re
                   JOIN rutinas ru ON re.rutina_id = ru.id
                   WHERE re.id = :ejercicio_rutina_id AND ru.usuario_id = :usuario_id
                   LIMIT 1";
    $stmt_info = $db->prepare($query_info);
    $stmt_info->bindParam(":ejercicio_rutina_id", $ejercicio_rutina_id, PDO::PARAM_INT);
    $stmt_info->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
    $stmt_info->execute();
    $info = $stmt_info->fetch(PDO::FETCH_ASSOC);
    if (!$info) {
        throw new Exception("Ejercicio no encontrado o no te pertenece.", 404);
    }
    
    $rutina_id_afectada = $info['rutina_id'];
    $orden_borrado = $info['orden'];

    // 2. BORRAR el ejercicio padre (ON DELETE CASCADE borra hijos)
    $query_delete = "DELETE FROM rutina_ejercicios WHERE id = :ejercicio_rutina_id";
    $stmt_delete = $db->prepare($query_delete);
    $stmt_delete->bindParam(":ejercicio_rutina_id", $ejercicio_rutina_id, PDO::PARAM_INT);
    $stmt_delete->execute();
    
    // 3. REORDENAR ("pull")
    $query_reorder = "UPDATE rutina_ejercicios 
                      SET orden = orden - 1 
                      WHERE rutina_id = :rutina_id AND orden > :orden_borrado";
    $stmt_reorder = $db->prepare($query_reorder);
    $stmt_reorder->bindParam(":rutina_id", $rutina_id_afectada, PDO::PARAM_INT);
    $stmt_reorder->bindParam(":orden_borrado", $orden_borrado, PDO::PARAM_INT);
    $stmt_reorder->execute();

    // 4. Commit
    $db->commit();

    // 5. DEVOLVER LA LISTA ACTUALIZADA (¡¡CAMBIOS V6.0 AQUÍ!!)
    // (Usamos la misma lógica V6.0 de `get_ejercicios_de_rutina.php`)

    // Consulta 1 (Padres)
    $query_ejercicios = "SELECT re.id, re.ejercicio_id, re.orden,
                                ej.nombre as nombre_ejercicio, ej.grupo_muscular, ej.tipo
                         FROM rutina_ejercicios re
                         JOIN ejercicios ej ON re.ejercicio_id = ej.id
                         WHERE re.rutina_id = :rutina_id
                         ORDER BY re.orden ASC";
    $stmt_ejercicios = $db->prepare($query_ejercicios);
    $stmt_ejercicios->bindParam(":rutina_id", $rutina_id_afectada, PDO::PARAM_INT);
    $stmt_ejercicios->execute();
    $ejercicios_actualizados = $stmt_ejercicios->fetchAll(PDO::FETCH_ASSOC);

    if (count($ejercicios_actualizados) > 0) {
        $rutina_ejercicio_ids = array_map(function($ej) { return $ej['id']; }, $ejercicios_actualizados);
        $placeholders = str_repeat('?,', count($rutina_ejercicio_ids) - 1) . '?';
        
        // Consulta 2 (Hijos) - ¡Consulta V6.0!
        $query_objetivos = "SELECT id, rutina_ejercicio_id, num_serie, 
                                   tipo_rep_objetivo, reps_min_objetivo, reps_max_objetivo,
                                   peso_kg_objetivo, tiempo_min_objetivo, 
                                   distancia_km_objetivo
                                   descanso_seg_post
                            FROM rutina_objetivos
                            WHERE rutina_ejercicio_id IN ($placeholders)
                            ORDER BY num_serie ASC";
        
        $stmt_objetivos = $db->prepare($query_objetivos);
        $stmt_objetivos->execute($rutina_ejercicio_ids);
        $objetivos = $stmt_objetivos->fetchAll(PDO::FETCH_ASSOC);

        // Combinar (Sin cambios)
        $objetivos_map = [];
        foreach ($objetivos as $obj) {
            $objetivos_map[$obj['rutina_ejercicio_id']][] = $obj;
        }
        foreach ($ejercicios_actualizados as $i => $ej) {
            $ej_id = $ej['id'];
            $ejercicios_actualizados[$i]['objetivos'] = $objetivos_map[$ej_id] ?? [];
        }
    }

    http_response_code(200);
    echo json_encode(array(
        "mensaje" => "Ejercicio borrado y rutina reordenada.",
        "ejercicios_actualizados" => $ejercicios_actualizados
    ));

} catch (Exception $e) {
    $db->rollBack();
    $codigo = $e->getCode() == 404 ? 404 : 500;
    http_response_code($codigo);
    echo json_encode(array(
        "mensaje" => "Error al borrar el ejercicio.",
        "error" => $e->getMessage()
    ));
}
?>