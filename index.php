<?php
ini_set('session.gc_maxlifetime', 86400);

session_start();

$global_flags = [
    'debug' => false,
    'show-messages' => true,
];

$env = parse_ini_file('.env');

require "server/basic/conn.php";
require "server/basic/auth.php";
require "server/basic/constructor.php";
require "server/basic/messages.php";

$constructor = new Server\Constructor(
    website_name: "Диплом",
    templates_folder: "templates",
    media_folder: "/media",
);

$database = new Server\Database();
$auth = new Server\Auth();
$message_handler = new Server\Messages();

require "server/router.php";
?>
