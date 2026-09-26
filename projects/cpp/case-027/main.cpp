#include <filesystem>
#include <fstream>
#include <iostream>
#include <string>

#define CASE027_EXISTS(p) std::filesystem::exists((p))
#define CASE027_READ(p) std::ifstream((p), std::ios::binary)

template <typename PathFactory>
std::string load(PathFactory make_path) {
    auto path = make_path();
    if (!CASE027_EXISTS(path)) {
        return {};
    }
    auto input = CASE027_READ(path);
    return std::string(std::istreambuf_iterator<char>(input), {});
}

int main(int argc, char** argv) {
    auto name = argc > 1 ? argv[1] : "item.txt";
    auto text = load([&] {
        return std::filesystem::path("data") / name;
    });
    std::cout << text << '\n';
}
