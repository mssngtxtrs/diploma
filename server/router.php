<?php
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);
$query = $_GET;

/* echo "<pre>"; */
/* var_dump($request); */
/* var_dump($path); */
/* var_dump($query); */
/* echo "</pre>"; */

switch (true) {



case $path == '':
case $path == '/':
    echo $constructor->constructPage(
        [ "head", "header", "banner", "advantages", "hostings-slider", "banner-2", "footer" ],
        "Главная",
        $global_flags['show-messages']
    );
    $_SESSION['page_back'] = $request;
    break;



case $path == '/sitemap':
    echo $constructor->constructPage(
        [ "head", "header", "sitemap", "footer" ],
        "Карта сайта",
        $global_flags['show-messages']
    );
    $_SESSION['page_back'] = $request;
    break;



case $path == '/requests':
    if (!$auth->getLogInStatus()) {
        header("Location: /auth");
    } else {
        echo $constructor->constructPage(
            [ "head", "header", "account", "footer" ],
            "Личный кабинет",
            $global_flags['show-messages']
        );
        $_SESSION['page_back'] = $request;
    }
    break;



case $path == '/requests/new':
    if (!$auth->getLogInStatus()) {
        header("Location: /auth");
    } else {
        echo $constructor->constructPage(
            [ "head", "header", "new-request", "footer" ],
            "Новая заявка",
            $global_flags['show-messages']
        );
        $_SESSION['page_back'] = $request;
    }
    break;


case $path == "/requests/admin":
    if ($auth->getPermissionLevel() !== 3) {
        header("Location: /what");
    } else {
        echo $constructor->constructPage(
            [ "head", "header", "admin", "footer" ],
            "Админ-панель",
            $global_flags['show-messages']
        );
    }
    break;



case $path == '/auth':
    if ($auth->getLogInStatus()) {
        header("Location: /requests");
    } else {
        echo $constructor->constructPage(
            [ "head", "header", "auth", "footer" ],
            "Авторизация",
            $global_flags['show-messages']
        );
        $_SESSION['page_back'] = $request;
    }
    break;


case preg_match('#^/api/.*$#', $path):
    require "server/custom/hostings.php";
    require "server/custom/requests.php";
    $output = [
        'action' => null,
        'output' => null
    ];

    switch ($path) {
    case "/api/hostings":
        header("Content-Type: application/json");
        $output['action'] = 'hostings-info';
        $output['output'] = Server\Custom\Hostings::returnHostings();
        echo json_encode($output);
        break;


    case "/api/hostings/cpu":
        header("Content-Type: application/json");
        $output['action'] = 'cpu-info';
        $output['output'] = Server\Custom\Hostings::returnCPU();
        echo json_encode($output);
        break;


    case "/api/messages":
        header("Content-Type: application/json");
        $output['action'] = 'return-messages';
        $output['output'] = $message_handler->returnMessages($global_flags['debug']);
        echo json_encode($output);
        break;


    case "/api/auth/log-out":
        $output['action'] = "log-out";
        $output['output'] = $auth->logout();
        /* echo json_encode($output); */
        header("Location: {$_SESSION['page_back']}");
        break;


    case "/api/auth/log-in":
        $output['action'] = "log-in";
        $output['output'] = $auth->login(
            $database->escape($_POST['login']),
            $database->escape($_POST['password'])
        );
        /* echo json_encode($output); */
        header("Location: {$_SESSION['page_back']}");
        break;


    case "/api/auth/register":
        $output['action'] = "register";
        $output['output'] = $auth->register(
            [
                'email' => $database->escape($_POST['email']) ?? "",
                'login' => $database->escape($_POST['login']) ?? "",
                'firstName' => $database->escape($_POST['firstName']) ?? "",
                'lastName' => $database->escape($_POST['lastName']) ?? ""
            ],
            $database->escape($_POST['password']) ?? "",
            $database->escape($_POST['password-confirm']) ?? "",
            $database->escape($_POST['consent']) ?? ""
        );
        /* echo json_encode($output); */
        header("Location: {$_SESSION['page_back']}");
        break;


    case "/api/auth/get-name":
        header("Content-Type: application/json");
        $output['action'] = "get-name";
        if ($auth->getLogInStatus()) {
            $output['output'] = $auth->getName();
        } else {
            $output['output'] = false;
        }
        echo json_encode($output);
        break;


    case "/api/auth/get-credentials":
        header("Content-Type: application/json");
        $output['action'] = "get-credentials";
        if ($auth->getLogInStatus()) {
            $output['output'] = $auth->getCredentials();
        } else {
            $output['output'] = false;
        }
        echo json_encode($output);
        break;


    case "/api/auth/get-log-in-status":
        header("Content-Type: application/json");
        $output['action'] = "get-log-in-status";
        $output['output'] = $auth->getLogInStatus();
        echo json_encode($output);
        break;


    case "/api/requests/get-permissions":
        header("Content-Type: application/json");
        $output['action'] = "get-permissions";
        if ($auth->getLogInStatus()) {
            $output['output'] = Server\Custom\Requests::getPermissions();
        } else {
            $output['output'] = false;
        }
        echo json_encode($output);
        break;


    case "/api/requests/get-states":
        header("Content-Type: application/json");
        $output['action'] = "get-states";
        if ($auth->getLogInStatus()) {
            $output['output'] = Server\Custom\Requests::getStates();
        } else {
            $output['output'] = false;
        }
        echo json_encode($output);
        break;


    case "/api/requests/get":
        header("Content-Type: application/json");
        $output['action'] = "get-requests";
        if ($auth->getLogInStatus()) {
            $output['output'] = Server\Custom\Requests::getRequests(
                $auth->getUserID($_SESSION['user']['login'])
            );
        } else {
            $output['output'] = false;
        }
        echo json_encode($output);
        break;


    case "/api/requests/get-admin":
        header("Content-Type: application/json");
        $output['action'] = "get-requests-admin";
        if ($auth->getPermissionLevel() == 3) {
            $output['output'] = Server\Custom\Requests::getRequestsAdmin();
        } else {
            $output['output'] = false;
        }
        echo json_encode($output);
        break;


    case "/api/requests/new":
        header("Content-Type: application/json");
        $output['action'] = "new-request";
        if ($auth->getLogInStatus()) {
            $output['output'] = Server\Custom\Requests::newRequest(
                $database->escape($_POST['hosting']),
                $database->escape($_POST['months']),
                $auth->getUserID($_SESSION['user']['login']),
                $database->escape($_POST['note']),
            );
        } else {
            $output['output'] = false;
        }
        /* echo json_encode($output); */
        header("Location: /requests");
        break;


    case "/api/requests/state":
        header("Content-Type: application/json");
        $output['action'] = "get-requests-admin";
        if ($auth->getLogInStatus() && $auth->getPermissionLevel() == 3) {
            if (!$_POST) {
                $output['output'] = [
                    'type' => "error",
                    'message' => "Данные не были отправлены",
                    'request' => $_POST
                ];
            } else {
                $output['output'] = Server\Custom\Requests::setStatus(
                    $database->escape($_POST['id']),
                    $database->escape($_POST['value'])
                );
            }
        }
        echo json_encode($output);
        break;


    case "/api/requests/close":
        header("Content-Type: application/json");
        $output['action'] = "new-request";
        if ($auth->getLogInStatus()) {
            $output['output'] = Server\Custom\Requests::closeRequest(
                $database->escape($_POST['reservationID']),
                $auth->getUserID($_SESSION['user']['login'])
            );
        } else {
            $output['output'] = false;
        }
        /* echo json_encode($output); */
        header("Location: /requests");
        break;


    default:
        header("Location:/404");
        break;
    }
    break;



case $path == '/what':
    echo $constructor->constructPage(
        [ "head", "header", "rickroll", "footer" ],
        "Вам бы лучше и не знать...",
        $global_flags['show-messages']
    );
    $_SESSION['page_back'] = $request;
    break;


default:
    http_response_code(404);
    echo $constructor->constructPage(
        [ "head", "header", "404", "footer" ],
        "Страница не найдена",
        $global_flags['show-messages']
    );
    $_SESSION['page_back'] = $request;
    break;
}



?>
