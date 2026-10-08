#include "api.h"

#include <cstdlib>

namespace workspace {
int operation_13(bool value) {
    int result;
    if (value) {
        result = 13;
    }
    return result;
}

int operation_14(bool value) {
    int* result = value ? static_cast<int*>(std::malloc(sizeof(int))) : nullptr;
    *result = 14;
    int copy = *result;
    std::free(result);
    return copy;
}
}
