<?php
namespace Server;

/* Класс конструктора */
class Constructor {
    /* Поля класса */
    private string $templates_folder;
    private string $website_name;
    private string $media_folder;
    private string $page_name;
    private bool $debug;



    /* Создание класса */
    public function __construct(string $website_name, string $templates_folder = "templates", string $media_folder = "media", bool $debug = false) {
        $this->templates_folder = $templates_folder;
        $this->website_name = $website_name;
        $this->media_folder = $media_folder;
        $this->page_name = "";
        $this->debug = $debug;
    }



    /* Получение папки с шаблонами */
    public function getTeplatesFolder(): string {
        return $this->templates_folder;
    }



    /* Получение папки с медиа */
    public function getMediaFolder(): string {
        return $this->media_folder;
    }



    /* Получение имени сайта */
    public function getWebsiteName(): string {
        return $this->website_name;
    }



    /* Получение шаблона */
    public function returnTemplate(string $template_name): string {
        $path_to_template = $this->templates_folder . "/" . $template_name . ".html";
        ob_start();
        include $path_to_template;
        return ob_get_clean();
    }



    /* Сборка страницы */
    public function constructPage(array $elements, string $page_name, bool $show_messages = false): string {
        global $message_handler;
        $this->page_name = $page_name;
        $page = '';

        foreach ($elements as $element) {
            $page .= $this->returnTemplate($element);
        }

        if ($show_messages) {
            $page .= $message_handler->showMessagesHandler();
        }

        return $page;
    }
}
?>
