cmake_minimum_required(VERSION 3.24)
project(c093_codec LANGUAGES CXX)

add_library(codec STATIC src/codec.cpp)
target_include_directories(codec PUBLIC ${CMAKE_CURRENT_SOURCE_DIR}/include)
set_target_properties(codec PROPERTIES
  CXX_STANDARD 17
  CXX_STANDARD_REQUIRED ON
  POSITION_INDEPENDENT_CODE ON)
