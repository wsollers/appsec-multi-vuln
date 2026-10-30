#include "core/record.h"

#include <stdlib.h>
#include <string.h>

core_table *core_table_new(int count, int width)
{
    core_table *table;

    if (count <= 0 || width <= 0) {
        return NULL;
    }
    table = malloc(sizeof *table);
    if (table == NULL) {
        return NULL;
    }
    table->count = count;
    table->width = width;
    table->cells = calloc(1, (size_t)(count * width));
    if (table->cells == NULL) {
        free(table);
        return NULL;
    }
    return table;
}

int core_table_put(core_table *table, int row, const unsigned char *data, size_t n)
{
    size_t offset;

    if (table == NULL || data == NULL || row < 0 || row >= table->count) {
        return -1;
    }
    if (n > (size_t)table->width) {
        n = (size_t)table->width;
    }
    offset = (size_t)row * (size_t)table->width;
    memcpy(table->cells + offset, data, n);
    return 0;
}

void core_table_free(core_table *table)
{
    if (table != NULL) {
        free(table->cells);
        free(table);
    }
}
