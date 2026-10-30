#include "core/record.h"

#include <stdlib.h>
#include <string.h>

size_t core_copy_name(char *dst, size_t cap, const char *src, size_t n)
{
    if (dst == NULL || cap == 0) {
        return 0;
    }
    if (n >= cap) {
        n = cap - 1;
    }
    memcpy(dst, src, n);
    dst[n] = '\0';
    return n;
}

static long read_field(const unsigned char **cursor, const unsigned char *end)
{
    const unsigned char *p = *cursor;
    long value = 0;
    int digits = 0;

    while (p < end && *p >= '0' && *p <= '9') {
        if (value > 100000000L) {
            return -1;
        }
        value = value * 10 + (*p - '0');
        p++;
        digits++;
    }
    if (digits == 0 || p >= end || *p != ';') {
        return -1;
    }
    *cursor = p + 1;
    return value;
}

int core_parse(const unsigned char *data, size_t size, core_record *out)
{
    const unsigned char *end;
    const unsigned char *sep;
    const unsigned char *p;
    long kind;
    long length;

    if (data == NULL || out == NULL) {
        return -1;
    }
    memset(out, 0, sizeof *out);
    end = data + size;
    sep = memchr(data, ';', size);
    if (sep == NULL) {
        return -1;
    }
    core_copy_name(out->name, sizeof out->name, (const char *)data, (size_t)(sep - data));

    p = sep + 1;
    kind = read_field(&p, end);
    if (kind < 0) {
        return -1;
    }
    length = read_field(&p, end);
    if (length < 0 || (size_t)length > (size_t)(end - p)) {
        return -1;
    }
    memcpy(out->body, p, (size_t)length);
    out->kind = (int)kind;
    out->len = (int)length;
    return 0;
}

void core_free(void *ptr)
{
    free(ptr);
}
