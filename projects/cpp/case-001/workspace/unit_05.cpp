#include "api.h"

#include <cstdlib>

namespace workspace {
int operation_11(const std::string& value) {
    return std::system(value.c_str());
}
}
