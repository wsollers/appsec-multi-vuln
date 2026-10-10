<?php
declare(strict_types=1);

$directory = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.build';
if (!is_dir($directory) && !mkdir($directory, 0777, true) && !is_dir($directory)) {
    throw new RuntimeException('Unable to create local build directory');
}
file_put_contents($directory . DIRECTORY_SEPARATOR . 'composer.marker', "case-089\n");
