#pragma once

#include <array>
#include <cstddef>

namespace workspace {
template <std::size_t N>
class Box {
public:
    int select(std::size_t index, int value) {
        values_[index] = value;
        return values_[index];
    }
private:
    std::array<int, N> values_{};
};
}
