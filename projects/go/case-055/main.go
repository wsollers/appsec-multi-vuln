package main

import (
	"io"
	"net/http"
)

func main() {
	http.HandleFunc("/item", func(w http.ResponseWriter, r *http.Request) {
		target := r.URL.Query().Get("u")
		resp, err := http.Get(target)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		defer resp.Body.Close()
		_, _ = io.Copy(w, resp.Body)
	})
	_ = http.ListenAndServe(":8080", nil)
}
