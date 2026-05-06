<?php
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);
$query = $_GET;

switch (true) {



case $path == '':
case $path == '/':
    echo $constructor->constructPage(
        [ "header", "index_waves", "page_1", "page_2", "page_3", "page_4", "footer_placeholder" ],
        "Главная",
        $global_flags['show-messages'],
        "index"
    );
    $_SESSION['page_back'] = $request;
    break;



case $path == "/about":
    echo $constructor->constructPage(
        [ "header", "about", "footer" ],
        "О нас",
        $global_flags['show-messages'],
        "about"
    );
    $_SESSION['page_back'] = $request;
    break;



case $path == "/hostings":
    echo $constructor->constructPage(
        [ "header", "hostings", "footer" ],
        "Наши хостинги",
        $global_flags['show-messages'],
        "hostings"
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



case $path == '/request':
    if (empty($_SESSION['user']['login'])) {
        header("Location: /auth?" . htmlspecialchars($_SERVER['QUERY_STRING']));
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


case $path == "/admin":
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
    if (!empty($_SESSION['user']['login'])) {
        header("Location: /dashboard");
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
    require "server/custom/requests.php";

    $output = [];
    $output['response'] = false;

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


    case "/api/auth/register":
        $result = $auth->register(
            [
                "email" => $data['email'],
                "login" => $data['login'],
                "first_name" => $data['first_name'],
                "last_name" => $data['last_name'],
            ],
            $data['password'],
            $data['password_confirm'],
            $data['consent']
        );

        if ($result === true) {
            $output['response'] = true;
        } else {
            $output['message'] = $result;
        }
        break;


    case "/api/auth/log-in":
        $result = $auth->logIn($data['login'], $data['password']);

        if ($result === true) {
            $output['response'] = true;
        } else {
            $output['message'] = $result;
        }
        break;


    case "/api/auth/log-out":
        $result = $auth->logOut();

        if ($result === true) {
            $output['response'] = true;
        } else {
            $output['message'] = $result;
        }
        break;


    case "/api/auth/credentials":
        $result = $auth->getCredentials();

        if ($result === false) {
            $output['message'] = "No credentials found";
        } else {
            $output['response'] = $result;
        }
        break;


    case "/api/requests/total":
        $result = Server\Custom\Requests::getRequestsTotal();

        if ($result === false) {
            $output['message'] = "No requests found";
        } else {
            $output['response'][] = $result;
            $output['response'][] = $auth->getPermissionLevel($_SESSION['user']['login']);
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
        [ "header", "not_found", "footer" ],
        "Страница не найдена",
        $global_flags['show-messages'],
        "not_found"
    );
    $_SESSION['page_back'] = $request;
    break;
}



?>
