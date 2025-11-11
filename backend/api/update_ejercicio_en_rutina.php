<?php
// ---- backend/api/update_ejercicio_en_rutina.php (REESCRITO V6.0) ----

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
if ($authHeader) { $arr = explode(" ", $authHeader); $jwt = $arr[1] ?? null; }
if ($jwt) {
    try { $decoded = JWT::decode($jwt, new Key($secret_key, 'HS256')); $usuario_id = $decoded->data->id; } 
    catch (Exception $e) { http_response_code(401); echo json_encode(array("mensaje" => "Acceso denegado. Token inválido.")); die(); }
} else { http_response_code(401); echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token.")); die(); }

// --- PASO 2: Obtener datos JSON (Sin cambios) ---
$data = json_decode(file_get_contents("php://input"));
if (empty($data->id) || !isset($data->orden) || !isset($data->objetivos) || !is_array($data->objetivos)) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "Datos incompletos. Se requiere 'id' (del ejercicio), 'orden' y un array 'objetivos'."));
    die();
}

$ejercicio_rutina_id = $data->id;
$nuevo_orden = (int)$data->orden;
$objetivos = $data->objetivos; // El array de objetivos actualizado

// --- PASO 3: Lógica de Actualización V6.0 (CON TRANSACCIÓN) ---
$database = new Database();
$db = $database->getConnection();

try {
    $db->beginTransaction();

    // 1. (SEGURIDAD) Verificar propiedad (Sin cambios)
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
    
    $rutina_id = $info['rutina_id'];
    $antiguo_orden = (int)$info['orden'];

    // 2. Lógica de Reordenación (Push/Pull) (Sin cambios)
    if ($nuevo_orden != $antiguo_orden) {
        $query_max = "SELECT MAX(orden) as max_orden FROM rutina_ejercicios WHERE rutina_id = :rutina_id";
        $stmt_max = $db->prepare($query_max);
        $stmt_max->bindParam(":rutina_id", $rutina_id);
        $stmt_max->execute();
        $max_orden = (int)$stmt_max->fetch(PDO::FETCH_ASSOC)['max_orden'];
        
        if ($nuevo_orden > $max_orden) { $nuevo_orden = $max_orden; }
        if ($nuevo_orden < 1) { $nuevo_orden = 1; }

        if ($nuevo_orden < $antiguo_orden) {
            $query_shift = "UPDATE rutina_ejercicios SET orden = orden + 1 
                            WHERE rutina_id = :rutina_id AND orden >= :nuevo_orden AND orden < :antiguo_orden";
        } else {
            $query_shift = "UPDATE rutina_ejercicios SET orden = orden - 1 
                            WHERE rutina_id = :rutina_id AND orden > :antiguo_orden AND orden <= :nuevo_orden";
        }
        $stmt_shift = $db->prepare($query_shift);
        $stmt_shift->bindParam(":rutina_id", $rutina_id);
        $stmt_shift->bindParam(":nuevo_orden", $nuevo_orden);
        $stmt_shift->bindParam(":antiguo_orden", $antiguo_orden);
        $stmt_shift->execute();
    }

    // 3. ACTUALIZAR el orden del ejercicio padre (Sin cambios)
    $query_update_padre = "UPDATE rutina_ejercicios SET orden = :orden WHERE id = :id";
    $stmt_update_padre = $db->prepare($query_update_padre);
    $stmt_update_padre->bindParam(":orden", $nuevo_orden);
    $stmt_update_padre->bindParam(":id", $ejercicio_rutina_id);
    $stmt_update_padre->execute();

    // 4. ---- LÓGICA V6.0: Borrar y Re-insertar objetivos ----
    
    // 4a. Borrar TODOS los objetivos hijos ANTIGUOS
    $query_delete_hijos = "DELETE FROM rutina_objetivos WHERE rutina_ejercicio_id = :re_id";
    $stmt_delete_hijos = $db->prepare($query_delete_hijos);
    $stmt_delete_hijos->bindParam(":re_id", $ejercicio_rutina_id);
    $stmt_delete_hijos->execute();

    // 4b. Re-insertar TODOS los objetivos hijos NUEVOS (¡¡CAMBIOS V6.0 AQUÍ!!)
    if (count($objetivos) > 0) {
        // ¡Consulta actualizada a V6.0!
        $query_hijo = "INSERT INTO rutina_objetivos 
                        (rutina_ejercicio_id, num_serie, 
                         /* --- CAMPOS V6.0 --- */
                         tipo_rep_objetivo, reps_min_objetivo, reps_max_objetivo, 
                         /* ----------------- */
                         peso_kg_objetivo, 
                         tiempo_min_objetivo, distancia_km_objetivo,
                         descanso_seg_post) 
                       VALUES 
                        (:re_id, :num_serie, 
                         /* --- PARAMS V6.0 --- */
                         :tipo_rep, :reps_min, :reps_max, 
                         /* ----------------- */
                         :peso, :tiempo, :dist, :desc)";
        
        $stmt_hijo = $db->prepare($query_hijo);
        
        foreach ($objetivos as $obj) {
            // Asumimos que $obj es un stdClass (de json_decode)
            $stmt_hijo->bindValue(":re_id", $ejercicio_rutina_id);
            $stmt_hijo->bindValue(":num_serie", $obj->num_serie ?? 1);
            
            // --- ¡CAMBIOS V6.0 AQUÍ! ---
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
    // ---- Fin Lógica V6.0 ----

    // 5. Confirmar la transacción
    $db->commit();

    // 6. DEVOLVER LA LISTA ACTUALIZADA (¡¡CAMBIOS V6.0 AQUÍ!!)
    // (Usamos la misma lógica V6.0 de `get_ejercicios_de_rutina.php`)
    
    // Consulta 1 (Padres)
    $query_ejercicios = "SELECT re.id, re.ejercicio_id, re.orden,
                                ej.nombre as nombre_ejercicio, ej.grupo_muscular, ej.tipo
                         FROM rutina_ejercicios re
                         JOIN ejercicios ej ON re.ejercicio_id = ej.id
                         WHERE re.rutina_id = :rutina_id
                         ORDER BY re.orden ASC";
    $stmt_ejercicios = $db->prepare($query_ejercicios);
    $stmt_ejercicios->bindParam(":rutina_id", $rutina_id, PDO::PARAM_INT);
    $stmt_ejercicios->execute();
    $ejercicios_actualizados = $stmt_ejercicios->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($ejercicios_actualizados) > 0) {
        $rutina_ejercicio_ids = array_map(function($ej) { return $ej['id']; }, $ejercicios_actualizados);
        $placeholders = str_repeat('?,', count($rutina_ejercicio_ids) - 1) . '?';
        
        // Consulta 2 (Hijos) - ¡Consulta V6.0!
        $query_objetivos = "SELECT id, rutina_ejercicio_id, num_serie, 
                                   tipo_rep_objetivo, reps_min_objetivo, reps_max_objetivo,
                                   peso_kg_objetivo, tiempo_min_objetivo, 
                                   distancia_km_objetivo,
                                   descanso_seg_post
                            FROM rutina_objetivos
                            WHERE rutina_ejercicio_id IN ($placeholders)
                            ORDER BY num_serie ASC";
        
        $stmt_objetivos = $db->prepare($query_objetivos);
        $stmt_objetivos->execute($rutina_ejercicio_ids);
        $objetivos_db = $stmt_objetivos->fetchAll(PDO::FETCH_ASSOC);

        // Combinar (Sin cambios)
        $objetivos_map = [];
        foreach ($objetivos_db as $obj_db) {
            $objetivos_map[$obj_db['rutina_ejercicio_id']][] = $obj_db;
        }
        foreach ($ejercicios_actualizados as $i => $ej) {
            $ej_id = $ej['id'];
            $ejercicios_actualizados[$i]['objetivos'] = $objetivos_map[$ej_id] ?? [];
        }
    }

    http_response_code(200);
    echo json_encode(array(
        "mensaje" => "Ejercicio actualizado y rutina reordenada.",
        "ejercicios_actualizados" => $ejercicios_actualizados
    ));

} catch (Exception $e) {
    $db->rollBack();
    $codigo = $e->getCode() == 404 ? 404 : 500;
    http_response_code($codigo);
    echo json_encode(array(
        "mensaje" => "Error al actualizar el ejercicio.",
        "error" => $e->getMessage()
    ));
}
?>