cmake_minimum_required(VERSION 3.20)
project(case_083 LANGUAGES C)

set(CMAKE_C_STANDARD 17)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_C_EXTENSIONS OFF)
add_executable(case083 src/main.c)
target_compile_options(case083 PRIVATE -Wall -Wextra -Wpedantic)
