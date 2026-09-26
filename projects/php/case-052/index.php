<?php
$target = $_GET["next"] ?? "/";
header("Location: " . $target, true, 302);
echo "case-052\n";
