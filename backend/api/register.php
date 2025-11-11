<?php
// ---- backend/api/register.php (MODIFICADO con Auto-Login y Validación) ----

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once '../config/database.php';
// --- ¡Añadido JWT! ---
require_once '../vendor/autoload.php';
use \Firebase\JWT\JWT;

$db = new Database();
$conn = $db->getConnection();
$data = json_decode(file_get_contents("php://input"));

// 1. Comprobamos que los datos no estén vacíos
if (
    !empty($data->nombre_usuario) &&
    !empty($data->password)
) {
    
    // 2. Limpiamos los datos
    $nombre_usuario = htmlspecialchars(strip_tags($data->nombre_usuario));
    $password_limpia = htmlspecialchars(strip_tags($data->password));

    // 3. --- ¡NUEVO! Validación de longitud de usuario ---
    // Usamos mb_strlen para contar correctamente caracteres multibyte (como tildes o ñ)
    if (mb_strlen($nombre_usuario, 'UTF-8') > 18) {
        http_response_code(400); // Bad Request
        echo json_encode(array("mensaje" => "El nombre de usuario no puede tener más de 18 caracteres."));
        die(); // Detiene la ejecución
    }
    // --- FIN VALIDACIÓN USUARIO ---

    // 3. --- ¡NUEVO! Validación de longitud de contraseña ---
    if (strlen($password_limpia) > 50) {
        http_response_code(400); // Bad Request
        echo json_encode(array("mensaje" => "La contraseña no puede tener más de 50 caracteres."));
        die(); // Detiene la ejecución
    }
    // --- FIN VALIDACIÓN CONTRASEÑA ---

    // 3. --- Validación de complejidad de contraseña (YA LA TENÍAS) ---
    $min_longitud = 6; // Definimos una longitud mínima

    if (strlen($password_limpia) < $min_longitud) {
        http_response_code(400); // Bad Request
        echo json_encode(array("mensaje" => "La contraseña debe tener al menos $min_longitud caracteres."));
        die(); // Detiene la ejecución
    }
    // Comprueba si hay al menos un número
    if (!preg_match('/[0-9]/', $password_limpia)) {
        http_response_code(400);
        echo json_encode(array("mensaje" => "La contraseña debe contener al menos un número."));
        die();
    }
    // Comprueba si hay al menos un carácter especial (cualquier cosa que no sea letra o número)
    if (!preg_match('/\W/', $password_limpia)) {
        http_response_code(400);
        echo json_encode(array("mensaje" => "La contraseña debe contener al menos un carácter especial (ej: !@#$...)."));
        die();
    }
    // --- FIN VALIDACIÓN ---


    // 4. Verificamos si el usuario ya existe
    $check_query = "SELECT id FROM usuarios WHERE nombre_usuario = :nombre_usuario LIMIT 1";
    $check_stmt = $conn->prepare($check_query);
    $check_stmt->bindParam(':nombre_usuario', $nombre_usuario);
    $check_stmt->execute();

    if ($check_stmt->rowCount() > 0) {
        http_response_code(409); // 409 Conflict
        echo json_encode(array("mensaje" => "Ese nombre de usuario ya está en uso."));
    } else {
        // 5. Si no existe, procedemos a insertar
        
        // Hasheamos la contraseña
        $password_hash = password_hash($password_limpia, PASSWORD_BCRYPT);
        
        $query = "INSERT INTO usuarios (nombre_usuario, password_hash) VALUES (:nombre_usuario, :password_hash)";
        
        $stmt = $conn->prepare($query);

        $stmt->bindParam(':nombre_usuario', $nombre_usuario);
        $stmt->bindParam(':password_hash', $password_hash);

        if ($stmt->execute()) {
            
            // --- ¡NUEVO! Generar Token (Lógica de login.php) ---
            
            // Obtenemos el ID del usuario que acabamos de crear
            $id_nuevo_usuario = $conn->lastInsertId();
            
            $secret_key = "k#f9JLz@p7W!bN8^vG2*qR5sT&eD4hX%uY1aC6oP3zM0xQñ";
            $token_payload = array(
                "iat" => time(),
                "exp" => time() + (24 * 60 * 60), // 24 horas
                "data" => array(
                     "id" => $id_nuevo_usuario,
                     "nombre_usuario" => $nombre_usuario // Ya lo tenemos de $data
                )
            );

            http_response_code(201); // 201 Created
            $jwt = JWT::encode($token_payload, $secret_key, 'HS256');

            // Devolvemos la misma estructura que login.php
            echo json_encode(array(
                "token" => $jwt,
                "usuario" => array(
                    "id" => $id_nuevo_usuario,
                    "nombre_usuario" => $nombre_usuario,
                    // Añadimos los flags de guías por defecto para el nuevo usuario
                    "ha_visto_guia_inicio" => false,
                    "ha_visto_guia_rutina" => false,
                    "ha_visto_guia_records" => false,
                    "ha_visto_guia_comunidad" => false,
                    "ha_visto_guia_entreno" => false
                )
            ));
            // --- FIN CAMBIO ---

        } else {
            // Error genérico si la inserción falla
            http_response_code(503); // 503 Service Unavailable
            echo json_encode(array("mensaje" => "No se pudo registrar al usuario. Error del servidor."));
        }
    }
} else {
    // Error si faltan datos
    http_response_code(400); // 400 Bad Request
    echo json_encode(array("mensaje" => "Datos incompletos. Faltan usuario o contraseña."));
}
?>