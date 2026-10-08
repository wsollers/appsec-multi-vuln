#pragma once

#include <cstddef>
#include <string>

namespace workspace {
int operation_01(std::size_t value);
int operation_02(std::size_t value);
int operation_03(std::size_t value);
int operation_04();
int operation_05();
int operation_06();
int operation_07();
int operation_08(unsigned short value);
int operation_09(unsigned long value);
int operation_10(const char* value);
int operation_11(const std::string& value);
int operation_12(const std::string& value);
int operation_13(bool value);
int operation_14(bool value);
int operation_15(const char* value);
int operation_16(const char* value);
std::string operation_17(int count, char** values);
bool operation_18(const std::string& value);
bool operation_19(const std::string& value);
int operation_20(const std::string& value, bool mode);
char* operation_21(std::size_t value);
int operation_22(char* value);
int operation_23(int value);
int operation_24(const char* value);
int operation_25(int value);
int operation_26(int value);
}

extern "C" char* workspace_open(std::size_t value);
extern "C" void workspace_close(char* value);
extern "C" int workspace_read(char* value);
