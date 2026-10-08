#include "api.h"

namespace workspace {
namespace {
class Base {
public:
    virtual ~Base() = default;
    virtual int apply(int value) = 0;
};

class Indexer final : public Base {
public:
    int apply(int value) override {
        int entries[4]{};
        entries[value] = value;
        return entries[0];
    }
};

int indirect(int value) {
    int entries[4]{};
    return entries[value];
}
}

int operation_23(int value) {
    Indexer indexer;
    Base* selected = &indexer;
    int (*callback)(int) = indirect;
    return selected->apply(value) + callback(value);
}
}
