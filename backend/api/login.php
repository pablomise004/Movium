<?php
// ---- backend/api/login.php (MODIFICADO) ----

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
require_once '../config/database.php';
require_once '../vendor/autoload.php';

use \Firebase\JWT\JWT;

$db = new Database();
$conn = $db->getConnection();
$data = json_decode(file_get_contents("php://input"));
// Leemos "identifier" que puede ser usuario o email
if (!empty($data->identifier) && !empty($data->password)) {

    $identifier = htmlspecialchars(strip_tags($data->identifier));
    // **** ¡CAMBIO AQUÍ! ****
    // Añadimos LEFT JOIN y seleccionamos los nuevos campos de 'perfiles' (p)
    $query = "SELECT 
                u.id, 
                u.nombre_usuario, 
                u.password_hash, 
                u.correo_electronico,
       
                p.ha_visto_guia_inicio,
                p.ha_visto_guia_rutina,
                p.ha_visto_guia_records,     /* <-- AÑADIDO */
                p.ha_visto_guia_comunidad,   /* <-- AÑADIDO */
                p.ha_visto_guia_entreno      /* <-- AÑADIDO */
              FROM usuarios u
              LEFT JOIN perfiles p ON u.id = p.usuario_id
              WHERE u.nombre_usuario = :identifier OR u.correo_electronico = :identifier
              LIMIT 1";
    // ************************

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':identifier', $identifier);
    $stmt->execute();
    if ($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        // Extrae $id, $nombre_usuario, $password_hash, $correo_electronico
        // Y TAMBIÉN todos los flags de guías
        extract($row);
        // Verificamos la contraseña (sin cambios)
        if (password_verify(htmlspecialchars(strip_tags($data->password)), $password_hash)) {

            $secret_key = "k#f9JLz@p7W!bN8^vG2*qR5sT&eD4hX%uY1aC6oP3zM0xQñ";
            // ¡¡CÁMBIAME!!

            $token_payload = array(
                "iat" => time(),
                "exp" => time() + (24 * 60 * 60), // 24 horas
                "data" => array(
                     "id" => $id,
                     "nombre_usuario" => $nombre_usuario // Guardamos siempre el nombre_usuario en el token
                )
            );
            http_response_code(200);
            $jwt = JWT::encode($token_payload, $secret_key, 'HS256');
            
            // **** ¡CAMBIO AQUÍ! ****
            // Enviamos los datos de las guías al frontend
            echo json_encode(array(
                "token" => $jwt,
                "usuario" => array(
                    "id" => $id,
                    "nombre_usuario" => $nombre_usuario,
                    // Usamos (bool) para convertirlos a true/false
                    // Si es null (ej: usuario antiguo sin perfil), ?? 0 lo trata como false
                    "ha_visto_guia_inicio" => (bool)($ha_visto_guia_inicio ?? 0),
                    "ha_visto_guia_rutina" => (bool)($ha_visto_guia_rutina ?? 0),
                    "ha_visto_guia_records" => (bool)($ha_visto_guia_records ?? 0),
                    "ha_visto_guia_comunidad" => (bool)($ha_visto_guia_comunidad ?? 0),
                    "ha_visto_guia_entreno" => (bool)($ha_visto_guia_entreno ?? 0)
                )
            ));
            // ************************

        } else {
            // Error de contraseña
            http_response_code(401);
            echo json_encode(array("mensaje" => "Contraseña incorrecta."));
        }
    } else {
        // Error de usuario/email no encontrado
        http_response_code(401);
        echo json_encode(array("mensaje" => "Usuario o correo electrónico no encontrado.")); // Mensaje actualizado
    }
} else {
    // Datos incompletos
    http_response_code(400);
    echo json_encode(array("mensaje" => "Datos incompletos."));
}
?>