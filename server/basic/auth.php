<?php
namespace Server;

use \PHPMailer\PHPMailer\PHPMailer;
use \PHPMailer\PHPMailer\Exception;
use \League\OAuth2\Client\Provider\Google;

/* Константы с запросами */
define("PASSWORD_QUERY", "select password from users where user_id = :user_id");
define("USER_ID_QUERY", "select user_id from users where login = :login");
define("PERMISSION_QUERY", "select level_id from users where user_id = :user_id");
define("LOGIN_QUERY", "select login from users where login = :login");
define("GET_CREDENTIALS_QUERY", <<<HERE
    select u.first_name, u.last_name, u.second_name, u.email, pl.level_name,
    ( select count(*) from requests r where r.user_id = u.user_id and (r.state_id = 1 or r.state_id = 2) ) as requests_total
    from users u
    left join permission_levels pl on u.level_id = pl.level_id
    where u.user_id = :user_id
HERE);
define("REGISTER_QUERY", "insert into users (email, login, password, first_name, last_name, second_name, level_id) values (:email, :login, :password, :first_name, :last_name, :second_name, 1)");

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
            [ 'user_id' => $user_id ]
        );
    }



    /* Получение данных пользователя */
    public function getCredentials(): array | bool {
        global $database;
        if (!empty($_SESSION['user']['login'])) {
            $user_id = $this->getUserID($_SESSION['user']['login']);
            return $database->returnQuery(
                GET_CREDENTIALS_QUERY,
                "assoc",
                [ "user_id" => $user_id ]
            )[0];
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
                        $_SESSION['msg']['std'][] = "Успешный вход";
                        $output = true;
                    }
                }
            }
        }
        return $output;
    }



    /* Выход */
    public function logOut(): string | bool {
        if (empty($_SESSION['user'])) {
            $_SESSION['msg']['error'][] = "Вы уже вышли из аккаунта";
            return "Вы уже вышли из аккаунта";
        } else {
            unset($_SESSION['user']);
            $_SESSION['msg']['std'][] = "Вы вышли из аккаунта";
            return true;
        }
    }



    public function createRecoverCode(string $email) {
        global $database, $constructor, $env;

        if (!$database->returnQuery(
            "select * from users where email = :email",
            "single",
            [ "email" => $email ]
        )) {
            return false;
        }

        $token = bin2hex(random_bytes(32));
        $token_hash = hash('sha256', $token);
        $code = (string)random_int(100000, 999999);
        $code_hash = password_hash($code, PASSWORD_DEFAULT);

        if (!mail(
            $email,
            $constructor->getWebsiteName() . ": Восстановление пароля",
            "Ссылка для восстановления пароля: 127.0.0.1:5000/recover?token=" . $token,
            [
                'From' => $env['MAIL_FROM'],
                'Reply-To' => $env['MAIL_FROM'],
                'X-Mailer' => 'PHP/' . phpversion()
            ]
        )) {
            return false;
        }

        $user_id = $database->returnQuery(
            "select user_id from users where email = :email",
            "single",
            [ "email" => $email ]
        );

        if (!$database->returnQuery(
            <<<HERE
                insert into password_resets
                (user_id, reset_token_hash, reset_expires_at)
                values (:user_id, :token_hash, NOW() + INTERVAL '15 minutes')
            HERE,
            "bool",
            [
                "user_id" => $user_id,
                "token_hash" => $token_hash
            ]
        )) {
            return false;
        }

        return $token;
    }



    public function recoverPassword(string $token, string $password, string $password_confirm) {
        global $database;

        if (empty($token) || empty($password) || empty($password_confirm)) {
            return false;
        }

        if ($password !== $password_confirm) {
            return false;
        }

        $token_hash = hash('sha256', $token);

        $reset_record = $database->returnQuery(
            "select user_id from password_resets where reset_token_hash = :token_hash and reset_expires_at > NOW()",
            "assoc",
            [ "token_hash" => $token_hash ]
        );

        if (empty($reset_record)) {
            return false;
        }

        // if (!password_verify($code, $reset_record[0]["code_hash"])) {
        //     return false;
        // }

        if (!$database->returnQuery(
            "delete from password_resets where user_id = :user_id",
            "bool",
            [ "user_id" => $reset_record[0]['user_id'] ]
        )) {
            return false;
        }

        $new_password_hash = password_hash($password, PASSWORD_DEFAULT);
        if (!$database->returnQuery(
            "update users set password = :password_hash where user_id = :user_id",
            "bool",
            [
                "password_hash" => $new_password_hash,
                "user_id" => $reset_record[0]['user_id'],
            ]
        )) {
            return false;
        }

        $_SESSION['msg']['std'][] = "Пароль успешно сменён";
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
        if (
            empty($credentials['email']) ||
            empty($credentials['login']) ||
            empty($credentials['first_name']) ||
            empty($credentials['last_name']) ||
            empty($password) ||
            empty($password_confirm) ||
            empty($consent)
        ) {
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
                                'last_name' => $credentials['last_name'],
                                'second_name' => $credentials['second_name'],
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
