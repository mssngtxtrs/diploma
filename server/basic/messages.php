<?php
namespace Server;

/* Класс отправки сообщений */
class Messages {
    /* Поля класса */
    private array $error_messages;
    private array $messages;
    private array $debug_messages;



    /* Создание класса */
    public function __construct() {
        $this->messages = $_SESSION['msg']['std'] ?? [];
        $this->error_messages = $_SESSION['msg']['error'] ?? [];
        $this->debug_messages = $_SESSION['msg']['dbg'] ?? [];

    }



    /* Сбор сообщений из сессии */
    private function getMessages(bool $debug = false): array {
        $messages = [];

        foreach ($this->error_messages as $msg) {
            array_push($messages, [ 'message' => $msg, 'type' => "error" ]);
        }

        foreach ($this->messages as $msg) {
            array_push($messages, [ 'message' => $msg, 'type' => "std" ]);
        }

        if ($debug) {
            foreach ($this->debug_messages as $msg) {
                array_push($messages, [ 'message' => $msg, 'type' => "debug" ]);
            }
        }

        /* echo "<pre>"; */
        /* var_dump($_SESSION); */
        /* var_dump($messages); */
        /* echo "</pre>"; */

        unset($_SESSION['msg']);
        return $messages;
    }



    /* Создание контейнера в документе */
    public function showMessagesHandler() {
        global $constructor;
        $output = "<div class='messages'>";
        $output .= "</div>";
        $output .= "<script src='" . $constructor->getMediaFolder() . "/js/messages-handler.js'></script>";
        return $output;
    }



    /* Передача сообщений */
    public function returnMessages(bool $debug = false): array {
        $output = [];

        $messages = $this->getMessages($debug);

        foreach ($messages as $message) {
            $output[] = [
                'message' => $message['message'],
                'type' => $message['type']
            ];
        }

        return $output;
    }
}
?>
