#include "api.h"

#include <cstring>

#ifndef WORKSPACE_MODE
#define WORKSPACE_MODE 0
#endif

namespace workspace {
int operation_24(const char* value) {
    char data[12]{};
#if WORKSPACE_MODE
    std::strncpy(data, value, sizeof(data) - 1);
#else
    std::strcpy(data, value);
#endif
    return data[0];
}
}
