#ifdef HAVE_CONFIG_H
#include "config.h"
#endif
#include "php.h"
#include <string.h>

PHP_FUNCTION(case090_copy_label) {
    char *input;
    size_t input_len;
    char label[32];
    ZEND_PARSE_PARAMETERS_START(1, 1)
        Z_PARAM_STRING(input, input_len)
    ZEND_PARSE_PARAMETERS_END();
    (void)input_len;
    /* Synthetic CWE-120: intentionally unbounded copy for SAST. */
    strcpy(label, input);
    RETURN_STRING(label);
}

static const zend_function_entry case090_functions[] = {
    PHP_FE(case090_copy_label, NULL)
    PHP_FE_END
};

zend_module_entry case090_module_entry = {
    STANDARD_MODULE_HEADER, "case090", case090_functions, NULL, NULL, NULL,
    NULL, NULL, "1.0.0", STANDARD_MODULE_PROPERTIES
};

ZEND_GET_MODULE(case090)
