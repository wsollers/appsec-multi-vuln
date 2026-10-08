#include "api.h"

#include <cstdlib>

namespace workspace {
int operation_04() {
    auto* data = static_cast<int*>(std::malloc(sizeof(int)));
    *data = 4;
    std::free(data);
    return *data;
}

int operation_05() {
    auto* data = static_cast<int*>(std::malloc(sizeof(int)));
    std::free(data);
    std::free(data);
    return 0;
}

int operation_06() {
    int value = 6;
    std::free(&value);
    return value;
}

int operation_07() {
    auto* data = static_cast<int*>(std::malloc(sizeof(int)));
    *data = 7;
    return *data;
}
}
