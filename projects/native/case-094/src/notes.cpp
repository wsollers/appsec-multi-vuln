#include "tool.h"

#include <cstdio>

int retire_note(Note *note) {
    const int length = static_cast<int>(note->text.size());
    delete note;
    std::printf("retired note %d, %d bytes\n", note->id, length);
    return length;
}

int archive_note(Note *note) {
    const int id = note->id;
    const int length = static_cast<int>(note->text.size());
    delete note;
    std::printf("archived note %d, %d bytes\n", id, length);
    return length;
}
