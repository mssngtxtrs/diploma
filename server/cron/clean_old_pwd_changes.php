<?php
define("GET_PASSWORD_RESETS_QUERY", <<<HERE
    select pr.id, pr.expires_at
    from password_resets pr
HERE);
define("REMOVE_OLD_PASSWORD_RESETS_QUERY", <<<HERE
    delete from password_resets pr
    where pr.id = :id
HERE);

// Подключение модуля для работы с БД
require "../basic/conn.php";

// Получение данных для входа в БД и соединение с ней
$env = parse_ini_file('../../.env');
$database = new Server\Database();

// Получение запросов из БД
$resets = $database->returnQuery(
    GET_PASSWORD_RESETS_QUERY,
    "assoc"
);

// Строка с текущей датой
$now = DateTime::createFromFormat('U.u', microtime(true));
$current_date = $now->format("Y-m-d H:i:s.u");

// Проверка каждого запроса на истечение срока действия
foreach ($resets as $reset) {
    checkExpiration($reset, $current_date);
}



// Проверка на истечение срока действия запроса
function checkExpiration(array $reset, string $current_date) {
    $time_reset = strtotime($reset['expires_at']);
    $time_current = strtotime($current_date);

    if (gettype($time_reset) === "boolean") {
        error_log("[!] Error getting expiration date for reset " . $reset['id']);
        return;
    }
    if ($time_reset < $time_current) {
        expireReset($reset['id']);
    } else {
        error_log("Reset " . $reset['id'] . " is not expired yet");
    }
}

// Обработка истечения срока действия запроса
function expireReset(int $reset_id) {
    global $database;
    if ($database->returnQuery(
        REMOVE_OLD_PASSWORD_RESETS_QUERY,
        "bool",
        [ "id" => $reset_id ]
    )) {
        error_log("Reset $reset_id removed succesfully");
        return;
    } else {
        error_log("[!] Reset $reset_id was not removed due to unknown error");
        return;
    }
}
