#include "api.h"

#include <cstdlib>

namespace workspace {
int operation_01(std::size_t value) {
    char data[8]{};
    data[value] = 'x';
    return data[0];
}

int operation_02(std::size_t value) {
    auto* data = static_cast<char*>(std::malloc(8));
    data[value] = 'y';
    int result = data[0];
    std::free(data);
    return result;
}

int operation_03(std::size_t value) {
    auto* data = static_cast<char*>(std::malloc(8));
    int result = data[value];
    std::free(data);
    return result;
}
}
