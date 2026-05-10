<?php
namespace Server\Custom;

define("GET_SERVERS_QUERY", <<<HERE
    select s.server_id, s.server_name, c.cpu_name, c.cpu_cores, c.cpu_threads, c.cpu_frequency
    from servers s
    left join cpus c on s.cpu_id = c.cpu_id
HERE);
define("GET_HOSTINGS_QUERY", <<<HERE
    select h.hosting_id, h.hosting_name, s.server_name, c.cpu_name, c.cpu_cores, c.cpu_threads, c.cpu_frequency, h.hosting_ram, h.hosting_space, h.hosting_vcpu, h.hosting_traffic, h.price_per_month
    from hostings h
    left join servers s on h.server_id = s.server_id
    left join cpus c on s.cpu_id = c.cpu_id
HERE);
define("GET_REQUEST_STATES_QUERY", "select * from request_states");
define("GET_REQUESTS_QUERY", <<<HERE
    select r.request_id, r.state_id, rs.state_name, h.hosting_name, r.request_months, r.request_expiration_date, r.request_note, r.request_ssh_key_name, r.request_ipv4, r.request_price_final
    from requests r
    left join request_states rs on r.state_id = rs.state_id
    left join hostings h on r.hosting_id = h.hosting_id
    where user_id = :user_id
HERE);
define("GET_REQUESTS_TOTAL_QUERY", "select count(*) from requests where user_id = :user_id and (state_id = 1 or state_id = 2)");
define("GET_REQUESTS_ADMIN_QUERY", <<<HERE
    select r.request_id, r.state_id, u.first_name, u.last_name, u.second_name, h.hosting_name, r.request_months, r.request_expiration_date, r.request_note, r.request_ssh_key_name, r.request_price_final
    from requests r
    left join users u on r.user_id = u.user_id
    left join hostings h on r.hosting_id = h.hosting_id
HERE);
define("GET_HOSTING_PRICE_QUERY", <<<HERE
    select h.price_per_month
    from hostings h
    where h.hosting_id = :hosting_id
HERE);
define("INSERT_REQUEST_QUERY", <<<HERE
    insert into requests (user_id, hosting_id, state_id, request_months, request_price_final)
    values (:user_id, :hosting_id, 1, :request_months, :request_price_final)
HERE);
define("GET_EXPIRATION_DATE_QUERY", <<<HERE
    select request_expiration_date
    from requests
    where request_id = :request_id
HERE);
define("GET_REQUEST_MONTHS_QUERY", <<<HERE
    select request_months
    from requests
    where request_id = :request_id
HERE);
define("UPDATE_EXPIRATION_DATE_QUERY", <<<HERE
    update requests
    set request_expiration_date = :request_expiration_date
    where request_id = :request_id
HERE);
define("UPDATE_REQUEST_STATE_QUERY", <<<HERE
    update requests
    set state_id = :state_id
    where request_id = :request_id
HERE);
define("UPDATE_REQUEST_SSH_KEY_QUERY", <<<HERE
    update requests
    set request_ssh_key_name = :ssh_key_name
    where request_id = :request_id
HERE);
define("UPDATE_IPV4_QUERY", <<<HERE
    update requests
    set request_ipv4 = :request_ipv4
    where request_id = :request_id
HERE);
define("GET_USER_DELETING_REQUEST", <<<HERE
    select 1
    from requests r
    where r.request_id = :request_id
    and r.user_id = :user_id
HERE);
define("CREATE_REQUEST_QUERY", <<<HERE
    insert into requests (user_id, hosting_id, state_id, request_months, request_note, request_price_final)
    values (:user_id, :hosting_id, 1, :request_months, :request_note, :request_price_final)
HERE);



class Requests {
    /* Получение серверов */
    static public function getServers() {
        global $database;
        return $database->returnQuery(
            GET_SERVERS_QUERY,
            "assoc"
        );
    }



    /* Получение хостингов */
    static public function getHostings() {
        global $database;
        return $database->returnQuery(
            GET_HOSTINGS_QUERY,
            "assoc"
        );
    }



    /* Получение статусов заявок */
    static public function getRequestStates() {
        global $database;
        return $database->returnQuery(
            GET_REQUEST_STATES_QUERY,
            "assoc"
        );
    }



    /* Получение заявок пользователя */
    static public function getRequests(int | null $state_id = null) {
        global $auth, $database;
        if (empty($_SESSION['user']['login'])) {
            return false;
        } else {
            $user_id = $auth->getUserId($_SESSION['user']['login']);
            if ($state_id === null) {
                return $database->returnQuery(
                    GET_REQUESTS_QUERY,
                    "assoc",
                    [ "user_id" => $user_id ]
                );
            } else {
                return $database->returnQuery(
                    GET_CERTAIN_REQUESTS_QUERY,
                    "assoc",
                    [
                        "user_id" => $user_id,
                        "state_id" => $state_id
                    ]
                );
            }
        }
    }



    /* Получение числа заявок пользователя */
    static public function getRequestsTotal(): bool | int {
        global $auth, $database;
        if (empty($_SESSION['user']['login'])) {
            return false;
        } else {
            $user_id = $auth->getUserId($_SESSION['user']['login']);
            return $database->returnQuery(
                GET_REQUESTS_TOTAL_QUERY,
                "single",
                [ "user_id" => $user_id ]
            );
        }
    }



    /* Получение заявок администратором */
    static public function getRequestsAdmin(): array {
        global $auth, $database;
        if (empty($_SESSION['user']['login'])) {
            return ["error" => "Вы не авторизованы"];
        }

        if ($auth->getPermissionLevel($_SESSION['user']['login']) < 2) {
            return ["error" => "У вас нет прав администратора"];
        }

        return $database->returnQuery(
            GET_REQUESTS_ADMIN_QUERY,
            "assoc"
        );
    }



    static public function getSSHKeyFile(string $filename): array | string {
        global $auth, $database;

        if (empty($_SESSION['user']['login'])) {
            return [ "error" => "Вы не авторизованы" ];
        }

        $user_id = $auth->getUserId($_SESSION['user']['login']);
        $filepath = "private/ssh_keys/" . $user_id . "/" . $filename;

        if (file_exists($filepath)) {
            return [
                "basename" => basename($filepath),
                "content" => readfile($filepath),
                "filesize" => filesize($filepath)
            ];
        } else {
            return [ "error" => "Файл не найден" ];
        }
    }



    /* Создание заявки
    Алгоритм:
    1. Проверка на вход
    2. Проверка на заполнение полей
    3. Расчёт финальной суммы на стороне сервера
        3.1 Получение данных о цене хостинга в месяц
        3.2 Умножение числа месяцев на цену в месяц
    4. Занесение данных в БД */
    static public function createRequest(int $hosting_id, int $request_months, string $request_note): bool | string {
        global $auth, $database;
        if (empty($_SESSION['user']['login'])) {
            return "Вы не вошли в систему";
        } else {
            if (empty($hosting_id) || empty($request_months)) {
                return "Не все поля заполены";
            } else {
                $note = !empty($request_note) ? $request_note : null;

                $user_id = $auth->getUserId($_SESSION['user']['login']);

                $hosting_price = $database->returnQuery(
                    GET_HOSTING_PRICE_QUERY,
                    "single",
                    [ "hosting_id" => $hosting_id ]
                );

                $request_price_final = $hosting_price * $request_months;

                $_SESSION['msg']['std'][] = "Заявка успешно создана";
                return $database->returnQuery(
                    CREATE_REQUEST_QUERY,
                    "bool",
                    [
                        "user_id" => $user_id,
                        "hosting_id" => $hosting_id,
                        "request_months" => $request_months,
                        "request_note" => $note,
                        "request_price_final" => $request_price_final
                    ]
                );
            }
        }
    }



    /* Изменение статуса заявки
    Алгоритм:
    1. Проверка входа и статуса администратора
    2. Проверка на заполнение полей
    3. Задание даты истечения заявки
        3.1 Проверка задаваемого статуса
        3.2 Проверка заполнения даты истечения
        3.3 Если статус == 2:
            3.3.1 Получение текущей даты
            3.3.2 Получение количества месяцев в заявке
            3.3.3 Вычисление даты истечения заявки
            3.3.4 Обновление даты истечения заявки в БД
    4. Обновление статуса заявки в БД */
    static public function updateRequestState(int $request_id, int $state_id, string | null $ipv4) {
        global $auth, $database;
        if (empty($_SESSION['user']['login']) || $auth->getPermissionLevel($_SESSION['user']['login']) < 2) {
            return false;
        } else {
            if (empty($request_id) || empty($state_id)) {
                return false;
            } else {
                if ($state_id == 2) {
                    if (empty($ipv4)) return false;

                    if ($database->returnQuery(
                        GET_EXPIRATION_DATE_QUERY,
                        "bool",
                        [ "request_id" => $request_id ]
                    )) {
                        $current_date = date("Y-m-d");
                        $months = $database->returnQuery(
                            GET_REQUEST_MONTHS_QUERY,
                            "single",
                            [ "request_id" => $request_id ]
                        );
                        $expiration_date = date("Y-m-d", strtotime("$current_date + $months months"));
                        if (!$database->returnQuery(
                            UPDATE_EXPIRATION_DATE_QUERY,
                            "bool",
                            [
                                "request_id" => $request_id,
                                "request_expiration_date" => $expiration_date
                            ]
                        )) {
                            return false;
                        }
                    }

                    if (!$database->returnQuery(
                        UPDATE_IPV4_QUERY,
                        "bool",
                        [
                            "request_id" => $request_id,
                            "request_ipv4" => $ipv4
                        ]
                    )) {
                        return false;
                    }

                    $user_id = $database->returnQuery(
                        "select user_id from requests where request_id = :request_id",
                        "single",
                        [ "request_id" => $request_id ]
                    );

                    $project_root = dirname(__DIR__, 2);
                    $upload_directory = $project_root . "/private/ssh_keys/" . $user_id . "/";
                    if (!file_exists($upload_directory)) {
                        mkdir($upload_directory, 0755, true);
                    }

                    if (isset($_FILES['ssh_key_file'])) {
                        $error = $_FILES['ssh_key_file']['error'];
                        if ($error === UPLOAD_ERR_OK) {
                            $tmp_name = $_FILES['ssh_key_file']['tmp_name'];
                            $filename = $_FILES['ssh_key_file']['name'];
                            if (move_uploaded_file($tmp_name, $upload_directory . $filename)) {
                                if (!$database->returnQuery(
                                    UPDATE_REQUEST_SSH_KEY_QUERY,
                                    "bool",
                                    [
                                        "request_id" => $request_id,
                                        "ssh_key_name" => $filename,
                                    ]
                                )) {
                                    return false;
                                }
                            } else {
                                return false;
                            }
                        }
                    }
                }
                return $database->returnQuery(
                    UPDATE_REQUEST_STATE_QUERY,
                    "bool",
                    [
                        "request_id" => $request_id,
                        "state_id" => $state_id
                    ]
                );
            }
        }
    }



    /* Закрытие заявки
    Алгортим:
    1. Проверка входа
    2. Проверка заполнения полей
    3. Проверка на принадлежность заявки пользователю
    4. Смена статуса заявки на 5 (закрыта пользователем) */
    static public function closeRequest(int $request_id) {
        global $auth, $database;
        if (empty($_SESSION['user']['login'])) {
            return false;
        } else {
            if (empty($request_id)) {
                return false;
            } else {
                $user_id = $auth->getUserID($_SESSION['user']['login']);

                if (!$database->returnQuery(
                    GET_USER_DELETING_REQUEST,
                    "bool",
                    [
                        "request_id" => $request_id,
                        "user_id" => $user_id
                    ])
                ) {
                    return false;
                } else {
                    return $database->returnQuery(
                        UPDATE_REQUEST_STATE_QUERY,
                        "bool",
                        [
                            "request_id" => $request_id,
                            "state_id" => 5
                        ]
                    );
                }
            }
        }
    }
}
