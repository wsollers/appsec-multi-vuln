#include <cstring>
#include <iostream>

int main(int argc, char** argv) {
    char buffer[16];
    const char* value = argc > 1 ? argv[1] : "sample";
    std::strcpy(buffer, value);
    std::cout << buffer << '\n';
    return 0;
}
