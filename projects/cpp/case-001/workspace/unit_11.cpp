#include "api.h"

#include <cstdlib>

namespace workspace {
char* operation_21(std::size_t value) {
    return static_cast<char*>(std::malloc(value));
}

int operation_22(char* value) {
    std::free(value);
    return value[0];
}
}
