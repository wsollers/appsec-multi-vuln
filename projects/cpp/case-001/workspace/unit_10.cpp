#include "api.h"

#include <cstdlib>

namespace workspace {
int operation_20(const std::string& value, bool mode) {
    bool accepted = mode ? operation_18(value) : operation_19(value);
    if (!accepted) {
        return -1;
    }
    return std::system(value.c_str());
}
}
