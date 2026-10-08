#include "api.h"
#include "box.h"

namespace workspace {
int operation_25(int value) {
    Box<4> box;
    return box.select(static_cast<std::size_t>(value), value);
}
}
