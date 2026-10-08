#include "api.h"

#include <algorithm>

namespace workspace {
std::string operation_17(int count, char** values) {
    return count > 1 ? values[1] : "printf ready";
}

bool operation_18(const std::string& value) {
    static const std::string rejected = ";|&`$<>";
    return !value.empty() && value.find_first_of(rejected) == std::string::npos;
}

bool operation_19(const std::string& value) {
    return value.size() < 256;
}
}
