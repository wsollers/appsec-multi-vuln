#include <filesystem>
#include <fstream>
#include <iostream>
#include <string>

int main(int argc, char** argv) {
    auto name = argc > 1 ? argv[1] : "../out.txt";
    std::filesystem::path root = "out";
    std::filesystem::create_directories(root);
    std::ofstream file(root / name);
    file << "sample\n";
    std::cout << (root / name).string() << '\n';
}
