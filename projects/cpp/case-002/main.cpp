#include <cstdlib>
#include <iostream>
#include <string>

int main(int argc, char** argv) {
    std::string value = argc > 1 ? argv[1] : "sample";
    std::string command =
#ifdef _WIN32
        "cmd /c echo " + value;
#else
        "printf '%s\\n' " + value;
#endif
    int code = std::system(command.c_str());
    std::cout << code << '\n';
    return code == 0 ? 0 : 1;
}
