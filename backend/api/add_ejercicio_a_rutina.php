<?php
// Anadir ejercicio a una rutina

// Cabeceras para peticiones desde el frontend
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Cargar conexion y JWT
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
        echo json_encode(array("mensaje" => "Acceso denegado. Token inválido."));
        die();
    }
} else {
    http_response_code(401);
    echo json_encode(array("mensaje" => "Acceso denegado. No se proporcionó token."));
    die();
}

// Leer datos JSON
$datos = json_decode(file_get_contents("php://input"));
if (
    empty($datos->rutina_id) ||
    empty($datos->ejercicio_id) ||
    !isset($datos->objetivos) ||
    !is_array($datos->objetivos)
) {
    http_response_code(400);
    echo json_encode(array("mensaje" => "Datos incompletos. Se requiere 'rutina_id', 'ejercicio_id' y un array 'objetivos'."));
    die();
}

$id_rutina = (int)$datos->rutina_id;
$id_ejercicio = (int)$datos->ejercicio_id;
$objetivos = $datos->objetivos;

// Guardar en base de datos (con transaccion)
$bd = new Database();
$conexion = $bd->getConnection();

try {
    // Verificar que la rutina es del usuario
    $consulta_dueno = "SELECT usuario_id FROM rutinas WHERE id = :rutina_id LIMIT 1";
    $stmt_dueno = $conexion->prepare($consulta_dueno);
    $stmt_dueno->bindParam(":rutina_id", $id_rutina, PDO::PARAM_INT);
    $stmt_dueno->execute();
    $dueno = $stmt_dueno->fetch(PDO::FETCH_ASSOC);
    if (!$dueno || $dueno['usuario_id'] != $id_usuario) {
        throw new Exception("Acción no permitida. No eres el dueño de esta rutina.", 403);
    }
    
    // La columna 'orden' no existe en rutina_ejercicios, insertamos sin ella
    // Si en el futuro se anade la columna orden a la BD, descomentar el bloque de abajo
    // $consulta_orden = "SELECT MAX(orden) as max_orden FROM rutina_ejercicios WHERE rutina_id = :rutina_id";
    // $stmt_orden = $conexion->prepare($consulta_orden);
    // $stmt_orden->bindParam(":rutina_id", $id_rutina, PDO::PARAM_INT);
    // $stmt_orden->execute();
    // $fila_orden = $stmt_orden->fetch(PDO::FETCH_ASSOC);
    // $orden = ((int)($fila_orden['max_orden'] ?? 0)) + 1;

    // Insertar en rutina_ejercicios (sin orden por ahora)
    $consulta_padre = "INSERT INTO rutina_ejercicios (rutina_id, ejercicio_id) VALUES (:rutina_id, :ejercicio_id)";
    $stmt_padre = $conexion->prepare($consulta_padre);
    $stmt_padre->bindParam(":rutina_id", $id_rutina, PDO::PARAM_INT);
    $stmt_padre->bindParam(":ejercicio_id", $id_ejercicio, PDO::PARAM_INT);
    $stmt_padre->execute();

    $id_rutina_ejercicio = $conexion->lastInsertId();

    // Insertar objetivos
    if (count($objetivos) > 0) {
        $consulta_hijo = "INSERT INTO rutina_objetivos 
                            (rutina_ejercicio_id, num_serie, 
                             tipo_rep_objetivo, reps_min_objetivo, reps_max_objetivo, 
                             peso_kg_objetivo, 
                             tiempo_min_objetivo, distancia_km_objetivo,
                             descanso_seg_post) 
                           VALUES 
                            (:re_id, :num_serie, 
                             :tipo_rep, :reps_min, :reps_max, 
                             :peso, :tiempo, :dist, :desc)";
        
        $stmt_hijo = $conexion->prepare($consulta_hijo);

        foreach ($objetivos as $obj) {
            $stmt_hijo->bindValue(":re_id", $id_rutina_ejercicio);
            $stmt_hijo->bindValue(":num_serie", $obj->num_serie ?? 1);
            $stmt_hijo->bindValue(":tipo_rep", $obj->tipo_rep_objetivo ?? 'fijo');
            $stmt_hijo->bindValue(":reps_min", $obj->reps_min_objetivo ?? null);
            $stmt_hijo->bindValue(":reps_max", $obj->reps_max_objetivo ?? null);
            $stmt_hijo->bindValue(":peso", $obj->peso_kg_objetivo ?? null);
            $stmt_hijo->bindValue(":tiempo", $obj->tiempo_min_objetivo ?? null);
            $stmt_hijo->bindValue(":dist", $obj->distancia_km_objetivo ?? null);
            $stmt_hijo->bindValue(":desc", $obj->descanso_seg_post ?? null);
            $stmt_hijo->execute();
        }
    }
    
    // Devolver el objeto creado (sin re.orden porque no existe en la BD)
    $consulta_nuevo = "SELECT re.id, re.ejercicio_id,
                           ej.nombre as nombre_ejercicio, ej.grupo_muscular, ej.tipo
                       FROM rutina_ejercicios re
                       JOIN ejercicios ej ON re.ejercicio_id = ej.id
                       WHERE re.id = :nuevo_id LIMIT 1";

    $stmt_nuevo = $conexion->prepare($consulta_nuevo);
    $stmt_nuevo->bindParam(":nuevo_id", $id_rutina_ejercicio);
    $stmt_nuevo->execute();
    $ejercicio_agregado = $stmt_nuevo->fetch(PDO::FETCH_ASSOC);
    
    $arr_objetivos = [];
    foreach ($objetivos as $obj) {
        $arr_objetivos[] = (array)$obj;
    }
    $ejercicio_agregado['objetivos'] = $arr_objetivos;

    http_response_code(201);
    echo json_encode(array(
        "mensaje" => "Ejercicio añadido a la rutina exitosamente.",
        "ejercicio_agregado" => $ejercicio_agregado
    ));

} catch (Exception $e) {
    $codigo = $e->getCode() == 403 ? 403 : 500;
    http_response_code($codigo);
    echo json_encode(array(
        "mensaje" => "Error al añadir el ejercicio.",
        "error" => $e->getMessage()
    ));
}
?>