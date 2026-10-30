// Package recordc wraps the shared core record library through cgo.
package recordc

/*
#cgo CFLAGS: -I${SRCDIR}/../../../native/core/include
#cgo LDFLAGS: -L${SRCDIR}/../../../build/native/core -lcore -Wl,-rpath,${SRCDIR}/../../../build/native/core
#include <stdlib.h>
#include "core/record.h"
*/
import "C"

import (
	"errors"
	"unsafe"
)

// MaxInput is the largest record the wrapper accepts.
const MaxInput = 1 << 20

// Record is a parsed record copied into Go memory.
type Record struct {
	Name    string
	Kind    int
	Body    []byte
	Summary string
}

// Parse decodes one framed record.
func Parse(data []byte) (Record, error) {
	size := C.int(len(data))
	if size == 0 || size > MaxInput {
		return Record{}, errors.New("record size out of range")
	}
	buffer := C.CBytes(data)
	defer C.free(buffer)

	var rec C.core_record
	if C.core_parse((*C.uchar)(buffer), C.size_t(size), &rec) != 0 {
		return Record{}, errors.New("unreadable record")
	}

	bodyLen := int(rec.len)
	if bodyLen > C.CORE_BODY_MAX {
		bodyLen = C.CORE_BODY_MAX
	}
	return Record{
		Name:    C.GoString(&rec.name[0]),
		Kind:    int(rec.kind),
		Body:    C.GoBytes(unsafe.Pointer(&rec.body[0]), C.int(bodyLen)),
		Summary: describe(&rec),
	}, nil
}

func describe(rec *C.core_record) string {
	var length C.size_t
	text := C.core_describe(rec, &length)
	if text == nil {
		return ""
	}
	defer C.core_free(unsafe.Pointer(text))
	return string(unsafe.Slice((*byte)(unsafe.Pointer(text)), int(length)))
}
