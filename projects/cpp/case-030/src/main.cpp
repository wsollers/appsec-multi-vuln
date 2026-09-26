#include <iostream>
#include <string>
#include <vector>

#include "zlib.h"

int main(int argc, char** argv) {
    std::string input = argc > 1 ? argv[1] : "sample";
    uLongf out_len = compressBound(static_cast<uLong>(input.size()));
    std::vector<Bytef> output(out_len);
    int code = compress(output.data(), &out_len,
                        reinterpret_cast<const Bytef*>(input.data()),
                        static_cast<uLong>(input.size()));
    std::cout << zlibVersion() << ':' << code << ':' << out_len << '\n';
}
