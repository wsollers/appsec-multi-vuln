<?php
declare(strict_types=1);

$payload = $argv[1] ?? 's:4:"demo";';
// Synthetic CWE-502: untrusted serialized data is deserialized.
$value = unserialize($payload);
echo is_scalar($value) ? (string) $value : gettype($value);
