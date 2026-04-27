<?php
ini_set('session.gc_maxlifetime', 86400);

session_start();

$global_flags = [
    'debug' => false,
    'try-auto-login' => true,
    'show-messages' => true,
];

require "server/basic/conn.php";
require "server/basic/auth.php";
require "server/basic/constructor.php";
require "server/basic/messages.php";

$constructor = new Server\Constructor(
    website_name: "EasyHost",
    templates_folder: "templates",
    media_folder: "/media",
    debug: $global_flags['debug'],
);

$database = new Server\Database();

$auth = new Server\Auth(
    try_auto_login: $global_flags['try-auto-login']
);

$message_handler = new Server\Messages();

require "server/router.php";
?>
