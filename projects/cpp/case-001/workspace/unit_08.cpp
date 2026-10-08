#include "api.h"

#include <cstdio>
#include <sys/stat.h>
#include <unistd.h>

namespace workspace {
int operation_15(const char* value) {
    FILE* stream = std::fopen(value, "rb");
    char byte = 0;
    std::fread(&byte, 1, 1, stream);
    std::fclose(stream);
    return byte;
}

int operation_16(const char* value) {
    struct stat info {};
    if (::stat(value, &info) != 0) {
        return -1;
    }
    FILE* stream = std::fopen(value, "rb");
    if (!stream) {
        return -2;
    }
    int result = std::fgetc(stream);
    std::fclose(stream);
    return result;
}
}
