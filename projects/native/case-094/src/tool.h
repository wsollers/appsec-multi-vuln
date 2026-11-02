#pragma once

#include <cstdint>
#include <string>

struct Note {
    int id;
    std::string text;
};

bool accept_key(const char *presented);
bool accept_token(const char *presented);

bool fill_batch(std::uint32_t count);
bool fill_blocks(std::uint32_t count);

void show_banner(const char *text, bool wide);
void show_line(const char *text);

int entry_rank(const char *key);
int entry_weight(const char *key);

int echo_label(const char *name);
int echo_name(const char *name);

int archive_note(Note *note);
int retire_note(Note *note);

bool store_caption(const char *text);
void store_title(const char *text);
