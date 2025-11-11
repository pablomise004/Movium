<?php
// ---- backend/api/get_rutinas.php (Modificado para 'orden' y 'color_tag') ----

// ... (Cabeceras CORS) ...
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php';
require_once '../vendor/autoload.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

// ... (Validación de Token sin cambios) ...
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

try {
    $database = new Database();
    $db = $database->getConnection();

    // 1. Preparar la sentencia SQL MODIFICADA
    $query = "SELECT
                r.id,
                r.nombre,
                r.dias_semana,
                r.orden,           -- <-- ¡NUEVO!
                r.color_tag,       -- <-- ¡NUEVO!
                MAX(s.fecha_inicio) as ultima_sesion
             FROM
                rutinas r
              LEFT JOIN 
                sesiones_entrenamiento s ON r.id = s.rutina_id AND s.usuario_id = :usuario_id_sesion
              WHERE
                r.usuario_id = :usuario_id_rutina
              GROUP BY
                r.id, r.nombre, r.dias_semana, r.orden, r.color_tag -- <-- ¡NUEVO! Agregados a GROUP BY
              ORDER BY
                r.orden ASC, r.fecha_creacion DESC"; // <-- ¡NUEVO! Ordenamos por 'orden'

    $stmt = $db->prepare($query);
    $stmt->bindParam(":usuario_id_rutina", $usuario_id, PDO::PARAM_INT);
    $stmt->bindParam(":usuario_id_sesion", $usuario_id, PDO::PARAM_INT);
    $stmt->execute();

    $num = $stmt->rowCount();
    if ($num > 0) {
        $rutinas_array = array();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rows as $row) {
            extract($row);
            $rutina_item = array(
                "id" => $id,
                "nombre" => $nombre,
                "dias" => $dias_semana,
                "ultima_sesion" => $ultima_sesion,
                "orden" => $orden,         // <-- ¡NUEVO!
                "color_tag" => $color_tag   // <-- ¡NUEVO!
            );
            array_push($rutinas_array, $rutina_item);
        }

        http_response_code(200);
        echo json_encode($rutinas_array);

    } else {
        http_response_code(200);
        echo json_encode(array());
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error en la base de datos al obtener las rutinas.",
        "error" => $e->getMessage()
    ));
}
?>