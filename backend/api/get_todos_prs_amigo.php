<?php
// ---- backend/api/get_todos_prs_amigo.php ----

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php';
require_once '../vendor/autoload.php';
use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

// --- PASO 1: Validación de Token (Estándar) ---
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
        http_response_code(401); echo json_encode(array("mensaje" => "Acceso denegado. Token inválido.")); die();
    }
} else { 
    http_response_code(401); echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token.")); die();
}

// --- PASO 2: Obtener IDs ---
$mi_id = $usuario_id;
$id_amigo = $_GET['id_amigo'] ?? null;

if (!$id_amigo || !is_numeric($id_amigo)) {
    http_response_code(400); 
    echo json_encode(array("mensaje" => "No se especificó un 'id_amigo' válido."));
    die();
}

// --- PASO 3: Lógica de Seguridad y Consulta ---
$database = new Database();
$db = $database->getConnection();

try {
    // 1. (SEGURIDAD) Comprobar si somos amigos
    $query_check = "SELECT id FROM amistades 
                    WHERE usuario_id = :mi_id AND amigo_id = :id_amigo 
                    LIMIT 1";
    $stmt_check = $db->prepare($query_check);
    $stmt_check->bindParam(":mi_id", $mi_id, PDO::PARAM_INT);
    $stmt_check->bindParam(":id_amigo", $id_amigo, PDO::PARAM_INT);
    $stmt_check->execute();

    if ($stmt_check->rowCount() == 0) {
        http_response_code(403); // 403 Forbidden
        echo json_encode(array("mensaje" => "Acceso prohibido. No sigues a este usuario."));
        die();
    }

    // 2. (DATOS) Obtenemos TODOS los PRs del amigo
    // Agrupamos por ejercicio y sacamos los máximos
    $query_data = "
        WITH MaxSeries AS (
            SELECT 
                sr.ejercicio_id,
                MAX(sr.peso_kg_usado) as max_peso,
                MAX(sr.repeticiones_realizadas) as max_reps,
                MAX(sr.tiempo_min_realizado) as max_tiempo,
                MAX(sr.distancia_km_realizada) as max_dist
            FROM 
                series_realizadas sr
            JOIN 
                sesiones_entrenamiento s ON sr.sesion_id = s.id
            WHERE 
                s.usuario_id = :id_amigo
            GROUP BY 
                sr.ejercicio_id
        )
        SELECT 
            e.id as ejercicio_id,
            e.nombre,
            e.tipo,
            e.grupo_muscular,
            ms.max_peso,
            ms.max_reps,
            ms.max_tiempo,
            ms.max_dist
        FROM 
            MaxSeries ms
        JOIN 
            ejercicios e ON ms.ejercicio_id = e.id
        WHERE
            (ms.max_peso > 0 OR ms.max_reps > 0 OR ms.max_tiempo > 0 OR ms.max_dist > 0)
        ORDER BY
            e.nombre ASC;
    ";
    
    $stmt_data = $db->prepare($query_data);
    $stmt_data->bindParam(":id_amigo", $id_amigo, PDO::PARAM_INT);
    $stmt_data->execute();

    $prs = $stmt_data->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode($prs); // Devuelve el array de PRs

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error al obtener los PRs del amigo.",
        "error" => $e->getMessage()
    ));
}
?>