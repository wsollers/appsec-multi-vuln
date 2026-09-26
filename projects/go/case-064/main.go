package main

import (
	"archive/zip"
	"io"
	"os"
	"path/filepath"
)

func main() {
	name := "sample.zip"
	if len(os.Args) > 1 {
		name = os.Args[1]
	}
	reader, err := zip.OpenReader(name)
	if err != nil {
		return
	}
	defer reader.Close()
	for _, file := range reader.File {
		target := filepath.Join("out", file.Name)
		_ = os.MkdirAll(filepath.Dir(target), 0755)
		src, err := file.Open()
		if err != nil {
			continue
		}
		dst, err := os.Create(target)
		if err == nil {
			_, _ = io.Copy(dst, src)
			_ = dst.Close()
		}
		_ = src.Close()
	}
}
