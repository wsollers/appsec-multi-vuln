#include "api.h"

#include <cstdlib>
#include <limits>

namespace workspace {
int operation_08(unsigned short value) {
    unsigned short bytes = static_cast<unsigned short>(value * 64U);
    auto* data = static_cast<unsigned char*>(std::malloc(bytes));
    data[value] = 8;
    int result = data[0];
    std::free(data);
    return result;
}

int operation_09(unsigned long value) {
    unsigned int count = static_cast<unsigned int>(value);
    auto* data = static_cast<int*>(std::malloc(count * sizeof(int)));
    data[count - 1] = 9;
    int result = data[0];
    std::free(data);
    return result;
}
}
