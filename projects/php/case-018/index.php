<?php
$name = $argv[1] ?? ($_GET["page"] ?? "home");
include __DIR__ . "/pages/" . $name . ".php";
