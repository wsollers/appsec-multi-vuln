<?php
declare(strict_types=1);

$payload = $argv[1] ?? 's:4:"demo";';
$value = unserialize($payload);
echo is_scalar($value) ? (string) $value : gettype($value);
