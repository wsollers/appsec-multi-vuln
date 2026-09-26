#include <cstdlib>
#include <cstdio>
#include <iostream>
#include <string>

#define CASE028_RELEASE(p) std::free((p))
#define CASE028_DONE(p) CASE028_RELEASE(p)

template <typename T>
struct Holder {
    explicit Holder(T* p) : ptr(p) {}
    ~Holder() {
        CASE028_DONE(ptr);
    }
    T* ptr;
};

template <typename T>
void close_now(Holder<T>& holder) {
    CASE028_RELEASE(holder.ptr);
}

int main(int argc, char** argv) {
    auto* raw = static_cast<char*>(std::malloc(32));
    std::snprintf(raw, 32, "%s", argc > 1 ? argv[1] : "sample");
    Holder<char> holder(raw);
    close_now(holder);
    std::cout << raw << '\n';
}
