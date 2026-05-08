<?php
// Печать в консоль
// error_log("Hello, World!");

define("GET_REQUESTS_QUERY", <<<HERE
    select r.request_id, r.state_id, r.request_expiration_date
    from requests r
    where r.state_id = 2
HERE);
define("EXPIRE_REQUEST_QUERY", <<<HERE
    update requests
    set state_id = 3, request_expiration_date = null
    where request_id = :request_id
HERE);

// Подключение модуля для работы с БД
require "../../basic/conn.php";

// Получение данных для входа в БД и соединение с ней
$env = parse_ini_file('../../../.env');
$database = new Server\Database();

// Получение запросов из БД
$requests = $database->returnQuery(
    GET_REQUESTS_QUERY,
    "assoc"
);

// Строка с текущей датой
$current_date = date("Y-m-d H:i:s", time());

// Проверка каждого запроса на истечение срока действия
foreach ($requests as $request) {
    checkExpiration($request, $current_date);
}



// Проверка на истечение срока действия запроса
function checkExpiration(array $request, string $current_date) {
    $time_request = strtotime($request['request_expiration_date']);
    $time_current = strtotime($current_date);

    if (gettype($time_request) === "boolean") {
        error_log("[!] Error getting expiration date for request " . $request['request_id']);
        return;
    }
    if ($time_request < $time_current) {
        expireRequest($request['request_id']);
    } else {
        error_log("Request " . $request['request_id'] . " is not expired yet");
    }
}

// Обработка истечения срока действия запроса
function expireRequest(int $request_id) {
    global $database;
    if ($database->returnQuery(
        EXPIRE_REQUEST_QUERY,
        "bool",
        [ "request_id" => $request_id ]
    )) {
        error_log("Request $request_id expired succesfully");
        return;
    } else {
        error_log("[!] Request $request_id was not expired due to unknown error");
        return;
    }
}
