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
        [ "header", "banner", "advantages", "hostings-slider", "banner-2", "footer" ],
        "Главная",
        $global_flags['show-messages']
    );
    $_SESSION['page_back'] = $request;
    break;



case $path == '/sitemap':
    echo $constructor->constructPage(
        [ "header", "sitemap", "footer" ],
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
            [ "header", "account", "footer" ],
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
            [ "header", "new-request", "footer" ],
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
            [ "header", "admin", "footer" ],
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
    case "/api/hostings":
        header("Content-Type: application/json");
        $output['hostings-info'] = Server\Custom\Hostings::returnHostings();
        echo json_encode($output);
        break;


    case "/api/hostings/cpu":
        header("Content-Type: application/json");
        $output['cpu-info'] = Server\Custom\Hostings::returnCPU();
        echo json_encode($output);
        break;


    case "/api/messages":
        header("Content-Type: application/json");
        $output['return-messages'] = $message_handler->returnMessages($global_flags['debug']);
        echo json_encode($output);
        break;


    case "/api/auth/log-out":
        $auth->logout();
        header("Location: {$_SESSION['page_back']}");
        break;


    case "/api/auth/log-in":
        $output['log-in'] = $auth->login(
            $database->escape($_POST['login']),
            $database->escape($_POST['password'])
        );
        /* echo json_encode($output); */
        header("Location: {$_SESSION['page_back']}");
        break;


    case "/api/auth/register":
        $output['register'] = $auth->register(
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
        if ($auth->getLogInStatus()) {
            $output['get-name'] = $auth->getName();
        } else {
            $output['get-name'] = false;
        }
        echo json_encode($output);
        break;


    case "/api/auth/get-credentials":
        header("Content-Type: application/json");
        if ($auth->getLogInStatus()) {
            $output['get-credentials'] = $auth->getCredentials();
        } else {
            $output['get-credentials'] = false;
        }
        echo json_encode($output);
        break;


    case "/api/auth/get-log-in-status":
        header("Content-Type: application/json");
        $output['get-log-in-status'] = $auth->getLogInStatus();
        echo json_encode($output);
        break;


    case "/api/requests/get-permissions":
        header("Content-Type: application/json");
        if ($auth->getLogInStatus()) {
            $output['get-permissions'] = Server\Custom\Requests::getPermissions();
        } else {
            $output['get-permissions'] = false;
        }
        echo json_encode($output);
        break;


    case "/api/requests/get-states":
        header("Content-Type: application/json");
        if ($auth->getLogInStatus()) {
            $output['get-states'] = Server\Custom\Requests::getStates();
        } else {
            $output['get-states'] = false;
        }
        echo json_encode($output);
        break;


    case "/api/requests/get":
        header("Content-Type: application/json");
        if ($auth->getLogInStatus()) {
            $output['get-requests'] = Server\Custom\Requests::getRequests(
                $auth->getUserID($_SESSION['user']['login'])
            );
        } else {
            $output['get-requests'] = false;
        }
        echo json_encode($output);
        break;


    case "/api/requests/get-admin":
        header("Content-Type: application/json");
        if ($auth->getPermissionLevel() == 3) {
            $output['get-requests-admin'] = Server\Custom\Requests::getRequestsAdmin();
        } else {
            $output['get-requests-admin'] = false;
        }
        echo json_encode($output);
        break;


    case "/api/requests/new":
        header("Content-Type: application/json");
        if ($auth->getLogInStatus()) {
            $output['new-request'] = Server\Custom\Requests::newRequest(
                $database->escape($_POST['hosting']),
                $database->escape($_POST['months']),
                $auth->getUserID($_SESSION['user']['login']),
                $database->escape($_POST['note']),
            );
        } else {
            $output['new-request'] = false;
        }
        /* echo json_encode($output); */
        header("Location: /requests");
        break;


    case "/api/requests/state":
        header("Content-Type: application/json");
        if ($auth->getLogInStatus() && $auth->getPermissionLevel() == 3) {
            if (!$_POST) {
                $output['commit-state'] = [
                    'type' => "error",
                    'message' => "Данные не были отправлены",
                    'request' => $_POST
                ];
            } else {
                $output['commit-state'] = Server\Custom\Requests::setStatus(
                    $database->escape($_POST['id']),
                    $database->escape($_POST['value'])
                );
            }
        }
        echo json_encode($output);
        break;


    case "/api/requests/close":
        header("Content-Type: application/json");
        if ($auth->getLogInStatus()) {
            $output['close-request'] = Server\Custom\Requests::closeRequest(
                $database->escape($_POST['reservationID']),
                $auth->getUserID($_SESSION['user']['login'])
            );
        } else {
            $output['close-request'] = false;
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
        [ "header", "rickroll", "footer" ],
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
