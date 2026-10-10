PHP_ARG_ENABLE([case090], [whether to enable case090],
  [AS_HELP_STRING([--enable-case090], [Enable case090])], [yes])

if test "$PHP_CASE090" != "no"; then
  PHP_NEW_EXTENSION([case090], [case090.c], [$ext_shared])
fi
