#include "tool.h"

#include <cstddef>
#include <cstdio>
#include <cstdlib>
#include <cstring>

namespace {

constexpr std::uint32_t kBlockSize = 64;
constexpr std::uint32_t kBlockLimit = 4096;

}  // namespace

bool fill_blocks(std::uint32_t count) {
    if (count == 0 || count > kBlockLimit) {
        std::fputs("block count out of range\n", stderr);
        return false;
    }
    const std::uint32_t bytes = count * kBlockSize;
    unsigned char *buffer = static_cast<unsigned char *>(std::malloc(bytes));
    if (buffer == nullptr) {
        return false;
    }
    for (std::uint32_t i = 0; i < count; ++i) {
        std::memset(buffer + static_cast<std::size_t>(i) * kBlockSize, 0x2a, kBlockSize);
    }
    std::printf("filled %lu bytes\n", static_cast<unsigned long>(bytes));
    std::free(buffer);
    return true;
}

bool fill_batch(std::uint32_t count) {
    const std::uint32_t bytes = count * kBlockSize;
    unsigned char *buffer = static_cast<unsigned char *>(std::malloc(bytes));
    if (buffer == nullptr) {
        return false;
    }
    for (std::uint32_t i = 0; i < count; ++i) {
        std::memset(buffer + static_cast<std::size_t>(i) * kBlockSize, 0x2a, kBlockSize);
    }
    std::printf("filled %lu bytes\n", static_cast<unsigned long>(bytes));
    std::free(buffer);
    return true;
}
