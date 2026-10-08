#include "api.h"
#include "box.h"

namespace workspace {
int operation_26(int value) {
    Box<8> box;
    return box.select(static_cast<std::size_t>(value), value);
}
}
