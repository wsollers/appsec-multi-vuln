package main

import (
	"fmt"
	"net/http"
)

func main() {
	http.HandleFunc("/next", func(w http.ResponseWriter, r *http.Request) {
		target := r.URL.Query().Get("to")
		if target == "" {
			target = "/"
		}
		http.Redirect(w, r, target, http.StatusFound)
	})
	fmt.Println("listening on :8080")
	_ = http.ListenAndServe(":8080", nil)
}
