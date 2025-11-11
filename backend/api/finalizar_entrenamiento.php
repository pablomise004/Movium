<?php
// ---- backend/api/finalizar_entrenamiento.php (Refactorizado) ----

// --- Configuración de Cabeceras ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// --- Manejo de Solicitud OPTIONS (Preflight) ---
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Dependencias ---
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../vendor/autoload.php';
use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

// --- Constantes y Configuración ---
define("JWT_SECRET_KEY", "k#f9JLz@p7W!bN8^vG2*qR5sT&eD4hX%uY1aC6oP3zM0xQñ");

// ==================================================================
// PASO 1: Validación de Token JWT
// ==================================================================
$usuario_id = null;
try {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if (!$authHeader) {
        throw new Exception("No se proporcionó token.", 401);
    }
    $arr = explode(" ", $authHeader);
    $jwt = $arr[1] ?? null;
    if (!$jwt) {
        throw new Exception("Formato de token inválido.", 401);
    }
    $decoded = JWT::decode($jwt, new Key(JWT_SECRET_KEY, 'HS256'));
    $usuario_id = $decoded->data->id;
    if (!$usuario_id) {
         throw new Exception("ID de usuario no encontrado en el token.", 401);
    }
} catch (Exception $e) {
    http_response_code($e->getCode() ?: 401); // Usa el código de la excepción si existe, sino 401
    echo json_encode(["mensaje" => "Acceso denegado: " . $e->getMessage()]);
    exit();
}

// ==================================================================
// PASO 2: Obtener y Validar Datos de Entrada
// ==================================================================
$input = json_decode(file_get_contents('php://input'));

if (
    !$input ||
    !isset($input->rutina_id) || !is_numeric($input->rutina_id) ||
    !isset($input->series) || !is_array($input->series) ||
    !isset($input->fecha_inicio) || empty($input->fecha_inicio)
) {
    http_response_code(400);
    echo json_encode(["mensaje" => "Datos de entrada incompletos o mal formados. Se esperaba 'rutina_id' (numérico), un array 'series' y 'fecha_inicio' (string ISO UTC)."]);
    exit();
}

$rutina_id = (int)$input->rutina_id;
$series_realizadas = $input->series;
$notas_sesion = isset($input->notas_sesion) ? htmlspecialchars(strip_tags($input->notas_sesion)) : null;

// --- Procesar Fecha de Inicio (UTC) ---
$fechaInicioSql = null;
try {
    $fechaInicioDT = new DateTime($input->fecha_inicio);
    // Asegurar explícitamente la zona horaria UTC
    $fechaInicioDT->setTimezone(new DateTimeZone('UTC'));
    // Formatear para MySQL (mantendrá el valor horario UTC)
    $fechaInicioSql = $fechaInicioDT->format('Y-m-d H:i:s');
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["mensaje" => "Formato de fecha de inicio inválido. Se esperaba formato ISO 8601 UTC (ej: 'YYYY-MM-DDTHH:MM:SSZ'). Error: " . $e->getMessage()]);
    exit();
}

// ==================================================================
// PASO 3: Lógica de Guardado en Base de Datos (con Transacción)
// ==================================================================
$db = null;
$sesion_id = null;
try {
    $database = new Database();
    $db = $database->getConnection();
    if (!$db) {
         throw new Exception("Error de conexión a la base de datos.", 500);
    }

    $db->beginTransaction();

    // --- 3a: Crear la Sesión ---
    $sqlSesion = "INSERT INTO sesiones_entrenamiento (usuario_id, rutina_id, fecha_inicio, fecha_fin, notas_sesion)
                  VALUES (?, ?, ?, UTC_TIMESTAMP(), ?)";
    $stmtSesion = $db->prepare($sqlSesion);
    if (!$stmtSesion->execute([$usuario_id, $rutina_id, $fechaInicioSql, $notas_sesion])) {
        throw new Exception("Error al crear la sesión: " . implode(" - ", $stmtSesion->errorInfo()), 500);
    }
    $sesion_id = $db->lastInsertId();
    $stmtSesion = null; // Liberar recurso
    if (!$sesion_id || $sesion_id == 0) { // lastInsertId puede devolver "0" o false
         throw new Exception("No se pudo obtener el ID de la nueva sesión.", 500);
    }

    // --- 3b: Insertar Series Realizadas ---
    if (!empty($series_realizadas)) {
        $sqlSerie = "INSERT INTO series_realizadas
                        (sesion_id, ejercicio_id, orden_ejercicio_rutina, num_serie,
                         repeticiones_realizadas, fue_al_fallo, peso_kg_usado,
                         tiempo_min_realizado, distancia_km_realizada, notas_serie)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmtSerie = $db->prepare($sqlSerie);

        foreach ($series_realizadas as $index => $serie) {
            // Validar datos mínimos de cada serie
            if (!isset($serie->ejercicio_id) || !is_numeric($serie->ejercicio_id) || $serie->ejercicio_id <= 0 ||
                !isset($serie->num_serie) || !is_numeric($serie->num_serie) || $serie->num_serie <= 0) {
                throw new Exception("Datos inválidos en la serie #".($index+1).". Falta 'ejercicio_id' o 'num_serie' válidos.", 400);
            }

            // Limpiar y asignar variables
            $ej_id = (int)$serie->ejercicio_id;
            $orden = isset($serie->orden_ejercicio_rutina) ? (int)$serie->orden_ejercicio_rutina : 1; // Default a 1 si no viene
            $num_s = (int)$serie->num_serie;
            $notas_serie = isset($serie->notas_serie) ? htmlspecialchars(strip_tags($serie->notas_serie)) : null;
            $reps = isset($serie->repeticiones_realizadas) && is_numeric($serie->repeticiones_realizadas) && $serie->repeticiones_realizadas >= 0 ? (int)$serie->repeticiones_realizadas : null;
            $fallo = isset($serie->fue_al_fallo) ? (bool)$serie->fue_al_fallo : false;
            $peso = isset($serie->peso_kg_usado) && is_numeric($serie->peso_kg_usado) && $serie->peso_kg_usado >= 0 ? (float)$serie->peso_kg_usado : null;
            $tiempo = isset($serie->tiempo_min_realizado) && is_numeric($serie->tiempo_min_realizado) && $serie->tiempo_min_realizado >= 0 ? (int)$serie->tiempo_min_realizado : null;
            $dist = isset($serie->distancia_km_realizada) && is_numeric($serie->distancia_km_realizada) && $serie->distancia_km_realizada >= 0 ? (float)$serie->distancia_km_realizada : null;

            // Ejecutar inserción
            if (!$stmtSerie->execute([
                $sesion_id, $ej_id, $orden, $num_s,
                $reps, $fallo, $peso, $tiempo, $dist, $notas_serie
            ])) {
                throw new Exception("Error al guardar la serie #".($index+1).": " . implode(" - ", $stmtSerie->errorInfo()), 500);
            }
        }
        $stmtSerie = null; // Liberar recurso
    }

    // --- 3c: Confirmar Transacción ---
    $db->commit();

    // --- Respuesta Exitosa ---
    http_response_code(201); // 201 Created
    echo json_encode([
        "mensaje" => "Entrenamiento guardado con éxito.",
        "sesion_id" => (int)$sesion_id, // Asegurar que sea número
        "series_guardadas" => count($series_realizadas)
    ]);

} catch (Exception $e) {
    // --- Manejo de Errores ---
    if ($db && $db->inTransaction()) {
        $db->rollBack(); // Deshacer cambios si algo falló
    }
    // Usar el código HTTP de la excepción si está disponible, sino 500
    http_response_code(is_numeric($e->getCode()) && $e->getCode() >= 400 ? $e->getCode() : 500);
    echo json_encode(["mensaje" => "Error al guardar entrenamiento: " . $e->getMessage()]);

} finally {
    // --- Limpieza ---
    if ($db) {
        $db = null; // Cerrar la conexión implícitamente
    }
}
?>