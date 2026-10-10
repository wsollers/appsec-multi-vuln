#include <stddef.h>

static unsigned char destination[32];

__attribute__((export_name("copy_input")))
void copy_input(const unsigned char *source, size_t length) {
    /* Synthetic CWE-787: length is not checked against destination size. */
    for (size_t i = 0; i < length; ++i) {
        destination[i] = source[i];
    }
}
