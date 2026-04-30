<?php
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);
$query = $_GET;

switch (true) {



case $path == '':
case $path == '/':
    echo $constructor->constructPage(
        [ "header", "page_1", "footer" ],
        "Главная",
        $global_flags['show-messages'],
        "index"
    );
    $_SESSION['page_back'] = $request;
    break;



case $path == '/dashboard':
    if (empty($_SESSION['user']['login'])) {
        header("Location: /auth");
    } else {
        echo $constructor->constructPage(
            [ "header", "dashboard", "footer" ],
            "Личный кабинет",
            $global_flags['show-messages'],
            "dashboard"
        );
        $_SESSION['page_back'] = $request;
    }
    break;



case $path == '/requests/new':
    if (empty($_SESSION['user']['login'])) {
        header("Location: /auth");
    } else {
        echo $constructor->constructPage(
            [ "header", "request", "footer" ],
            "Новая заявка",
            $global_flags['show-messages'],
            "request"
        );
        $_SESSION['page_back'] = $request;
    }
    break;


case $path == "/requests/admin":
    if (empty($_SESSION['user']['login']) || $auth->getPermissionLevel($_SESSION['user']['login']) !== 2) {
        header("Location: /");
    } else {
        echo $constructor->constructPage(
            [ "header", "admin", "footer" ],
            "Админ-панель",
            $global_flags['show-messages'],
            "admin"
        );
    }
    break;



case $path == '/auth':
    if (empty($_SESSION['user']['login'])) {
        header("Location: /requests");
    } else {
        echo $constructor->constructPage(
            [ "header", "auth", "footer" ],
            "Авторизация",
            $global_flags['show-messages'],
            "auth"
        );
        $_SESSION['page_back'] = $request;
    }
    break;


case preg_match('#^/api/.*$#', $path):
    require "server/custom/hostings.php";
    require "server/custom/requests.php";

    $output = [];
    $output['response'] = false;
    $output['message'] = "Unknown error";

    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    header("Content-Type: application/json");

    switch ($path) {
    case "/api/messages":
        $output['response'] = $message_handler->returnMessages($global_flags['debug']);
        break;


    case "/api/hostings":
        $fetched = Server\Custom\Requests::getHostings();
        if (count($fetched) > 0) {
            $output['response'] = $fetched;
            unset($output['message']);
        } else {
            $output['message'] = "Empty hostings query";
        }
        break;


    case "/api/servers":
        $fetched = Server\Custom\Requests::getServers();
        if (count($fetched) > 0) {
            $output['response'] = $fetched;
            unset($output['message']);
        } else {
            $output['message'] = "Empty servers query";
        }
        break;


    default:
        http_response_code(400);
        $output['message'] = "Wrong URL";
        break;
    }

    echo json_encode($output);

    break;


default:
    http_response_code(404);
    echo $constructor->constructPage(
        [ "header", "404", "footer" ],
        "Страница не найдена",
        $global_flags['show-messages']
    );
    $_SESSION['page_back'] = $request;
    break;
}



?>
