<?php
namespace Server;

/* Константы с запросами */
define("PASSWORD_QUERY", "select password from users where user_id = :user_id");
define("USER_ID_QUERY", "select user_id from users where login = :login");
define("PERMISSION_QUERY", "select level_id from users where user_id = :user_id");
define("LOGIN_QUERY", "select login from users where login = :login");
define("GET_CREDENTIALS_QUERY", "select first_name, last_name, email, level_id from users where user_id = :user_id");
define("REGISTER_QUERY", "insert into users (email, login, password, first_name, last_name, level_id) values (:email, :login, :password, :first_name, :last_name, 1)");

/* Класс авторизации */
class Auth {



    /* Подтверждение пароля */
    private static function verifyPassword(string $password, int $user_id): bool {
        global $database;

        return password_verify(
            $password,
            $database->returnQuery(
                PASSWORD_QUERY,
                "single",
                [ 'user_id' => $user_id ]
            )
        );
    }



    /* Получение ID пользователя */
    public function getUserID(string $login): int {
        global $database;
        return $database->returnQuery(
            USER_ID_QUERY,
            "single",
            [ 'login' => $login ]
        );
    }



    /* Получение уровня привелегий пользоователя */
    public function getPermissionLevel(string $login): int {
        global $database;

        $user_id = $this->getUserID($login);

        return $database->returnQuery(
            PERMISSION_QUERY,
            "single",
            [ 'userID' => $user_id ]
        );
    }



    /* Получение данных пользователя */
    public function getCredentials(): array | bool {
        if (!empty($_SESSION['credentials'])) {
            return [
                'first_name' => $_SESSION['credentials']['first_name'],
                'last_name' => $_SESSION['credentials']['last_name'],
                'email' => $_SESSION['credentials']['email'],
                'level_id' => $_SESSION['credentials']['level_id'],
            ];
        } else {
            return false;
        }
    }



    /* Получение статуса входа пользователя */
    public function getLogInStatus(): bool {
        return $this->is_logged_in;
    }



    /* Вход */
    public function logIn(string $login, string $password): string | bool {
        global $database;
        $user_id = $this->getUserID($login);
        $output = "Неизвестная ошибка";

        /* Проверки: */
        /*     1. Получены ли данные из формы */
        /*     2. Есть ли пользователь в БД */
        /*     3. Верен ли пароль */
        /*     4. Удалось ли получить данные из БД */
        /* При успехе: внесение данных для автоматического входа в сессию */
        if (empty($password) && empty($login)) {
            $output = "Данные для входа не были переданы";
        } else {
            if (empty($user_id)) {
                $output = "Пользователя с таким логином не существует";
            } else {
                if (!$this->verifyPassword($password, $user_id, true)) {
                    $output = "Неверный пароль";
                } else {
                    $credentials = $database->returnQuery(
                        GET_CREDENTIALS_QUERY,
                        "assoc",
                        [ 'user_id' => $user_id ]
                    );
                    if (!empty($credentials[0])) {
                        $_SESSION['user']['login'] = $login;
                        $_SESSION['user']['password'] = $password;
                        $_SESSION['credentials'] = $credentials[0];
                        $_SESSION['msg']['std'][] = "Успешный вход";
                        $output = true;
                    }
                }
            }
        }
        return $output;
    }



    /* Выход */
    public function logOut(): bool {
        unset($_SESSION['user']);
        unset($_SESSION['credentials']);
        $_SESSION['msg']['std'][] = "Вы вышли из аккаунта";
        return true;
    }



    /* Регистрация */
    public function register(array $credentials, string $password, string $password_confirm, bool $consent): string | bool {
        global $database;

        $output = false;

        /* Проверки: */
        /*     1. Получены ли данные из формы */
        /*     2. Нет ли пользователя в БД */
        /*     3. Получено ли согласие на обработку ПДн */
        /*     4. Совпадают ли переданные пароли */
        /*     5. Получилось ли внести данные в БД */
        /* При успехе:  */
        if (empty($credentials) || empty($password) || empty($password_confirm) || empty($consent)) {
            $output = "Данные для регистрации не были переданы";
        } else {
            if ($database->returnQuery(
                LOGIN_QUERY,
                "bool",
                [ 'login' => $credentials['login'] ]
            )) {
                $output = "Пользователь с таким логином уже существует";
            } else {
                if (!$consent) {
                    $output = "Не передано согласие на обработку персональных данных";
                } else {
                    if ($password !== $password_confirm) {
                        $output = "Пароли не совпадают";
                    } else {
                        $password_hash = password_hash($password, PASSWORD_DEFAULT);
                        $result = $database->returnQuery(
                            REGISTER_QUERY,
                            "bool",
                            [
                                'email' => $credentials['email'],
                                'login' => $credentials['login'],
                                'password' => $password_hash,
                                'first_name' => $credentials['first_name'],
                                'last_name' => $credentials['last_name']
                            ]
                        );

                        if ($result === true) {
                            // $_SESSION['msg']['std'][] = "Успешная регистрация! Теперь Вы можете войти";
                            $output = true;
                        } else {
                            $output = "Неизвестная ошибка";
                        }
                    }
                }
            }
        }
        return $output;
    }
}
?>
