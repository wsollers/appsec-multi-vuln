cmake_minimum_required(VERSION 3.24)
project(case093 LANGUAGES C CXX)

set(CMAKE_POSITION_INDEPENDENT_CODE ON)

add_subdirectory(native/core)
add_subdirectory(apps/cli)

find_package(JNI COMPONENTS JVM)
if(JNI_FOUND)
  add_subdirectory(native/bridge-jni)
else()
  message(STATUS "JNI headers not found; skipping native/bridge-jni")
endif()
