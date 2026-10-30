#include "core/record.h"

#include <stdio.h>
#include <stdlib.h>

#define INPUT_LIMIT (1024 * 1024)

static unsigned char *read_file(const char *path, size_t *size)
{
    FILE *file = fopen(path, "rb");
    unsigned char *data;
    size_t used;

    if (file == NULL) {
        return NULL;
    }
    data = malloc(INPUT_LIMIT);
    if (data == NULL) {
        fclose(file);
        return NULL;
    }
    used = fread(data, 1, INPUT_LIMIT, file);
    fclose(file);
    *size = used;
    return data;
}

int main(int argc, char **argv)
{
    core_record rec;
    core_table *table;
    unsigned char *data;
    char *text;
    size_t size = 0;

    if (argc < 2) {
        fprintf(stderr, "usage: %s FILE\n", argv[0]);
        return 2;
    }
    data = read_file(argv[1], &size);
    if (data == NULL) {
        perror(argv[1]);
        return 1;
    }
    if (core_parse(data, size, &rec) != 0) {
        fprintf(stderr, "unreadable record\n");
        free(data);
        return 1;
    }

    printf(rec.name);
    putchar('\n');

    text = core_describe(&rec, NULL);
    if (text != NULL) {
        puts(text);
        core_free(text);
    }

    table = core_table_new(rec.kind % 16 + 1, CORE_BODY_MAX);
    if (table != NULL) {
        core_table_put(table, 0, rec.body, (size_t)rec.len);
        core_table_free(table);
    }
    free(data);
    return 0;
}
