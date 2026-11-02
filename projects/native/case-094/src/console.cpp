#include "tool.h"

#include <cstdio>

void show_line(const char *text) {
    std::printf(text);
    std::putchar('\n');
}

void show_banner(const char *text, bool wide) {
    static const char *const kLayouts[] = {"%s\n", "== %s ==\n"};
    const char *layout = kLayouts[wide ? 1 : 0];
    std::printf(layout, text);
}
