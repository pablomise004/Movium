<?php
// ---- backend/api/add_ejercicio_a_rutina.php (REESCRITO V6.0) ----

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

// --- PASO 2: Obtener Datos (Sin cambios) ---
$data = json_decode(file_get_contents("php://input"));
if (
    empty($data->rutina_id) ||
    empty($data->ejercicio_id) ||
    !isset($data->objetivos) || 
    !is_array($data->objetivos)
) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "Datos incompletos. Se requiere 'rutina_id', 'ejercicio_id' y un array 'objetivos'."));
    die();
}

$rutina_id = $data->rutina_id;
$ejercicio_id = $data->ejercicio_id;
$objetivos = $data->objetivos; 

// --- PASO 3: Lógica de Inserción (Transacción) ---
$database = new Database();
$db = $database->getConnection();

try {
    $db->beginTransaction();

    // 1. Comprobación de dueño (Sin cambios)
    $check_query = "SELECT usuario_id FROM rutinas WHERE id = :rutina_id LIMIT 1";
    $stmt_check = $db->prepare($check_query);
    $stmt_check->bindParam(":rutina_id", $rutina_id, PDO::PARAM_INT);
    $stmt_check->execute();
    $rutina_owner = $stmt_check->fetch(PDO::FETCH_ASSOC);
    if (!$rutina_owner || $rutina_owner['usuario_id'] != $usuario_id) {
        throw new Exception("Acción no permitida. No eres el dueño de esta rutina.", 403);
    }
    
    // 2. Calcular 'orden' (Sin cambios)
    $query_orden = "SELECT MAX(orden) as max_orden FROM rutina_ejercicios WHERE rutina_id = :rutina_id";
    $stmt_orden = $db->prepare($query_orden);
    $stmt_orden->bindParam(":rutina_id", $rutina_id);
    $stmt_orden->execute();
    $resultado_orden = $stmt_orden->fetch(PDO::FETCH_ASSOC);
    $orden = ($resultado_orden['max_orden'] ?? 0) + 1;

    // 3. INSERTAR en `rutina_ejercicios` (Sin cambios)
    $query_padre = "INSERT INTO rutina_ejercicios (rutina_id, ejercicio_id, orden) 
                    VALUES (:rutina_id, :ejercicio_id, :orden)";
    $stmt_padre = $db->prepare($query_padre);
    $stmt_padre->bindParam(":rutina_id", $rutina_id);
    $stmt_padre->bindParam(":ejercicio_id", $ejercicio_id);
    $stmt_padre->bindParam(":orden", $orden);
    $stmt_padre->execute();

    // 4. Obtener ID (Sin cambios)
    $rutina_ejercicio_id = $db->lastInsertId();

    // 5. INSERTAR objetivos en `rutina_objetivos` (¡¡CAMBIOS V6.0 AQUÍ!!)
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

        // 6. Iteramos sobre el array de objetivos
        foreach ($objetivos as $obj) {
            
            // --- ¡CAMBIOS V6.0 AQUÍ! ---
            // Asumimos que React envía $obj->tipo_rep_objetivo, $obj->reps_min_objetivo, etc.
            
            $stmt_hijo->bindValue(":re_id", $rutina_ejercicio_id);
            $stmt_hijo->bindValue(":num_serie", $obj->num_serie ?? 1);
            
            // Campos V6.0 (Fuerza)
            $stmt_hijo->bindValue(":tipo_rep", $obj->tipo_rep_objetivo ?? 'fijo');
            $stmt_hijo->bindValue(":reps_min", $obj->reps_min_objetivo ?? null);
            $stmt_hijo->bindValue(":reps_max", $obj->reps_max_objetivo ?? null);
            
            // Campo Peso (Sin cambio)
            $stmt_hijo->bindValue(":peso", $obj->peso_kg_objetivo ?? null);

            // Campos Cardio (Sin cambio)
            $stmt_hijo->bindValue(":tiempo", $obj->tiempo_min_objetivo ?? null);
            $stmt_hijo->bindValue(":dist", $obj->distancia_km_objetivo ?? null);
            
            // Campo Descanso (Sin cambio)
            $stmt_hijo->bindValue(":desc", $obj->descanso_seg_post ?? null);
            
            $stmt_hijo->execute();
        }
    }
    
    // 7. Commit (Sin cambios)
    $db->commit();

    // 8. Devolver el objeto recién creado (Sin cambios)
    $query_nuevo = "SELECT 
                        re.id, re.ejercicio_id, re.orden,
                        ej.nombre as nombre_ejercicio, ej.grupo_muscular, ej.tipo
           
                     FROM rutina_ejercicios re
                    JOIN ejercicios ej ON re.ejercicio_id = ej.id
                    WHERE re.id = :nuevo_id LIMIT 1";
    
    $stmt_nuevo = $db->prepare($query_nuevo);
    $stmt_nuevo->bindParam(":nuevo_id", $rutina_ejercicio_id);
    $stmt_nuevo->execute();
    $ejercicio_agregado = $stmt_nuevo->fetch(PDO::FETCH_ASSOC);
    
    // Convertimos el array de stdClass (de json_decode) a array asociativo
    $ejercicio_agregado['objetivos'] = json_decode(json_encode($objetivos), true);

    http_response_code(201);
    echo json_encode(array(
        "mensaje" => "Ejercicio añadido a la rutina exitosamente.",
        "ejercicio_agregado" => $ejercicio_agregado
    ));

} catch (Exception $e) {
    // 9. Rollback (Sin cambios)
    $db->rollBack();
    $codigo = $e->getCode() == 403 ? 403 : 500;
    http_response_code($codigo);
    echo json_encode(array(
        "mensaje" => "Error al añadir el ejercicio.",
        "error" => $e->getMessage()
    ));
}
?>