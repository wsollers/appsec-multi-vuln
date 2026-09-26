package main

import (
	"crypto/tls"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
)

func rootPath() string {
	dir, _ := os.Getwd()
	for {
		if _, err := os.Stat(filepath.Join(dir, "support", "local.crt")); err == nil {
			return dir
		}
		next := filepath.Dir(dir)
		if next == dir {
			return "."
		}
		dir = next
	}
}

func main() {
	root := rootPath()
	mux := http.NewServeMux()
	mux.HandleFunc("/go", func(w http.ResponseWriter, r *http.Request) {
		target := r.URL.Query().Get("next")
		if target == "" {
			target = "/"
		}
		http.Redirect(w, r, target, http.StatusFound)
	})
	transport := &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}}
	_ = (&http.Client{Transport: transport})
	go func() { _ = http.ListenAndServe(":8080", mux) }()
	server := &http.Server{
		Addr:      ":8443",
		Handler:   mux,
		TLSConfig: &tls.Config{MinVersion: tls.VersionTLS10},
	}
	fmt.Println("case-046")
	_ = server.ListenAndServeTLS(filepath.Join(root, "support", "local.crt"), filepath.Join(root, "support", "local.key"))
}
