#include "tool.h"

#include <cerrno>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>

namespace {

bool parse_count(const char *text, std::uint32_t *count) {
    if (*text < '0' || *text > '9') {
        return false;
    }
    char *end = nullptr;
    errno = 0;
    const unsigned long long value = std::strtoull(text, &end, 10);
    if (errno != 0 || *end != '\0' || value > UINT32_MAX) {
        return false;
    }
    *count = static_cast<std::uint32_t>(value);
    return true;
}

int usage() {
    std::fputs("usage: case094 <command> <value>\n", stderr);
    return 2;
}

int status(bool ok) {
    return ok ? 0 : 1;
}

}  // namespace

int main(int argc, char **argv) {
    if (argc != 3) {
        return usage();
    }
    const std::string command = argv[1];
    const char *value = argv[2];

    if (command == "title") {
        store_title(value);
        return 0;
    }
    if (command == "caption") {
        return status(store_caption(value));
    }
    if (command == "retire") {
        return status(retire_note(new Note{1, value}) >= 0);
    }
    if (command == "archive") {
        return status(archive_note(new Note{2, value}) >= 0);
    }
    if (command == "weight") {
        return status(entry_weight(value) >= 0);
    }
    if (command == "rank") {
        return status(entry_rank(value) >= 0);
    }
    if (command == "batch" || command == "blocks") {
        std::uint32_t count = 0;
        if (!parse_count(value, &count)) {
            return usage();
        }
        return status(command == "batch" ? fill_batch(count) : fill_blocks(count));
    }
    if (command == "line") {
        show_line(value);
        return 0;
    }
    if (command == "banner") {
        show_banner(value, std::strlen(value) < 20);
        return 0;
    }
    if (command == "label") {
        return status(echo_label(value) == 0);
    }
    if (command == "name") {
        return status(echo_name(value) == 0);
    }
    if (command == "token") {
        return status(accept_token(value));
    }
    if (command == "key") {
        return status(accept_key(value));
    }
    return usage();
}
