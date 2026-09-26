cmake_minimum_required(VERSION 3.16)
project(case030 LANGUAGES C CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(VENDOR_DIR ${CMAKE_CURRENT_SOURCE_DIR}/third_party/vendor-001)
add_library(case030_vendor STATIC
    ${VENDOR_DIR}/adler32.c
    ${VENDOR_DIR}/compress.c
    ${VENDOR_DIR}/crc32.c
    ${VENDOR_DIR}/deflate.c
    ${VENDOR_DIR}/infback.c
    ${VENDOR_DIR}/inffast.c
    ${VENDOR_DIR}/inflate.c
    ${VENDOR_DIR}/inftrees.c
    ${VENDOR_DIR}/trees.c
    ${VENDOR_DIR}/uncompr.c
    ${VENDOR_DIR}/zutil.c
)
target_include_directories(case030_vendor PUBLIC ${VENDOR_DIR})

add_executable(case030 src/main.cpp)
target_link_libraries(case030 PRIVATE case030_vendor)
