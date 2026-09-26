#include <cstdint>
#include <cstdlib>
#include <iostream>
#include <vector>

#define CASE029_SCALE(x) ((x) * 4096)
#define CASE029_AT(v, i) ((v)[(i)])

template <typename T>
std::vector<T> fill(std::int32_t count) {
    auto bytes = CASE029_SCALE(count);
    std::vector<T> items(static_cast<std::size_t>(bytes / sizeof(T)));
    CASE029_AT(items, static_cast<std::size_t>(count)) = T{};
    return items;
}

int main(int argc, char** argv) {
    std::int32_t count = argc > 1 ? std::atoi(argv[1]) : 2;
    auto values = fill<unsigned char>(count);
    std::cout << values.size() << '\n';
}
