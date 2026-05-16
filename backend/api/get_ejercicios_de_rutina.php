<?php
// Obtener ejercicios de una rutina

// Cabeceras para peticiones desde el frontend
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Sin esto el preflight del navegador falla y no carga los ejercicios
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/base_de_datos.php';
require_once '../vendor/autoload.php';
require_once '../config/configuracion_jwt.php';

use \Firebase\JWT\JWT;
use \Firebase\JWT\Key;

// Validar token y extraer usuario
$clave_secreta = JWT_SECRET;
$token = null;
$cabecera = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
$id_usuario = null;
if ($cabecera) {
    $partes = explode(" ", $cabecera);
    $token = $partes[1] ?? null;
}
if ($token) {
    try {
        $decodificado = JWT::decode($token, new Key($clave_secreta, 'HS256'));
        $id_usuario = $decodificado->data->id;
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(array("mensaje" => "Acceso denegado. Token inválido.")); die();
    }
} else {
    http_response_code(401);
    echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token.")); die();
}

// Obtener ID de rutina
$id_rutina = $_GET['id'] ?? null;
if (!$id_rutina) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "No se especificó un ID de rutina."));
    die();
}

// Logica con dos consultas (padres e hijos)

try {
    $bd = new Database();
    $conexion = $bd->getConnection();

    // Consulta 1: ejercicios en la rutina
    // Nota: la columna 'orden' no existe en la tabla rutina_ejercicios de la BD
    // asi que ordenamos por re.id que siempre existe. Si alguien anade la columna
    // orden a la tabla en el futuro, cambiar a ORDER BY re.orden ASC
    $consulta_ejercicios = "SELECT re.id, re.ejercicio_id,
                                ej.nombre as nombre_ejercicio, ej.grupo_muscular, ej.tipo
                            FROM rutina_ejercicios re
                            JOIN ejercicios ej ON re.ejercicio_id = ej.id
                            JOIN rutinas ru ON re.rutina_id = ru.id
                            WHERE re.rutina_id = :rutina_id AND ru.usuario_id = :usuario_id
                            ORDER BY re.id ASC";
    $stmt_ejercicios = $conexion->prepare($consulta_ejercicios);
    $stmt_ejercicios->bindParam(":rutina_id", $id_rutina, PDO::PARAM_INT);
    $stmt_ejercicios->bindParam(":usuario_id", $id_usuario, PDO::PARAM_INT);
    $stmt_ejercicios->execute();
    
    $ejercicios = $stmt_ejercicios->fetchAll(PDO::FETCH_ASSOC);

    if (count($ejercicios) > 0) {
        // Consulta 2: objetivos de cada serie
        // Metemos esto en su propio try-catch para que si falla la tabla rutina_objetivos
        // no se rompa toda la carga. En el peor caso los ejercicios cargan sin objetivos.
        try {
            $ids = [];
            $marcadores = [];
            foreach ($ejercicios as $ej) {
                $ids[] = $ej['id'];
                $marcadores[] = '?';
            }
            $placeholders = implode(',', $marcadores);

            $consulta_objetivos = "SELECT
                                    id,
                                    rutina_ejercicio_id,
                                    num_serie,
                                    tipo_rep_objetivo,
                                    reps_min_objetivo,
                                    reps_max_objetivo,
                                    peso_kg_objetivo,
                                    tiempo_min_objetivo,
                                    distancia_km_objetivo,
                                    descanso_seg_post
                                FROM
                                    rutina_objetivos
                                WHERE
                                    rutina_ejercicio_id IN ($placeholders)
                                ORDER BY
                                    num_serie ASC";

            $stmt_objetivos = $conexion->prepare($consulta_objetivos);
            $stmt_objetivos->execute($ids);
            $objetivos = $stmt_objetivos->fetchAll(PDO::FETCH_ASSOC);

            // Combinar objetivos con sus ejercicios
            $mapa_objetivos = [];
            foreach ($objetivos as $obj) {
                $mapa_objetivos[$obj['rutina_ejercicio_id']][] = $obj;
            }

            foreach ($ejercicios as $i => $ej) {
                $id_ej = $ej['id'];
                $ejercicios[$i]['objetivos'] = $mapa_objetivos[$id_ej] ?? [];
            }

        } catch (Exception $e) {
            // Si falla la query de objetivos (ej: tabla no existe todavia)
            // no bloqueamos la carga. Ponemos array vacio en cada ejercicio.
            // El error real esta en el mensaje de abajo para poder debugearlo.
            foreach ($ejercicios as $i => $ej) {
                $ejercicios[$i]['objetivos'] = [];
            }
            // Guardamos el error para meterlo en la respuesta y poder verlo en el frontend
            $error_objetivos = $e->getMessage();
        }
    }

    // Devolver el resultado (siempre un array para que el frontend no se rompa)
    if (isset($error_objetivos)) {
        // Si los objetivos fallaron lo escribimos en el log de PHP para poder verlo
        // Mira en el log de errores de Apache/PHP: algo como "rutina_objetivos error: ..."
        error_log("get_ejercicios_de_rutina.php - error al cargar objetivos: " . $error_objetivos);
    }
    http_response_code(200);
    echo json_encode($ejercicios);

} catch (Exception $e) {
    // Error en la primera query (ejercicios). Esto si es un error gordo.
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error al obtener los ejercicios de la rutina: " . $e->getMessage(),
        "error" => $e->getMessage()
    ));
}
?>