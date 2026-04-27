<?php
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);
$query = $_GET;

switch (true) {



case $path == '':
case $path == '/':
    echo $constructor->constructPage(
        [ "header", "footer" ],
        "Главная",
        $global_flags['show-messages']
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
            $global_flags['show-messages']
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
            $global_flags['show-messages']
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
            $global_flags['show-messages']
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
            $global_flags['show-messages']
        );
        $_SESSION['page_back'] = $request;
    }
    break;


case preg_match('#^/api/.*$#', $path):
    require "server/custom/hostings.php";
    require "server/custom/requests.php";
    $output = [];

    switch ($path) {
    case "/api/messages":
        header("Content-Type: application/json");
        $output['return-messages'] = $message_handler->returnMessages($global_flags['debug']);
        echo json_encode($output);
        break;


    default:
        header("Location:/404");
        break;
    }
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
