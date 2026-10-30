#ifndef C093_CODEC_CODEC_H
#define C093_CODEC_CODEC_H

#ifdef __cplusplus
extern "C" {
#endif

/* Returns a printable label for a record kind. */
const char *codec_label(int kind);

/* Returns 1 when kind names a built-in encoding. */
int codec_known(int kind);

#ifdef __cplusplus
}
#endif

#endif
