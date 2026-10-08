#include "api.h"

int main(int argc, char** argv) {
    auto value = workspace::operation_17(argc, argv);
    int result = workspace::operation_20(value, true);
    result += workspace::operation_24(value.c_str());
    result += workspace::operation_25(argc > 1 ? 1 : 0);
    return result;
}
