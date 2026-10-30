cmake_minimum_required(VERSION 3.24)
project(c093_bridge_jni LANGUAGES C CXX)

set(CMAKE_POSITION_INDEPENDENT_CODE ON)

find_package(JNI REQUIRED COMPONENTS JVM)

if(NOT TARGET core)
  add_subdirectory(../core core)
endif()

add_library(c093jni SHARED src/bridge.cpp)
target_include_directories(c093jni PRIVATE ${JNI_INCLUDE_DIRS})
target_link_libraries(c093jni PRIVATE core)
set_target_properties(c093jni PROPERTIES CXX_STANDARD 17 CXX_STANDARD_REQUIRED ON)
