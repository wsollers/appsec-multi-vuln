<?php
class Box {
    public $name = "sample";
}

$value = $argv[1] ?? ($_POST["v"] ?? 'O:3:"Box":1:{s:4:"name";s:6:"sample";}');
$item = unserialize($value);
echo $item->name ?? "sample";
