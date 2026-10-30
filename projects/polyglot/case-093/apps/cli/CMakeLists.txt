cmake_minimum_required(VERSION 3.24)
project(c093_cli LANGUAGES C CXX)

if(NOT TARGET core_static)
  add_subdirectory(../../native/core core)
endif()

add_executable(case093 src/main.c)
target_link_libraries(case093 PRIVATE core_static)
set_target_properties(case093 PROPERTIES C_STANDARD 11 C_STANDARD_REQUIRED ON)
