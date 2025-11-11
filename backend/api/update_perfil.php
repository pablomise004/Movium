<?php
// ---- backend/api/update_perfil.php (CON VALIDACIÓN DE ALTURA/PESO MEJORADA) ----

// --- Configuración de Cabeceras ---
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// --- Manejo de Solicitud OPTIONS (Preflight) ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(); 
}

// --- Dependencias ---
require_once '../config/database.php';
require_once '../vendor/autoload.php'; 

// --- Namespaces ---
use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

// --- Constantes ---
define("JWT_SECRET_KEY", "k#f9JLz@p7W!bN8^vG2*qR5sT&eD4hX%uY1aC6oP3zM0xQñ"); 

// ==================================================================
// PASO 1: Validación de Token JWT y Obtención de ID de Usuario
// (Sin cambios)
// ==================================================================
$usuario_id = null;
$jwt = null;
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null; 

if ($authHeader) {
    $parts = explode(" ", $authHeader);
    if (count($parts) === 2 && $parts[0] === 'Bearer') {
        $jwt = $parts[1];
    }
}

if ($jwt) {
    try {
        $decoded = JWT::decode($jwt, new Key(JWT_SECRET_KEY, 'HS256'));
        $usuario_id = $decoded->data->id ?? null;
        if (!$usuario_id) {
             throw new Exception("ID de usuario no encontrado en el token.");
        }
    } catch (Exception $e) {
        http_response_code(401); // Unauthorized
        echo json_encode(["mensaje" => "Acceso denegado: Token inválido o expirado.", "error_detalle" => $e->getMessage()]);
        exit();
    }
} else {
    http_response_code(401); // Unauthorized
    echo json_encode(["mensaje" => "Acceso denegado: No se proporcionó token."]);
    exit();
}

// ==================================================================
// PASO 2: Obtener y Validar Datos de Entrada (JSON)
// ==================================================================
$data = json_decode(file_get_contents("php://input"));

if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400); // Bad Request
    echo json_encode(["mensaje" => "Error al decodificar los datos JSON de entrada."]);
    exit();
}

// Extraer datos
$correo = trim($data->correo_electronico ?? '');
$nombre_real = trim($data->nombre_real ?? '');
$apellidos = trim($data->apellidos ?? '');
$fecha_nac = $data->fecha_nacimiento ?? null; 
$altura = $data->altura_cm ?? null;
$peso = $data->peso_kg ?? null;
$telefono = trim($data->telefono ?? '');
$direccion = trim($data->direccion ?? '');

// --- Validación de Reglas de Negocio (¡MODIFICADA!) ---
$errores_validacion = [];

// --- ¡CAMBIOS AQUÍ! ---
// Altura: si se proporciona, debe ser numérico entre 50 y 300, entero y máx 3 dígitos
if ($altura !== null && $altura !== "") {
    if (!is_numeric($altura) || $altura < 50 || $altura > 300) {
        $errores_validacion[] = "La altura debe ser un número entre 50 y 300 cm.";
    }
    // Validar que es entero (no tiene decimales)
    if (filter_var($altura, FILTER_VALIDATE_INT) === false) {
         $errores_validacion[] = "La altura debe ser un número entero (sin decimales).";
    }
    // Validar longitud
    if (strlen((string)$altura) > 3) {
         $errores_validacion[] = "La altura no puede tener más de 3 dígitos.";
    }
}

// Peso: si se proporciona, debe ser numérico entre 30 y 300, y máx 6 caracteres
if ($peso !== null && $peso !== "") {
    if (!is_numeric($peso) || $peso < 30 || $peso > 300) {
        $errores_validacion[] = "El peso debe ser un número entre 30 y 300 kg.";
    }
    // Validar longitud total (ej: "123.45" tiene 6 caracteres)
    if (strlen((string)$peso) > 6) { 
         $errores_validacion[] = "El peso excede el formato (máx 6 caracteres, ej: 123.45).";
    }
    // Validar que no tenga más de 2 decimales (para DECIMAL(5,2))
    $partes_peso = explode('.', (string)$peso);
    if (isset($partes_peso[1]) && strlen($partes_peso[1]) > 2) {
        $errores_validacion[] = "El peso no puede tener más de 2 decimales.";
    }
}
// --- FIN DE CAMBIOS ---

// Fecha Nacimiento: (sin cambios)
if ($fecha_nac !== null && $fecha_nac !== "") {
    try {
        $fechaNacimientoObj = new DateTime($fecha_nac);
        $hoy = new DateTime();
        if ($fechaNacimientoObj->format('Y-m-d') > $hoy->format('Y-m-d')) {
            $errores_validacion[] = "La fecha de nacimiento no puede ser en el futuro.";
        }
    } catch (Exception $e) {
        // No hacer nada si el formato es inválido, ya que no es obligatorio
    }
}
// Correo: (sin cambios)
if ($correo !== null && $correo !== "" && !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
     $errores_validacion[] = "El formato del correo electrónico no es válido.";
}
// Teléfono: (sin cambios)
if ($telefono !== null && $telefono !== "" && (strlen($telefono) < 9 || strlen($telefono) > 15 || !ctype_digit($telefono) )) {
    $errores_validacion[] = "El teléfono debe tener entre 9 y 15 dígitos numéricos.";
}
// Longitud de texto: (sin cambios)
if (mb_strlen($nombre_real, 'UTF-8') > 100) { $errores_validacion[] = "El nombre no puede exceder los 100 caracteres."; }
if (mb_strlen($apellidos, 'UTF-8') > 150) { $errores_validacion[] = "Los apellidos no pueden exceder los 150 caracteres."; }
if (mb_strlen($direccion, 'UTF-8') > 255) { $errores_validacion[] = "La dirección no puede exceder los 255 caracteres."; }

// Si hubo errores de validación, devolverlos
if (!empty($errores_validacion)) {
    http_response_code(400); // Bad Request
    // Devolvemos el primer error encontrado (usando array_unique por si se repiten)
    echo json_encode(["mensaje" => array_values(array_unique($errores_validacion))[0]]);
    exit();
}

// ==================================================================
// PASO 3: Lógica de Actualización en Base de Datos
// (Sin cambios)
// ==================================================================
$db = null; 

try {
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
         throw new Exception("No se pudo conectar a la base de datos.", 503); // Service Unavailable
    }

    // --- Comprobación de Correo Duplicado (ANTES de la transacción) ---
    if ($correo !== null && $correo !== "") {
        $check_email_query = "SELECT id FROM usuarios WHERE correo_electronico = :correo AND id != :usuario_id LIMIT 1";
        $check_email_stmt = $db->prepare($check_email_query);
        $check_email_stmt->bindParam(':correo', $correo, PDO::PARAM_STR);
        $check_email_stmt->bindParam(':usuario_id', $usuario_id, PDO::PARAM_INT);
        $check_email_stmt->execute();
        if ($check_email_stmt->rowCount() > 0) {
            http_response_code(409); // Conflict
            echo json_encode(["mensaje" => "Ese correo electrónico ya está en uso por otro usuario."]);
            exit(); 
        }
    }

    // --- Inicio de la Transacción ---
    $db->beginTransaction();
    
    // 1. Actualizar 'usuarios' (correo electrónico)
    if (isset($data->correo_electronico)) { 
        $query_user = "UPDATE usuarios SET correo_electronico = :correo WHERE id = :usuario_id";
        $stmt_user = $db->prepare($query_user);
        $stmt_user->bindValue(":correo", ($correo === "" ? null : $correo), PDO::PARAM_STR | PDO::PARAM_NULL);
        $stmt_user->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
        if (!$stmt_user->execute()) {
             throw new Exception("Error al actualizar la tabla de usuarios: " . implode(" - ", $stmt_user->errorInfo()), 500);
        }
    }

    // 2. Insertar o Actualizar 'perfiles' (Usando ON DUPLICATE KEY UPDATE)
    $query_profile = "
        INSERT INTO perfiles (
            usuario_id, nombre_real, apellidos, fecha_nacimiento,
            altura_cm, peso_kg, telefono, direccion
        ) VALUES (
            :usuario_id, :nombre_real, :apellidos, :fecha_nac,
            :altura, :peso, :telefono, :direccion
        )
        ON DUPLICATE KEY UPDATE
            nombre_real = VALUES(nombre_real),
            apellidos = VALUES(apellidos),
            fecha_nacimiento = VALUES(fecha_nacimiento),
            altura_cm = VALUES(altura_cm),
            peso_kg = VALUES(peso_kg),
            telefono = VALUES(telefono),
            direccion = VALUES(direccion)
    ";
    $stmt_profile = $db->prepare($query_profile);

    // Bindear todos los parámetros
    $stmt_profile->bindParam(":usuario_id", $usuario_id, PDO::PARAM_INT);
    $stmt_profile->bindValue(":nombre_real", ($nombre_real === "" ? null : $nombre_real), PDO::PARAM_STR | PDO::PARAM_NULL);
    $stmt_profile->bindValue(":apellidos", ($apellidos === "" ? null : $apellidos), PDO::PARAM_STR | PDO::PARAM_NULL);
    $stmt_profile->bindValue(":fecha_nac", ($fecha_nac === "" || $fecha_nac === null ? null : $fecha_nac), PDO::PARAM_STR | PDO::PARAM_NULL);
    $stmt_profile->bindValue(":altura", ($altura === "" || $altura === null ? null : $altura), PDO::PARAM_INT | PDO::PARAM_NULL); 
    $stmt_profile->bindValue(":peso", ($peso === "" || $peso === null ? null : $peso), PDO::PARAM_STR | PDO::PARAM_NULL); 
    $stmt_profile->bindValue(":telefono", ($telefono === "" ? null : $telefono), PDO::PARAM_STR | PDO::PARAM_NULL);
    $stmt_profile->bindValue(":direccion", ($direccion === "" ? null : $direccion), PDO::PARAM_STR | PDO::PARAM_NULL);

    if (!$stmt_profile->execute()) {
        throw new Exception("Error al insertar/actualizar la tabla de perfiles: " . implode(" - ", $stmt_profile->errorInfo()), 500);
    }

    // --- Confirmar Transacción ---
    $db->commit();
    
    // --- Respuesta Exitosa ---
    http_response_code(200); // OK
    echo json_encode(["mensaje" => "Perfil actualizado con éxito."]);

} catch (Exception $e) {
    // --- Manejo de Errores ---
    if ($db && $db->inTransaction()) {
        $db->rollBack();
    }
    $codigoError = (is_numeric($e->getCode()) && $e->getCode() >= 400 && $e->getCode() < 600) ? $e->getCode() : 500;
    http_response_code($codigoError);
    echo json_encode([
        "mensaje" => "Error al actualizar el perfil.",
        "error_detalle" => $e->getMessage()
    ]);
} finally {
    // --- Limpieza ---
    $db = null;
}
?>