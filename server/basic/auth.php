<?php
namespace Server;

/* Константы с запросами */
define("PASSWORD_QUERY", "select `password` from `users` where `userID` = :userID");
define("USER_ID_QUERY", "select `userID` from `users` where `login` = :login");
define("PERMISSION_QUERY", "select `permissionID` from `users` where `login` = :login");
define("LOGIN_QUERY", "select `login` from `users` where `login` = :login");
define("GET_CREDENTIALS_QUERY", "select `firstName`, `lastName`, `login`, `email` from `users` where `login` = :login");
define("REGISTER_QUERY", "insert into `users` (`email`, `login`, `password`, `firstName`, `lastName`, `permissionID`) values (:email, :login, :password, :firstName, :lastName, 1)");

/* Класс авторизации */
class Auth {
    /* Поля класса */
    private bool $is_logged_in = false;
    private array $credentials = [
        'name' => "",
        'login' => "",
        'email' => ""
    ];




    /* Создание класса */
    public function __construct(bool $try_auto_login) {
        if ($try_auto_login) {
            $this->autoLogin();
        }
    }



    /* Подтверждение пароля */
    private function verifyPassword(string $password, int $userID, bool $raw_password = false): bool {
        global $database;

        if ($raw_password) {
            return password_verify(
                $password,
                $database->returnQuery(
                    PASSWORD_QUERY,
                    "single",
                    [ 'userID' => $userID ]
                )
            );
        } else {
            return $database->returnQuery(
                PASSWORD_QUERY,
                "single",
                [ 'userID' => $userID ]
            ) === $password;
        }
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
    public function getPermissionLevel(): int {
        global $database;
        return $database->returnQuery(
            PERMISSION_QUERY,
            "single",
            [ 'login' => $this->credentials['login'] ]
        );
    }



    /* Получение имени пользователя */
    public function getName(): string {
        return $this->credentials['firstName'];
    }



    /* Получение данных пользователя */
    public function getCredentials(): array {
        return [
            'firstName' => $this->credentials['firstName'],
            'lastName' => $this->credentials['lastName'],
            'email' => $this->credentials['email'],
            'permissionID' => $this->getPermissionLevel(),
        ];
    }



    /* Получение статуса входа пользователя */
    public function getLogInStatus(): bool {
        return $this->is_logged_in;
    }



    /* Автоматиеский вход */
    public function autoLogin(): bool {
        $output = false;

        /* Проверки: */
        /*     1. Есть ли пользователь в БД */
        /*     2. Верен ли пароль */
        /*     3. Удалось ли получить данные */
        /* При успехе: внесение данных пользователя в поля класса */
        if (isset($_SESSION['user']['login']) && isset($_SESSION['user']['hash'])) {
            global $database;
            if ($database->returnQuery(
                LOGIN_QUERY,
                "bool",
                [ 'login' => $_SESSION['user']['login'] ]
            )) {
                if ($this->verifyPassword(
                    $_SESSION['user']['hash'],
                    $this->getUserID($_SESSION['user']['login'])
                )) {
                    if ($this->credentials = $database->returnQuery(
                        GET_CREDENTIALS_QUERY,
                        "assoc",
                        [ 'login' => $_SESSION['user']['login'] ]
                    )[0]) {
                        $this->is_logged_in = true;
                        $_SESSION['msg']['dbg'][] = "Автоматический вход: успешно";
                        $output = true;
                    } else {
                        $_SESSION['msg']['dbg'][] = "Автоматический вход: неизвестная ошибка";
                    }
                } else {
                    $_SESSION['msg']['dbg'][] = "Автоматический вход: неверный пароль";
                }
            } else {
                $_SESSION['msg']['dbg'][] = "Автоматический вход: пользователя не существует";
            }
        } else {
            $_SESSION['msg']['dbg'][] = "Автоматический вход: нет данных для входа";
        }
        return $output;
    }



    /* Вход */
    public function login(string $login, string $password): bool {
        global $database;
        $userID = $this->getUserID($login);
        $output = false;

        /* Проверки: */
        /*     1. Получены ли данные из формы */
        /*     2. Есть ли пользователь в БД */
        /*     3. Верен ли пароль */
        /*     4. Удалось ли получить данные из БД */
        /* При успехе: внесение данных для автоматического входа в сессию */
        if (!empty($password) && !empty($login)) {
            if ($userID) {
                if ($this->verifyPassword($password, $userID, true)) {
                    $_SESSION['user']['login'] = $login;
                    $_SESSION['user']['hash'] = $database->returnQuery(
                        PASSWORD_QUERY,
                        "single",
                        [ 'userID' => $userID ]
                    );

                    if ($raw = $database->returnQuery(
                        GET_CREDENTIALS_QUERY,
                        "assoc",
                        [ 'login' => $_SESSION['user']['login'] ]
                    )) {
                        $this->credentials = [
                            'firstName' => $raw[0]['firstName'],
                            'login' => $raw[0]['login'],
                            'email' => $raw[0]['email']
                        ];
                        $_SESSION['msg']['std'][] = "Успешный вход";
                        $output = true;
                    } else {
                        $_SESSION['msg']['error'][] = "Неизвестная ошибка";
                    }
                } else {
                    $_SESSION['msg']['error'][] = "Неверный пароль";
                }
            } else {
                $_SESSION['msg']['error'][] = "Пользователя с таким логином не существует";
            }
        } else {
            $_SESSION['msg']['error'][] = "Данные для входа не были переданы";
        }
        return $output;
    }



    /* Выход */
    public function logout(): bool {
        unset($_SESSION['user']);
        $_SESSION['msg']['std'][] = "Вы вышли из аккаунта";
        return true;
    }



    /* Регистрация */
    public function register(array $credentials, string $password, string $password_confirm, string $consent): bool {
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
            $_SESSION['msg']['error'][] = "Данные для регистрации не были переданы";
        } else {
            if ($database->returnQuery(
                LOGIN_QUERY,
                "bool",
                [ 'login' => $credentials['login'] ]
            )) {
                $_SESSION['msg']['error'][] = "Пользователь с таким логином уже существует";
            } else {
                if (!$consent) {
                    $_SESSION['msg']['error'][] = "Не передано согласие на обработку персональных данных";
                } else {
                    if ($password !== $password_confirm) {
                        $_SESSION['msg']['error'][] = "Пароли не совпадают";
                    } else {
                        $password_hash = password_hash($password, PASSWORD_DEFAULT);

                        if (!$database->returnQuery(
                            REGISTER_QUERY,
                            "bool",
                            [
                                'email' => $credentials['email'],
                                'login' => $credentials['login'],
                                'password' => $password_hash,
                                'firstName' => $credentials['firstName'],
                                'lastName' => $credentials['lastName']
                            ]
                        )) {
                            $_SESSION['msg']['error'][] = "Неизвестная ошибка";
                        } else {
                            $_SESSION['msg']['std'][] = "Успешная регистрация! Теперь Вы можете войти";
                            $output = true;
                        }
                    }
                }
            }
        }
        return $output;
    }
}
?>
