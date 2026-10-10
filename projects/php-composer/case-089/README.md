# case-089

Composer project with a safe `build` lifecycle script that writes only
`.build/composer.marker`. `src/index.php` intentionally deserializes command
line input (CWE-502).

Build: `composer install --no-interaction && composer run build`.
