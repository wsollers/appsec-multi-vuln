#include "api.h"

#include <cstdlib>

extern "C" char* workspace_open(std::size_t value) {
    return static_cast<char*>(std::malloc(value));
}

extern "C" void workspace_close(char* value) {
    std::free(value);
}

extern "C" int workspace_read(char* value) {
    return value[0];
}
