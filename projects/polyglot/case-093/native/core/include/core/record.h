#ifndef C093_CORE_RECORD_H
#define C093_CORE_RECORD_H

#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

#define CORE_NAME_MAX 32
#define CORE_BODY_MAX 64
#define CORE_DESC_MAX 48

/* A record is framed as "name;kind;length;body". */
typedef struct core_record {
    char name[CORE_NAME_MAX];
    unsigned char body[CORE_BODY_MAX];
    int kind;
    int len;
} core_record;

typedef struct core_table {
    int count;
    int width;
    unsigned char *cells;
} core_table;

/* Copies up to n bytes of src into dst and terminates dst.
   cap is the capacity of dst in bytes. Returns the number of bytes copied. */
size_t core_copy_name(char *dst, size_t cap, const char *src, size_t n);

/* Parses size bytes at data into out. Returns 0 on success. */
int core_parse(const unsigned char *data, size_t size, core_record *out);

/* Returns a heap string describing rec; release it with core_free.
   When out_len is not NULL it receives the formatted length. */
char *core_describe(const core_record *rec, size_t *out_len);

void core_free(void *ptr);

/* Allocates count rows of width bytes each. */
core_table *core_table_new(int count, int width);

/* Copies up to width bytes of data into the given row. Returns 0 on success. */
int core_table_put(core_table *table, int row, const unsigned char *data, size_t n);

void core_table_free(core_table *table);

#ifdef __cplusplus
}
#endif

#endif
