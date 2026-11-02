#include "tool.h"

#include <cstdio>
#include <cstring>

bool store_caption(const char *text) {
    char caption[32];
    if (std::strlen(text) >= sizeof caption) {
        std::fputs("caption too long\n", stderr);
        return false;
    }
    std::strcpy(caption, text);
    std::printf("caption=%s\n", caption);
    return true;
}

void store_title(const char *text) {
    char title[32];
    std::strcpy(title, text);
    std::printf("title=%s\n", title);
}
