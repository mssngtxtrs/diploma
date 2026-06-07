<?php
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$query = $_GET;
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
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


        case "/api/cpus":
            $fetched = Server\Custom\Requests::getCPUs();
            if (count($fetched) > 0) {
                $output['response'] = $fetched;
                unset($output['message']);
            } else {
                $output['message'] = "Empty CPUs query";
            }
            break;


        case "/api/auth/register":
            $result = $auth->register(
                [
                    "email" => $data['email'],
                    "login" => $data['login'],
                    "first_name" => $data['first_name'],
                    "last_name" => $data['last_name'],
                    "second_name" => $data['second_name'],
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


        case "/api/auth/code":
            $result = $auth->createRecoverCode($data['email']);

            if ($result === false) {
                $output['message'] = "Пользователь не найден";
            } else {
                $output['response'] = true;
            }
            break;


        case "/api/auth/recover":
            $result = $auth->recoverPassword($data['token'], $data['new_password'], $data['new_password_confirm']);

            if ($result === false) {
                $output['message'] = "Не удалось сменить пароль";
            } else {
                $output['response'] = $result;
            }
            break;


        case "/api/requests":
            $result = Server\Custom\Requests::getRequests($data['state_id'] ?? null);

            if ($result === false) {
                $output['message'] = "No requests found";
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


        case "/api/requests/filter":
            $result = Server\Custom\Requests::getRequestStates();

            if ($result === false) {
                $output['message'] = "No filter options found";
            } else {
                $output['response'] = $result;
            }
            break;


        case "/api/admin/requests":
            $result = Server\Custom\Requests::getRequestsAdmin();

            if (is_array($result) && isset($result['error'])) {
                $output['message'] = $result['error'];
            } else {
                $output['response'] = $result;
            }
            break;


        case "/api/admin/requests/change":
            $result = Server\Custom\Requests::updateRequestState((int)$_POST['request_id'], (int)$_POST['state_id'], $_POST['ipv4'] ?? null, $_POST['reject_note'] ?? null);

            if ($result === false) {
                $output['message'] = "Изменения не были применены";
            } else {
                $output['response'] = $result;
            }
            break;


        case "/api/admin/users":
            $result = Server\Custom\Requests::getUsers();

            if ($result === false) {
                $output['message'] = "No users found";
            } else {
                $output['response'] = $result;
            }
            break;


        case "/api/admin/users/change_password":
            $result = Server\Custom\Requests::changeUserPassword($data['user_id'], $data['password']);
            if ($result === false) {
                $output['message'] = "Не удалось изменить пароль";
            } else {
                $output['response'] = $result;
            }
            break;


        case "/api/admin/users/change_privilege":
            $result = Server\Custom\Requests::changeUserPrivilege($data['user_id'], $data['level_id']);
            if ($result === false) {
                $output['message'] = "Не удалось изменить привилегии";
            } else {
                $output['response'] = $result;
            }
            break;


        case "/api/admin/users/delete":
            $result = Server\Custom\Requests::deleteUserAccount($data['user_id']);
            if ($result === false) {
                $output['message'] = "Не удалось удалить пользователя";
            } else {
                $output['response'] = $result;
            }
            break;


        case "/api/admin/servers/create":
            $result = Server\Custom\Requests::saveServer($data);
            if ($result === false) {
                $output['message'] = "Не удалось создать сервер";
            } else {
                $output['response'] = true;
            }
            break;


        case "/api/admin/servers/edit":
            $result = Server\Custom\Requests::saveServer($data);
            if ($result === false) {
                $output['message'] = "Не удалось обновить данные сервера";
            } else {
                $output['response'] = true;
            }
            break;


        case "/api/admin/servers/delete":
            $result = Server\Custom\Requests::deleteServer($data['server_id']);
            if ($result === false) {
                $output['message'] = "Не удалось удалить сервер";
            } else {
                $output['response'] = true;
            }
            break;


        case "/api/admin/hostings/create":
            $result = Server\Custom\Requests::saveHosting($data);
            if ($result === false) {
                $output['message'] = "Не удалось создать хостинг";
            } else {
                $output['response'] = true;
            }
            break;


        case "/api/admin/hostings/edit":
            $result = Server\Custom\Requests::saveHosting($data);
            if ($result === false) {
                $output['message'] = "Не удалось обновить данные хостинга";
            } else {
                $output['response'] = true;
            }
            break;


        case "/api/admin/hostings/delete":
            $result = Server\Custom\Requests::deleteHosting($data['hosting_id']);
            if ($result === false) {
                $output['message'] = "Не удалось удалить хостинг";
            } else {
                $output['response'] = true;
            }
            break;


        case "/api/request/revoke":
            $result = Server\Custom\Requests::updateRequestState($data['request_id'], 5, null, null);

            if ($result === false) {
                $output['message'] = "No request found";
            } else {
                $output['response'] = $result;
            }
            break;


        case "/api/request":
            $result = Server\Custom\Requests::createRequest((int)$data['hosting_id'], $data['request_months'], $data['request_note']);

            if ($result === true) {
                $output['response'] = $result;
            } else {
                $output['message'] = $result;
            }
            break;


        case "/api/request/ssh":
            $result = Server\Custom\Requests::getSSHKeyFile($data['ssh_key_name']);

            if (isset($result['error'])) {
                $output['message'] = $result['error'];
            } else {
                header('Content-Description: File Transfer');
                header('Content-Type: application/octet-stream');
                header('Content-Disposition: attachment; filename="' . $result['basename'] . '"');
                header('Expires: 0');
                header('Cache-Control: must-revalidate');
                header('Pragma: public');
                header('Content-Length: ' . $result['filesize']);
                $output = $result['content'];
            }
            break;


        default:
            http_response_code(400);
            $output['message'] = "Wrong URL";
            break;

    }

    echo json_encode($output);
} else {
    // header('Accept-Encoding: gzip, deflate');
    // header('Content-Encoding: gzip');

    switch ($path) {

        case '':
        case '/':
            echo $constructor->constructPage(
                [ "header", "index_waves", "page_1", "page_2", "page_3", "page_4", "footer_placeholder" ],
                "Главная",
                $global_flags['show-messages'],
                "index"
            );
            break;


        case "/about":
            echo $constructor->constructPage(
                [ "header", "about", "footer" ],
                "О нас",
                $global_flags['show-messages'],
                "about"
            );
            break;


        case "/hostings":
            echo $constructor->constructPage(
                [ "header", "hostings", "footer" ],
                "Наши хостинги",
                $global_flags['show-messages'],
                "hostings"
            );
            break;


        case '/dashboard':
            if (empty($_SESSION['user']['login'])) {
                header("Location: /auth");
            } else {
                echo $constructor->constructPage(
                    [ "header", "dashboard", "footer" ],
                    "Личный кабинет",
                    $global_flags['show-messages'],
                    "dashboard"
                );
            }
            break;


        case '/request':
            if (empty($_SESSION['user']['login'])) {
                header("Location: /auth?" . htmlspecialchars($_SERVER['QUERY_STRING']));
            } else {
                echo $constructor->constructPage(
                    [ "header", "request", "footer" ],
                    "Новая заявка",
                    $global_flags['show-messages'],
                    "request"
                );
            }
            break;


        case "/admin":
        case "/admin/requests":
            if (empty($_SESSION['user']['login']) || $auth->getPermissionLevel($_SESSION['user']['login']) !== 2) {
                header("Location: /");
            } else {
                echo $constructor->constructPage(
                    [ "header", "admin_header", "admin", "footer" ],
                    "Админ-панель",
                    $global_flags['show-messages'],
                    "admin"
                );
            }
            break;


        case "/admin/users":
            if (empty($_SESSION['user']['login']) || $auth->getPermissionLevel($_SESSION['user']['login']) !== 2) {
            // if (empty($_SESSION['user']['login'])) {
                header("Location: /");
            } else {
                echo $constructor->constructPage(
                    [ "header", "admin_header", "admin_users", "footer" ],
                    "Админ-панель",
                    $global_flags['show-messages'],
                    "admin_users"
                );
            }
            break;


        case "/admin/servers":
            if (empty($_SESSION['user']['login']) || $auth->getPermissionLevel($_SESSION['user']['login']) !== 2) {
                header("Location: /");
            } else {
                echo $constructor->constructPage(
                    [ "header", "admin_header", "admin_servers", "footer" ],
                    "Админ-панель",
                    $global_flags['show-messages'],
                    "admin_servers"
                );
            }
            break;


        case "/admin/hostings":
            if (empty($_SESSION['user']['login']) || $auth->getPermissionLevel($_SESSION['user']['login']) !== 2) {
                header("Location: /");
            } else {
                echo $constructor->constructPage(
                    [ "header", "admin_header", "admin_hostings", "footer" ],
                    "Админ-панель",
                    $global_flags['show-messages'],
                    "admin_hostings"
                );
            }
            break;



        case '/auth':
            if (!empty($_SESSION['user']['login'])) {
                header("Location: /dashboard");
            } else {
                echo $constructor->constructPage(
                    [ "header", "auth", "footer" ],
                    "Авторизация",
                    $global_flags['show-messages'],
                    "auth"
                );
            }
            break;


        case "/code":
            echo $constructor->constructPage(
                [ "header", "code", "footer" ],
                "Восстановление пароля",
                $global_flags['show-messages'],
                "recover"
            );
            break;


        case "/recover":
            if (empty($_GET['token'])) {
                header("Location:/code");
            } else {
                echo $constructor->constructPage(
                    [ "header", "recover", "footer" ],
                    "Восстановление пароля",
                    $global_flags['show-messages'],
                    "recover"
                );
            }
            break;


        default:
            http_response_code(404);
            echo $constructor->constructPage(
                [ "header", "not_found", "footer" ],
                "Страница не найдена",
                $global_flags['show-messages'],
                "not_found"
            );
            break;

    }
}
?>
