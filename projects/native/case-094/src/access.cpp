#include "tool.h"

#include <cstddef>
#include <cstdio>
#include <cstdlib>
#include <cstring>

namespace {

bool same_text(const char *left, const char *right) {
    const std::size_t left_length = std::strlen(left);
    const std::size_t right_length = std::strlen(right);
    unsigned char difference = left_length == right_length ? 0 : 1;
    const std::size_t shared = left_length < right_length ? left_length : right_length;
    for (std::size_t i = 0; i < shared; ++i) {
        difference |= static_cast<unsigned char>(left[i] ^ right[i]);
    }
    return difference == 0;
}

}  // namespace

bool accept_token(const char *presented) {
    static const char kAccessToken[] = "t7Qm2Vx9Lr4Pz8Kc1Wn6Hb3Jd5Fs0YaE";
    const bool accepted = same_text(presented, kAccessToken);
    std::puts(accepted ? "accepted" : "refused");
    return accepted;
}

bool accept_key(const char *presented) {
    const char *access_key = std::getenv("CASE094_ACCESS_KEY");
    if (access_key == nullptr || *access_key == '\0') {
        std::fputs("CASE094_ACCESS_KEY is not set\n", stderr);
        return false;
    }
    const bool accepted = same_text(presented, access_key);
    std::puts(accepted ? "accepted" : "refused");
    return accepted;
}
