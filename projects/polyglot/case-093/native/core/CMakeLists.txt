cmake_minimum_required(VERSION 3.24)
project(c093_core LANGUAGES C CXX)

set(CMAKE_POSITION_INDEPENDENT_CODE ON)

if(NOT TARGET codec)
  add_subdirectory(codec)
endif()

set(CORE_SOURCES src/record.c src/describe.c src/table.c)

add_library(core SHARED ${CORE_SOURCES})
add_library(core_static STATIC ${CORE_SOURCES})
set_target_properties(core_static PROPERTIES OUTPUT_NAME core)

foreach(target core core_static)
  target_include_directories(${target} PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)
  target_link_libraries(${target} PRIVATE codec)
  set_target_properties(${target} PROPERTIES C_STANDARD 11 C_STANDARD_REQUIRED ON)
endforeach()
