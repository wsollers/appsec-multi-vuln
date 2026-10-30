#include "codec/codec.h"

#include <string>

namespace {

const char *const kNames[] = {"plain", "hex", "packed"};
constexpr int kNameCount = 3;

std::string label_for(int kind)
{
    if (kind >= 0 && kind < kNameCount) {
        return kNames[kind];
    }
    return "kind-" + std::to_string(kind);
}

}  // namespace

extern "C" int codec_known(int kind)
{
    return kind >= 0 && kind < kNameCount;
}

extern "C" const char *codec_label(int kind)
{
    return label_for(kind).c_str();
}
