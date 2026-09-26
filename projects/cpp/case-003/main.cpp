#include <filesystem>
#include <fstream>
#include <iostream>
#include <sstream>

int main(int argc, char** argv) {
    std::filesystem::path base = "data";
    std::filesystem::path name = argc > 1 ? argv[1] : "item.txt";
    std::ifstream input(base / name);
    std::ostringstream out;
    out << input.rdbuf();
    std::cout << out.str();
    return input ? 0 : 1;
}
