<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/base_de_datos.php';
require_once '../vendor/autoload.php';
require_once '../config/configuracion_jwt.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

$id_usuario = null;
$token = null;
$cabecera = $_SERVER['HTTP_AUTHORIZATION'] ?? null;

if ($cabecera) {
    $partes = explode(" ", $cabecera);
    $token = $partes[1] ?? null;
}

if ($token) {
    try {
        $decodificado = JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
        $id_usuario = $decodificado->data->id;
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(["mensaje" => "Acceso denegado: Token inválido o expirado."]);
        exit();
    }
} else {
    http_response_code(401);
    echo json_encode(["mensaje" => "Acceso denegado: No se proporcionó token."]);
    exit();
}

$datosEntrada = json_decode(file_get_contents("php://input"));

if ($datosEntrada === null) {
    http_response_code(400);
    echo json_encode(["mensaje" => "Error al leer los datos."]);
    exit();
}

$correo = trim($datosEntrada->correo_electronico ?? '');
$nombre_real = trim($datosEntrada->nombre_real ?? '');
$apellidos = trim($datosEntrada->apellidos ?? '');
$fecha_nac = $datosEntrada->fecha_nacimiento ?? null;
$altura = $datosEntrada->altura_cm ?? null;
$peso = $datosEntrada->peso_kg ?? null;
$telefono = trim($datosEntrada->telefono ?? '');
$direccion = trim($datosEntrada->direccion ?? '');

if ($altura !== null && $altura !== "") {
    if (!is_numeric($altura) || $altura < 50 || $altura > 300) {
        http_response_code(400);
        echo json_encode(["mensaje" => "La altura debe ser un número entre 50 y 300 cm."]);
        exit();
    }
}

if ($peso !== null && $peso !== "") {
    if (!is_numeric($peso) || $peso < 30 || $peso > 300) {
        http_response_code(400);
        echo json_encode(["mensaje" => "El peso debe ser un número entre 30 y 300 kg."]);
        exit();
    }
}

if ($fecha_nac !== null && $fecha_nac !== "") {
    try {
        $fechaNacimientoObj = new DateTime($fecha_nac);
        $hoy = new DateTime();
        if ($fechaNacimientoObj->format('Y-m-d') > $hoy->format('Y-m-d')) {
            http_response_code(400);
            echo json_encode(["mensaje" => "La fecha de nacimiento no puede ser en el futuro."]);
            exit();
        }
    } catch (Exception $e) {
        // si el formato es raro lo ignoramos, no es obligatorio
    }
}

if ($correo !== null && $correo !== "" && !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["mensaje" => "El formato del correo electrónico no es válido."]);
    exit();
}

if ($telefono !== null && $telefono !== "" && (strlen($telefono) < 9 || strlen($telefono) > 15 || !ctype_digit($telefono))) {
    http_response_code(400);
    echo json_encode(["mensaje" => "El teléfono debe tener entre 9 y 15 dígitos numéricos."]);
    exit();
}

if (strlen($nombre_real) > 100) {
    http_response_code(400);
    echo json_encode(["mensaje" => "El nombre no puede exceder los 100 caracteres."]);
    exit();
}
if (strlen($apellidos) > 150) {
    http_response_code(400);
    echo json_encode(["mensaje" => "Los apellidos no pueden exceder los 150 caracteres."]);
    exit();
}
if (strlen($direccion) > 255) {
    http_response_code(400);
    echo json_encode(["mensaje" => "La dirección no puede exceder los 255 caracteres."]);
    exit();
}

try {
    $bd = new Database();
    $conexion = $bd->getConnection();

    if ($correo !== null && $correo !== "") {
        $check = $conexion->prepare("SELECT id FROM usuarios WHERE correo_electronico = :correo AND id != :usuario_id LIMIT 1");
        $check->bindParam(':correo', $correo, PDO::PARAM_STR);
        $check->bindParam(':usuario_id', $id_usuario, PDO::PARAM_INT);
        $check->execute();
        if ($check->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(["mensaje" => "Ese correo electrónico ya está en uso por otro usuario."]);
            exit();
        }
    }

    if (isset($datosEntrada->correo_electronico)) {
        $sentencia = $conexion->prepare("UPDATE usuarios SET correo_electronico = :correo WHERE id = :usuario_id");
        $sentencia->bindValue(":correo", $correo === "" ? null : $correo);
        $sentencia->bindParam(":usuario_id", $id_usuario, PDO::PARAM_INT);
        $sentencia->execute();
    }

    $consulta = "
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
    $sentencia = $conexion->prepare($consulta);
    $sentencia->bindParam(":usuario_id", $id_usuario, PDO::PARAM_INT);
    $sentencia->bindValue(":nombre_real", $nombre_real === "" ? null : $nombre_real);
    $sentencia->bindValue(":apellidos", $apellidos === "" ? null : $apellidos);
    $sentencia->bindValue(":fecha_nac", ($fecha_nac === "" || $fecha_nac === null) ? null : $fecha_nac);
    $sentencia->bindValue(":altura", ($altura === "" || $altura === null) ? null : $altura);
    $sentencia->bindValue(":peso", ($peso === "" || $peso === null) ? null : $peso);
    $sentencia->bindValue(":telefono", $telefono === "" ? null : $telefono);
    $sentencia->bindValue(":direccion", $direccion === "" ? null : $direccion);
    $sentencia->execute();

    http_response_code(200);
    echo json_encode(["mensaje" => "Perfil actualizado con éxito."]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["mensaje" => "Error al actualizar el perfil."]);
}
?>