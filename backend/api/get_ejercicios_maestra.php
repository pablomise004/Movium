<?php
// Obtener lista maestra de ejercicios

// Cabeceras CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Hay que responder al OPTIONS o el navegador no deja pasar el GET
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/base_de_datos.php';

// Obtener la lista maestra de ejercicios

try {
    $bd = new Database();
    $conexion = $bd->getConnection();

    // Consulta de ejercicios
    $consulta = "SELECT id, nombre, grupo_muscular, tipo
                 FROM ejercicios
                 ORDER BY nombre ASC";

    $sentencia = $conexion->prepare($consulta);

    // Ejecutar
    $sentencia->execute();

    $numero = $sentencia->rowCount();

    // Comprobar si se encontraron ejercicios
    if ($numero > 0) {

        $ejercicios = $sentencia->fetchAll(PDO::FETCH_ASSOC);

        // Devolver el array de ejercicios como JSON
        http_response_code(200);
        echo json_encode($ejercicios);

    } else {
        // Si la tabla 'ejercicios' esta vacia
        http_response_code(200);
        echo json_encode(array());
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "mensaje" => "Error en la base de datos al obtener ejercicios.",
        "error" => $e->getMessage()
    ));
}
?>