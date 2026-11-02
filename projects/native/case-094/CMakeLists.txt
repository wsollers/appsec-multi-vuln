cmake_minimum_required(VERSION 3.20)
project(case_094 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
add_executable(case094
  src/access.cpp
  src/blocks.cpp
  src/console.cpp
  src/directory.cpp
  src/echo.cpp
  src/main.cpp
  src/notes.cpp
  src/title.cpp
)
target_compile_options(case094 PRIVATE -Wall -Wextra -Wpedantic)
