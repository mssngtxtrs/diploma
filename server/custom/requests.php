<?php
namespace Server\Custom;

define("GET_SERVERS_QUERY", <<<HERE
    select s.server_id, s.server_name, c.cpu_name, c.cpu_cores, c.cpu_threads, c.cpu_frequency, s.server_ram, s.server_space
    from servers s
    left join cpus c on s.cpu_id = c.cpu_id
HERE);
define("GET_HOSTINGS_QUERY", <<<HERE
    select h.hosting_id, h.hosting_name, s.server_name, h.hosting_ram, h.hosting_space, h.price_per_month
    from hostings h
    left join servers s on h.server_id = s.server_id
HERE);
define("GET_REQUEST_STATES_QUERY", "select * from request_states");
define("GET_REQUESTS_QUERY", <<<HERE
    select r.request_id, rs.state_name, h.hosting_name, r.request_months, r.request_expiration_date, r.request_note, r.request_price_final
    from requests r
    left join request_states rs on r.state_id = rs.state_id
    left join hostings h on r.hosting_id = h.hosting_id
    where user_id = :user_id
HERE);
define("GET_REQUESTS_ADMIN_QUERY", <<<HERE
    select r.request_id, r.state_id, u.first_name, u.last_nale, u.second_name, h.hosting_name, r.request_months, r.request_expiration_date, r.request_note, r.request_price_final
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
define("GET_HOSTING_MONTHS_QUERY", <<<HERE
    select hosting_months
    from hostings
    where hosting_id = :hosting_id
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
define("GET_USER_DELETING_REQUEST", <<<HERE
    select 1
    from requests r
    where r.request_id = :request_id
    and r.user_id = :user_id
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
    static public function getRequests() {
        global $auth, $database;
        if (empty($_SESSION['user']['login'])) {
            return false;
        } else {
            $user_id = $auth->getUserId($_SESSION['user']['login']);
            return $database->returnQuery(
                GET_REQUESTS_QUERY,
                "assoc",
                [ "user_id" => $user_id ]
            );
        }
    }



    /* Получение заявок администратором */
    static public function getRequestsAdmin() {
        global $auth, $database;
        if (empty($_SESSION['user']['login']) || $auth->getPermissionLevel($_SESSION['user']['login']) < 2) {
            return false;
        } else {
            return $database->returnQuery(
                GET_REQUESTS_ADMIN_QUERY,
                "assoc"
            );
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
    static public function createRequest(int $hosting_id, int $hosting_months, string $request_note) {
        global $auth, $database;
        if (empty($_SESSION['user']['login'])) {
            return false;
        } else {
            if (empty($hosting_id) || empty($hosting_months) || empty($request_note)) {
                return false;
            } else {
                $user_id = $auth->getUserId($_SESSION['user']['login']);

                $hosting_price = $database->returnQuery(
                    GET_HOSTING_PRICE_QUERY,
                    "single",
                    [ "hosting_id" => $hosting_id ]
                );

                $request_price_final = $hosting_price * $hosting_months;

                return $database->returnQuery(
                    CREATE_REQUEST_QUERY,
                    "bool",
                    [
                        "user_id" => $user_id,
                        "hosting_id" => $hosting_id,
                        "hosting_months" => $hosting_months,
                        "request_note" => $request_note,
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
    static public function updateRequestState(int $request_id, int $state_id) {
        global $auth, $database;
        if (empty($_SESSION['user']['login']) || $auth->getPermissionLevel($_SESSION['user']['login']) < 2) {
            return false;
        } else {
            if (empty($request_id) || empty($state_id)) {
                return false;
            } else {
                if ($state_id == 2) {
                    if ($database->returnQuery(
                        GET_EXPIRATION_DATE_QUERY,
                        "single",
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
