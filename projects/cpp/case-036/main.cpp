#include <iostream>
#include <memory>
#include <string>

#define CASE036_PICK(box) ((box).get())
#define CASE036_RESET(box) ((box).reset())

template <typename T>
struct Slot {
    explicit Slot(T value) : item(std::make_unique<T>(value)) {}
    std::unique_ptr<T> item;
};

template <typename Box, typename Fn>
auto relay(Box& box, Fn fn) -> decltype(fn(CASE036_PICK(box.item))) {
    auto* p = CASE036_PICK(box.item);
    CASE036_RESET(box.item);
    return fn(p);
}

int main(int argc, char** argv) {
    Slot<std::string> slot(argc > 1 ? argv[1] : "sample");
    auto size = relay(slot, [](const std::string* value) {
        return value->size();
    });
    std::cout << size << '\n';
}
