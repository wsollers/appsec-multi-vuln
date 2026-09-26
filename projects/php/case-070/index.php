<?php
$pattern = "/^(a+)+$/";
$value = $argv[1] ?? ($_GET["v"] ?? "aaaaaaaaaaaaaaaa");
echo preg_match($pattern, $value) ? "yes" : "no";
