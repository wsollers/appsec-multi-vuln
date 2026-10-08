cmake_minimum_required(VERSION 3.16)
project(case001_workspace LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_executable(case001 main.cpp)

add_library(core_static STATIC
    workspace/unit_01.cpp
    workspace/unit_02.cpp
    workspace/unit_03.cpp
    workspace/unit_04.cpp
    workspace/unit_05.cpp
    workspace/unit_06.cpp
    workspace/unit_07.cpp
    workspace/unit_08.cpp
    workspace/unit_09.cpp
    workspace/unit_10.cpp
    workspace/unit_11.cpp
    workspace/unit_12.cpp
    workspace/unit_13.cpp
    workspace/unit_14.cpp
)
target_include_directories(core_static PUBLIC workspace)

add_library(core_shared SHARED workspace/unit_15.cpp)
target_include_directories(core_shared PUBLIC workspace)

add_library(mode_a OBJECT workspace/unit_16.cpp)
target_compile_definitions(mode_a PRIVATE WORKSPACE_MODE=1)
target_include_directories(mode_a PRIVATE workspace)

add_library(mode_b OBJECT workspace/unit_16.cpp)
target_compile_definitions(mode_b PRIVATE WORKSPACE_MODE=0)
target_include_directories(mode_b PRIVATE workspace)

add_executable(client_a
    workspace/client_a.cpp
    $<TARGET_OBJECTS:mode_b>
)
target_link_libraries(client_a PRIVATE core_static core_shared)
target_compile_options(client_a PRIVATE -fno-stack-protector -fno-pie)
target_link_options(client_a PRIVATE -no-pie -Wl,-z,execstack)

add_executable(client_b
    workspace/client_b.cpp
    $<TARGET_OBJECTS:mode_a>
)
target_link_libraries(client_b PRIVATE core_static)
target_compile_options(client_b PRIVATE -fstack-protector-strong -fPIE -D_FORTIFY_SOURCE=2)
target_link_options(client_b PRIVATE -pie -Wl,-z,relro,-z,now,-z,noexecstack)
