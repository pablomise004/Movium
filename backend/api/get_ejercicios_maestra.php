<?php
// ---- backend/api/get_ejercicios_maestra.php ----

// Cabeceras CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET"); // Es un GET
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php';
require_once '../vendor/autoload.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

// Tu clave secreta (LA MISMA de siempre)
$secret_key = "k#f9JLz@p7W!bN8^vG2*qR5sT&eD4hX%uY1aC6oP3zM0xQñ";

// =================================================================
// PASO 1: LÓGICA DE VALIDACIÓN DE TOKEN (Exactamente igual que en tus otros scripts)
// =================================================================
$jwt = null;
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
$usuario_id = null; // No usaremos $usuario_id en la query, pero validamos que exista un token

if ($authHeader) {
    $arr = explode(" ", $authHeader);
    $jwt = $arr[1] ?? null;
}

if ($jwt) {
    try {
        $decoded = JWT::decode($jwt, new Key($secret_key, 'HS256'));
        $usuario_id = $decoded->data->id; // Confirmamos que el token es válido
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

// Si llegamos aquí, el usuario está autenticado.
// =================================================================
// PASO 2: LÓGICA PARA OBTENER LA LISTA MAESTRA DE EJERCICIOS
// =================================================================

try {
    $database = new Database();
    $db = $database->getConnection();

    // 1. Preparar la sentencia SQL para SELECCIONAR
    // Queremos id, nombre y grupo_muscular de TODOS los ejercicios
    $query = "SELECT id, nombre, grupo_muscular, tipo
              FROM ejercicios 
              ORDER BY nombre ASC"; // Ordenados alfabéticamente para el <select>
    
    $stmt = $db->prepare($query);
    
    // 2. Ejecutar (No necesitamos bindParam aquí, ya que no hay variables)
    $stmt->execute();
    
    $num = $stmt->rowCount();

    // 3. Comprobar si se encontraron ejercicios
    if ($num > 0) {
        
        // fetchAll() es la forma más directa de obtener todos los resultados
        $ejercicios_array = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 4. Devolver el array de ejercicios como JSON
        http_response_code(200);
        echo json_encode($ejercicios_array); // Devolvemos el array completo

    } else {
        // Si la tabla 'ejercicios' está vacía
        http_response_code(200);
        echo json_encode(array()); // Devolvemos un array vacío
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error en la base de datos al obtener ejercicios.",
        "error" => $e->getMessage()
    ));
}
?>