#include "core/record.h"
#include "codec/codec.h"

#include <stdio.h>
#include <stdlib.h>

char *core_describe(const core_record *rec, size_t *out_len)
{
    char *text;
    int written;

    if (rec == NULL) {
        return NULL;
    }
    text = malloc(CORE_DESC_MAX);
    if (text == NULL) {
        return NULL;
    }
    written = snprintf(text, CORE_DESC_MAX, "%s/%s/%d", rec->name, codec_label(rec->kind), rec->len);
    if (written < 0) {
        free(text);
        return NULL;
    }
    if (out_len != NULL) {
        *out_len = (size_t)written;
    }
    return text;
}
