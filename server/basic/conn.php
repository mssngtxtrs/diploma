<?php
namespace Server;

/* Класс базы данных */
class Database {
    /* Поля класса */
    private ?\PDO $conn = null;



    /* Создание класса */
    public function __construct() {
        try {
            $this->conn = $this->connect();
        } catch (\PDOException $e) {
            error_log("Error connecting to the database: " . $e->getCode());
        }
    }



    private function connect(): \PDO {
        global $env;
        $credentials = [
            'hostname' => $env['HOSTNAME'],
            'username' => $env['USERNAME'],
            'password' => $env['PASSWORD'],
            'database' => $env['DATABASE']
        ];

        $dsn = "pgsql:dbname={$credentials['database']};host={$credentials['hostname']}";
        return new \PDO(
            $dsn,
            $credentials['username'],
            $credentials['password']
        );
    }



    /* Обращение к БД */
    public function returnQuery(string $query, string $mode = "assoc", array $params = []): bool|string|array {
        $output = false;

        if ($this->conn === null) {
            $this->connect();
        } else {
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
                    // $raw = $result->fetchAll();
                    // foreach ($raw[0] as $key => $value) {
                    //     if (gettype($key) === "integer") {
                    //         continue;
                    //     }
                    //     $output[$key] = $value;
                    // }
                    $output = $result->fetchAll(\PDO::FETCH_ASSOC);
                    break;
                }
            } catch (\PDOException $e) {
                error_log("Error executing SQL query: " . $e);
            }
        }

        return $output;
    }



    /* Экранирование символов */
    public function escape(string $data): string {
        return htmlspecialchars($data);
    }
}
?>
