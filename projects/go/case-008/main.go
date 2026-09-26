package main

import (
	"fmt"
	"os"
)

func main() {
	value := "sample"
	if len(os.Args) > 1 {
		value = os.Args[1]
	}
	query := "select id, name from items where name = '" + value + "'"
	fmt.Println(query)
}
