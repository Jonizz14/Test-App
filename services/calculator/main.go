package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type CalculationRequest struct {
	Numbers []float64 `json:"numbers"`
}

type CalculationResponse struct {
	Result float64 `json:"result"`
	Engine string  `json:"engine"`
}

func calculateHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CalculationRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var sum float64
	for _, num := range req.Numbers {
		sum += num
	}

	resp := CalculationResponse{
		Result: sum,
		Engine: "Go (Golang) High Performance Engine",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func main() {
	http.HandleFunc("/calculate", calculateHandler)
	fmt.Println("Go Calculation Engine running on :8080")
	http.ListenAndServe(":8080", nil)
}
