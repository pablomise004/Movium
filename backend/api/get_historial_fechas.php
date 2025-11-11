<?php
// ---- backend/api/get_historial_fechas.php (REFACTORIZADO PARA PUNTOS MÚLTIPLES) ----

// Cabeceras CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Dependencias
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
        http_response_code(401);
        echo json_encode(array("mensaje" => "Acceso denegado. Token inválido.")); 
        die();
    }
} else { 
    http_response_code(401);
    echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token.")); 
    die();
}

// --- PASO 2: Lógica de Consulta (¡NUEVA LÓGICA!) ---
$database = new Database();
$db = $database->getConnection();

// Color por defecto para rutinas con color NULL
$default_color_null = "#AAAAAA"; // Gris

try {
    // Esta consulta agrupa por día y CONCATENA todos los colores de ese día
    $query = "SELECT 
                DATE(s.fecha_inicio) as fecha,
                GROUP_CONCAT(r.color_tag) as colores_str
              FROM 
                sesiones_entrenamiento s
              INNER JOIN 
                rutinas r ON s.rutina_id = r.id
              WHERE 
                s.usuario_id = :usuario_id
              GROUP BY 
                DATE(s.fecha_inicio)
              ORDER BY 
                fecha ASC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // --- PASO 3: Procesar resultados y crear el "mapa" de arrays de colores ---
    $fechas_con_colores_map = [];

    foreach ($rows as $row) {
        $fecha = $row['fecha'];
        $colores_str = $row['colores_str']; // Ej: "#FF0000,NULL,#0000FF" o NULL

        if ($colores_str === null) {
            $fechas_con_colores_map[$fecha] = [$default_color_null];
            continue;
        }

        $colores_array = explode(',', $colores_str);
        
        $colores_limpios = array_map(function($color) use ($default_color_null) {
            if ($color === 'NULL' || $color === null || $color === '') {
                return $default_color_null;
            }
            return $color;
        }, $colores_array);

        $fechas_con_colores_map[$fecha] = $colores_limpios;
    }

    http_response_code(200);
    echo json_encode($fechas_con_colores_map); 

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error al obtener el historial de fechas.",
        "error" => $e->getMessage()
    ));
}
?>