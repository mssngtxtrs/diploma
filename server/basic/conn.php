<?php
namespace Server;

/* Класс базы данных */
class Database {
    /* Поля класса */
    private \PDO $conn;



    /* Создание класса */
    public function __construct() {
        try {
            global $env;
            $credentials = [
                'hostname' => $env['HOSTNAME'],
                'username' => $env['USERNAME'],
                'password' => $env['PASSWORD'],
                'database' => $env['DATABASE']
            ];

            $dsn = "pgsql:dbname={$credentials['database']};host={$credentials['hostname']}";
            $this->conn = new \PDO(
                $dsn,
                $credentials['username'],
                $credentials['password']
            );
        } catch (\PDOException $e) {
            error_log("Error connecting to the database: " . $e->getCode());
        }
    }



    /* Обращение к БД */
    public function returnQuery(string $query, string $mode = "assoc", array $params = []): bool|string|array {
        $output = false;

        try {
            $result = $this->conn->prepare($query);
            $result->execute($params);

            switch ($mode) {
            case "bool":
                if ($result->rowCount()) {
                    $output = true;
                }
                break;
            case "single":
                $output = $result->fetchColumn();
                break;
            case "assoc":
            default:
                $output = $result->fetchAll();
                break;
            }
        } catch (\PDOException $e) {
            error_log("Error executing SQL query: " . $e);
        }

        return $output;
    }



    /* Экранирование символов */
    public function escape(string $data): string {
        return htmlspecialchars($data);
    }
}
?>
