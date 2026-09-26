package main

import (
	"fmt"
	"runtime"
	"unsafe"
)

func main() {
	values := []byte("sample")
	addr := uintptr(unsafe.Pointer(&values[0]))
	values = nil
	runtime.GC()
	fmt.Println(*(*byte)(unsafe.Pointer(addr)))
}
