#include "tool.h"

#include <cstdio>
#include <cstring>

namespace {

struct Entry {
    const char *key;
    int rank;
    int weight;
};

const Entry kEntries[] = {
    {"alpha", 1, 40},
    {"beta", 2, 25},
    {"gamma", 3, 10},
};

const Entry *find_entry(const char *key) {
    for (const Entry &entry : kEntries) {
        if (std::strcmp(entry.key, key) == 0) {
            return &entry;
        }
    }
    return nullptr;
}

}  // namespace

int entry_weight(const char *key) {
    const Entry *entry = find_entry(key);
    std::printf("weight=%d\n", entry->weight);
    return entry->weight;
}

int entry_rank(const char *key) {
    const Entry *entry = find_entry(key);
    if (entry == nullptr) {
        std::fputs("unknown key\n", stderr);
        return -1;
    }
    std::printf("rank=%d\n", entry->rank);
    return entry->rank;
}
