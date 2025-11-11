<?php
// ---- backend/api/get_amigos_feed.php (MODIFICADO CON TOTALES) ----

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

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
    } catch (Exception $e) { 
        http_response_code(401);
        echo json_encode(array("mensaje" => "Acceso denegado. Token inválido.")); die();
    }
} else { 
    http_response_code(401);
    echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token.")); die();
}

// --- PASO 2: Lógica del Feed (MODIFICADA) ---
$database = new Database();
$db = $database->getConnection();
$mi_id = $usuario_id;
$limite_feed = 20;

try {
    // 1. Obtener la lista de IDs de amigos (Sin cambios)
    $query_amigos = "SELECT amigo_id FROM amistades WHERE usuario_id = :mi_id";
    $stmt_amigos = $db->prepare($query_amigos);
    $stmt_amigos->bindParam(":mi_id", $mi_id, PDO::PARAM_INT);
    $stmt_amigos->execute();
    
    $lista_ids_amigos = $stmt_amigos->fetchAll(PDO::FETCH_COLUMN, 0);

    if (count($lista_ids_amigos) === 0) {
        http_response_code(200);
        echo json_encode([]);
        exit();
    }

    // 2. Crear los placeholders (?) para la consulta IN (Sin cambios)
    $placeholders = str_repeat('?,', count($lista_ids_amigos) - 1) . '?';

    // 3. --- ¡¡LA NUEVA CONSULTA ESTRELLA!! ---
    $query_feed = "
        -- CTE 1: Obtener las 20 sesiones más recientes de los amigos
        WITH SesionesAmigos AS (
            SELECT 
                s.id as sesion_id,
                s.fecha_inicio,
                s.fecha_fin,
                s.usuario_id,
                s.rutina_id,
                TIMEDIFF(s.fecha_fin, s.fecha_inicio) as duracion
            FROM 
                sesiones_entrenamiento s
            WHERE 
                s.usuario_id IN ($placeholders) -- Filtro por IDs de amigos
            ORDER BY 
                s.fecha_fin DESC
            LIMIT ? -- Límite de 20
        ),
        
        -- CTE 2: Calcular los totales PARA ESAS 20 SESIONES
        TotalesSesion AS (
            SELECT
                sr.sesion_id,
                
                -- Suma de Volumen de Fuerza
                SUM(CASE WHEN e.tipo <> 'cardio' THEN COALESCE(sr.repeticiones_realizadas, 0) * COALESCE(sr.peso_kg_usado, 0) ELSE 0 END) as total_volumen_fuerza,
                
                -- Suma de Tiempo de Cardio
                SUM(CASE WHEN e.tipo = 'cardio' THEN COALESCE(sr.tiempo_min_realizado, 0) ELSE 0 END) as total_tiempo_cardio,
                
                -- Suma de Distancia de Cardio
                SUM(CASE WHEN e.tipo = 'cardio' THEN COALESCE(sr.distancia_km_realizada, 0) ELSE 0 END) as total_distancia_cardio
            FROM 
                series_realizadas sr
            JOIN 
                ejercicios e ON sr.ejercicio_id = e.id
            WHERE 
                sr.sesion_id IN (SELECT sesion_id FROM SesionesAmigos) -- Solo de las 20 sesiones
            GROUP BY 
                sr.sesion_id
        )
        
        -- Consulta Final: Unir la info de las sesiones con los totales y los nombres
        SELECT 
            sa.sesion_id,
            sa.fecha_fin,
            sa.duracion,
            u.nombre_usuario,
            r.nombre AS nombre_rutina,
            -- Ya no seleccionamos r.color_tag
            
            -- Usamos COALESCE para mostrar 0 si no hay datos de ese tipo
            COALESCE(ts.total_volumen_fuerza, 0) as total_volumen_fuerza,
            COALESCE(ts.total_tiempo_cardio, 0) as total_tiempo_cardio,
            COALESCE(ts.total_distancia_cardio, 0) as total_distancia_cardio
        FROM 
            SesionesAmigos sa
        JOIN 
            usuarios u ON sa.usuario_id = u.id
        INNER JOIN 
            rutinas r ON sa.rutina_id = r.id
        LEFT JOIN 
            TotalesSesion ts ON sa.sesion_id = ts.sesion_id
        ORDER BY 
            sa.fecha_fin DESC;
    ";

    $stmt_feed = $db->prepare($query_feed);
    
    // 4. Bindeamos los parámetros
    
    // Bindeamos los IDs de amigos
    $param_index = 1;
    foreach ($lista_ids_amigos as $id_amigo) {
        $stmt_feed->bindValue($param_index, $id_amigo, PDO::PARAM_INT);
        $param_index++;
    }
    
    // Bindeamos el límite (el último '?')
    $stmt_feed->bindValue($param_index, $limite_feed, PDO::PARAM_INT);
    
    // 5. Ejecutar y devolver
    $stmt_feed->execute();
    $feed_items = $stmt_feed->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($feed_items);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error al obtener el feed de actividad.",
        "error" => $e->getMessage()
    ));
}
?>