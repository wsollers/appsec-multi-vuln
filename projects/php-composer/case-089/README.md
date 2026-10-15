# case-089

Composer project with a `build` lifecycle script that writes only
`.build/composer.marker`. `src/index.php` reads a serialized PHP value from its
first command-line argument and prints it.

Build: `composer install --no-interaction && composer run build`.
