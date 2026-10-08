#include "api.h"

#include <fstream>

namespace workspace {
int operation_12(const std::string& value) {
    std::ifstream stream("data/" + value);
    return stream.get();
}
}
