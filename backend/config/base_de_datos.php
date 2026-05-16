<?php
// Configuracion de conexion a BD

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        $this->host = "localhost";
        $this->db_name = "moviumpeque";
        $this->username = "root";
        $this->password = "1234";
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
            // var_dump($this->conn); // para probar que conecta
        } catch (PDOException $exception) {
            http_response_code(500);
            echo json_encode(array(
                "mensaje" => "Error al conectar con la base de datos: " . $exception->getMessage()
            ));
            exit();
        }
        return $this->conn;
    }
}
?>