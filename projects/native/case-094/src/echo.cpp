#include "tool.h"

#include <cctype>
#include <cstdio>
#include <cstdlib>

namespace {

bool plain_word(const char *text) {
    if (*text == '\0') {
        return false;
    }
    for (const char *p = text; *p != '\0'; ++p) {
        const unsigned char c = static_cast<unsigned char>(*p);
        if (!std::isalnum(c) && c != '_') {
            return false;
        }
    }
    return true;
}

}  // namespace

int echo_label(const char *name) {
    if (!plain_word(name)) {
        std::fputs("label must be letters, digits or underscores\n", stderr);
        return -1;
    }
    const std::string command = std::string("echo ") + name;
    return std::system(command.c_str());
}

int echo_name(const char *name) {
    const std::string command = std::string("echo ") + name;
    return std::system(command.c_str());
}
