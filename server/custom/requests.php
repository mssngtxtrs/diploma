<?php
namespace Server\Custom;

define("GET_SERVERS_QUERY", <<<HERE
    select s.server_id, s.server_name, s.server_space_total, s.server_space_reserved, s.cpu_id, c.cpu_name, c.cpu_cores, c.cpu_threads, c.cpu_frequency, s.server_omit
    from servers s
    left join cpus c on s.cpu_id = c.cpu_id
HERE);
define("GET_HOSTINGS_QUERY", <<<HERE
    select h.hosting_id, h.hosting_name, h.server_id, s.server_name, s.server_space_total, s.server_space_reserved, c.cpu_name, c.cpu_cores, c.cpu_threads, c.cpu_frequency, h.hosting_ram, h.hosting_space, h.hosting_vcpu, h.hosting_traffic, h.price_per_month, h.hosting_omit, s.server_omit
    from hostings h
    left join servers s on h.server_id = s.server_id
    left join cpus c on s.cpu_id = c.cpu_id
HERE);
define("GET_CPUS_QUERY", <<<HERE
    select c.cpu_id, c.cpu_name, c.cpu_cores, c.cpu_threads, c.cpu_frequency
    from cpus c
HERE);
define("GET_REQUEST_STATES_QUERY", "select * from request_states");
define("GET_REQUESTS_QUERY", <<<HERE
    select r.request_id, r.state_id, rs.state_name, h.hosting_name, r.request_months, r.request_expiration_date, r.request_note, r.request_ssh_key_name, r.request_ipv4, r.request_price_final, r.request_reject_note
    from requests r
    left join request_states rs on r.state_id = rs.state_id
    left join hostings h on r.hosting_id = h.hosting_id
    where user_id = :user_id
HERE);
define("GET_REQUESTS_TOTAL_QUERY", "select count(*) from requests where user_id = :user_id and (state_id = 1 or state_id = 2)");
define("GET_REQUESTS_ADMIN_QUERY", <<<HERE
    select r.request_id, r.state_id, u.first_name, u.last_name, u.second_name, h.hosting_name, r.request_months, r.request_expiration_date, r.request_note, r.request_ssh_key_name, r.request_ipv4, r.request_price_final, r.request_reject_note
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
    insert into requests (user_id, hosting_id, state_id, request_months, request_note, request_price_final, request_space_reserved)
    values (:user_id, :hosting_id, 1, :request_months, :request_note, :request_price_final, 1)
HERE);



class Requests {
    /* Получение серверов */
    static public function getServers() {
        global $database;
        $output = [];

        $raw = $database->returnQuery(
            GET_SERVERS_QUERY,
            "assoc"
        );

        foreach ($raw as $server) {
            if ($server['server_omit'] === true) {
                continue;
            }

            $output[] = $server;
        }

        return $output;
    }



    /* Получение хостингов */
    static public function getHostings() {
        global $database;
        $output = [];

        $raw = $database->returnQuery(
            GET_HOSTINGS_QUERY,
            "assoc"
        );

        foreach ($raw as $hosting) {
            if ($hosting['hosting_omit'] === true || $hosting['server_omit'] === true) {
                continue;
            }

            $input = array(
                "invalid" => false,
            );

            if (
                $hosting['server_space_reserved'] + $hosting['hosting_space'] > $hosting['server_space_total'] ||
                empty($hosting['server_id'])
            ) {
                $input['invalid'] = true;
            }

            $input = array_merge($input, $hosting);
            $output[] = $input;
        }

        return $output;
    }



    /* Получение CPU */
    static public function getCPUs() {
        global $database;
        return $database->returnQuery(
            GET_CPUS_QUERY,
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

                $server_space_calculated = $database->returnQuery(
                    <<<HERE
                        select sum(s.server_space_reserved + h.hosting_space)
                        from hostings h
                        left join servers s on h.server_id = s.server_id
                        where h.hosting_id = :hosting_id
                    HERE,
                    "single",
                    [ "hosting_id" => $hosting_id ]
                );

                $server_space_total = $database->returnQuery(
                    <<<HERE
                        select server_space_total
                        from servers
                        where server_id =
                            ( select s.server_id
                            from hostings h
                            left join servers s on h.server_id = s.server_id
                            where h.hosting_id = :hosting_id )
                    HERE,
                    "single",
                    [ "hosting_id" => $hosting_id ]
                );

                if ($server_space_calculated <= $server_space_total) {
                    if (!$database->returnQuery(
                        <<<HERE
                            update servers
                            set server_space_reserved = :new_space
                            where server_id =
                                ( select h.server_id
                                from hostings h
                                where h.hosting_id = :hosting_id)
                        HERE,
                        "bool",
                        [
                            "new_space" => $server_space_calculated,
                            "hosting_id" => $hosting_id
                        ]
                    )) {
                        return "Не удалось зарезервировать место для хостинга";
                    }
                } else {
                    return "На сервере недостаточно места для создания заявки";
                }


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
    static public function updateRequestState(int $request_id, int $state_id, string | null $ipv4, string | null $reject_note) {
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

                if ($state_id <= 2) {
                    if ((int)$database->returnQuery(
                        "select request_space_reserved from requests where request_id = :request_id",
                        "single",
                        [ "request_id" => $request_id ]
                    ) != 1) {
                        if (!$database->returnQuery(
                            <<<HERE
                                update servers
                                set server_space_reserved =
                                    ( select sum(s.server_space_reserved + h.hosting_space)
                                    from requests r
                                    left join hostings h on r.hosting_id = h.hosting_id
                                    left join servers s on h.server_id = s.server_id
                                    where r.request_id = :request_id )
                                where server_id =
                                    ( select s.server_id
                                    from requests r
                                    left join hostings h on r.hosting_id = h.hosting_id
                                    left join servers s on h.server_id = s.server_id
                                    where r.request_id = :request_id );
                                update requests
                                set request_space_reserved = 1
                                where request_id = :request_id;
                            HERE,
                            "bool",
                            [ "request_id" => $request_id ]
                        )) {
                            return false;
                        }
                    }
                }

                if ($state_id > 2) {
                    if (!$database->returnQuery(
                        <<<HERE
                            update servers
                            set server_space_reserved =
                                ( select sum(s.server_space_reserved - h.hosting_space)
                                from requests r
                                left join hostings h on r.hosting_id = h.hosting_id
                                left join servers s on h.server_id = s.server_id
                                where r.request_id = :request_id )
                            where server_id =
                                ( select s.server_id
                                from requests r
                                left join hostings h on r.hosting_id = h.hosting_id
                                left join servers s on h.server_id = s.server_id
                                where r.request_id = :request_id )
                        HERE,
                        "bool",
                        [ "request_id" => $request_id ]
                    ) || !$database->returnQuery(
                        <<<HERE
                            update requests
                            set request_space_reserved = 0
                            where request_id = :request_id
                        HERE,
                        "bool",
                        [ "request_id" => $request_id ]
                    )) {
                        return false;
                    }
                }

                if ($state_id == 4) {
                    if (!$database->returnQuery(
                        "update requests set request_reject_note = :reject_note where request_id = :request_id",
                        "bool",
                        [
                            'reject_note' => $reject_note,
                            'request_id' => $request_id
                        ]
                    )) {
                        return false;
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



    static public function getUsers() {
        global $auth, $database;
        if (empty($_SESSION['user']['login']) || $auth->getPermissionLevel($_SESSION['user']['login']) < 2) {
            return false;
        }

        return $database->returnQuery(
            <<<HERE
                select u.login, u.user_id, u.first_name, u.last_name, u.second_name, u.level_id, pl.level_name, u.email
                from users u
                left join permission_levels pl on u.level_id = pl.level_id
            HERE,
            "assoc"
        );
    }



    static public function changeUserPassword($user_id, $password) {
        global $auth, $database;

        if (empty($_SESSION['user']['login']) || $auth->getPermissionLevel($_SESSION['user']['login']) < 2) {
            return false;
        }

        if (empty($user_id) || empty($password)) {
            return false;
        }

        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        return $database->returnQuery(
            <<<HERE
                update users
                set password = :password
                where user_id = :user_id
            HERE,
            "bool",
            [
                "password" => $hashed_password,
                "user_id" => $user_id
            ]
        );
    }



    static public function changeUserPrivilege($user_id, $level_id) {
        global $auth, $database;

        if (empty($_SESSION['user']['login']) || $auth->getPermissionLevel($_SESSION['user']['login']) < 2) {
            return false;
        }

        if (empty($user_id) || empty($level_id)) {
            return false;
        }

        return $database->returnQuery(
            <<<HERE
                update users
                set level_id = :level_id
                where user_id = :user_id
            HERE,
            "bool",
            [
                "level_id" => $level_id,
                "user_id" => $user_id
            ]
        );
    }



    static public function deleteUserAccount($user_id) {
        global $auth, $database;

        if (empty($_SESSION['user']['login']) || $auth->getPermissionLevel($_SESSION['user']['login']) < 2) {
            return false;
        }

        if (empty($user_id)) {
            return false;
        }

        $database->returnQuery(
            <<<HERE
                update requests
                set state_id = 4,
                    request_reject_note = 'Пользователь удалён',
                    user_id = null
                where user_id = :user_id
            HERE,
            "bool",
            [
                "user_id" => $user_id
            ]
        );

        return $database->returnQuery(
            <<<HERE
                delete from users
                where user_id = :user_id
            HERE,
            "bool",
            [
                "user_id" => $user_id
            ]
        );
    }



    static public function saveServer($data) {
        global $auth, $database;

        if (empty($_SESSION['user']['login']) || $auth->getPermissionLevel($_SESSION['user']['login']) < 2) {
            return false;
        }

        if (empty($data['server_name']) || empty($data['server_space_total']) || empty($data['cpu_id'])) {
            return false;
        }

        $cpu_id = $data['cpu_id'];

        if ($cpu_id === 'new') {
            if (empty($data['cpu_name']) || empty($data['cpu_cores']) || empty($data['cpu_threads']) || empty($data['cpu_frequency'])) {
                return false;
            }

            $cpu_inserted = $database->returnQuery(
                <<<HERE
                    insert into cpus (cpu_name, cpu_cores, cpu_threads, cpu_frequency)
                    values (:name, :cores, :threads, :freq)
                HERE,
                "bool",
                [
                    "name" => $data['cpu_name'],
                    "cores" => $data['cpu_cores'],
                    "threads" => $data['cpu_threads'],
                    "freq" => $data['cpu_frequency']
                ]
            );

            if (!$cpu_inserted) return false;

            $cpu_id = $database->returnQuery(
                <<<HERE
                    select cpu_id from cpus
                    where cpu_name = :name
                    order by cpu_id desc limit 1
                HERE,
                "single",
                ["name" => $data['cpu_name']]
            );
        }

        if (isset($data['server_id']) && !empty($data['server_id'])) {
            return $database->returnQuery(
                <<<HERE
                    update servers
                    set server_name = :name,
                        server_space_total = :space,
                        cpu_id = :cpu_id
                    where server_id = :server_id
                HERE,
                "bool",
                [
                    "name" => $data['server_name'],
                    "space" => $data['server_space_total'],
                    "cpu_id" => $cpu_id,
                    "server_id" => $data['server_id']
                ]
            );
        } else {
            return $database->returnQuery(
                <<<HERE
                    insert into servers (server_name, server_space_total, cpu_id, server_space_reserved, server_omit)
                    values (:name, :space, :cpu_id, 0, false)
                HERE,
                "bool",
                [
                    "name" => $data['server_name'],
                    "space" => $data['server_space_total'],
                    "cpu_id" => $cpu_id
                ]
            );
        }
    }



    static public function saveHosting($data) {
        global $auth, $database;

        if (empty($_SESSION['user']['login']) || $auth->getPermissionLevel($_SESSION['user']['login']) < 2) {
            return false;
        }

        if (empty($data['hosting_name']) || empty($data['hosting_ram']) || empty($data['hosting_vcpu']) || empty($data['hosting_traffic']) || empty($data['price_per_month'])) {
            return false;
        }

        if (isset($data['hosting_id']) && !empty($data['hosting_id'])) {
            return $database->returnQuery(
                <<<HERE
                    update hostings
                    set hosting_name = :name,
                        hosting_ram = :ram,
                        hosting_vcpu = :vcpu,
                        hosting_traffic = :traffic,
                        price_per_month = :price_per_month
                    where hosting_id = :hosting_id
                HERE,
                "bool",
                [
                    "name" => $data['hosting_name'],
                    "ram" => $data['hosting_ram'],
                    "vcpu" => $data['hosting_vcpu'],
                    "traffic" => $data['hosting_traffic'],
                    "hosting_id" => $data['hosting_id'],
                    "price_per_month" => $data['price_per_month']
                ]
            );
        } else {
            if (empty($data['hosting_space']) || empty($data['server_id'])) {
                return false;
            }

            return $database->returnQuery(
                <<<HERE
                    insert into hostings (hosting_name, hosting_ram, hosting_space, hosting_vcpu, hosting_traffic, server_id, price_per_month, hosting_omit)
                    values (:name, :ram, :space, :vcpu, :traffic, :server_id, :price_per_month, false)
                HERE,
                "bool",
                [
                    "name" => $data['hosting_name'],
                    "ram" => $data['hosting_ram'],
                    "space" => $data['hosting_space'],
                    "vcpu" => $data['hosting_vcpu'],
                    "traffic" => $data['hosting_traffic'],
                    "server_id" => $data['server_id'],
                    "price_per_month" => $data['price_per_month']
                ]
            );
        }
    }



    static public function deleteServer($server_id) {
        global $auth, $database;

        if (empty($_SESSION['user']['login']) || $auth->getPermissionLevel($_SESSION['user']['login']) < 2) {
            return false;
        }

        if (empty($server_id)) {
            return false;
        }

        return $database->returnQuery(
            <<<HERE
                update servers
                set server_omit = true
                where server_id = :server_id
            HERE,
            "bool",
            [
                "server_id" => $server_id
            ]
        );
    }



    static public function deleteHosting($hosting_id) {
        global $auth, $database;

        if (empty($_SESSION['user']['login']) || $auth->getPermissionLevel($_SESSION['user']['login']) < 2) {
            return false;
        }

        if (empty($hosting_id)) {
            return false;
        }

        return $database->returnQuery(
            <<<HERE
                update hostings
                set hosting_omit = true
                where hosting_id = :hosting_id
            HERE,
            "bool",
            [
                "hosting_id" => $hosting_id
            ]
        );
    }
}
