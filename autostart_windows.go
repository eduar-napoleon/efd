// +build windows

package main

import (
	"log"
	"os"
	"path/filepath"

	"golang.org/x/sys/windows/registry"
)

// setupAutoStart sets up auto-start by adding a registry entry on Windows
func setupAutoStart() {
	executablePath, err := os.Executable()
	if err != nil {
		log.Fatalf("Failed to get executable path: %v", err)
	}

	key, err := registry.OpenKey(registry.CURRENT_USER, `Software\Microsoft\Windows\CurrentVersion\Run`, registry.QUERY_VALUE|registry.SET_VALUE)
	if err != nil {
		log.Fatalf("Failed to open registry key: %v", err)
	}
	defer key.Close()

	existingPath, _, err := key.GetStringValue("SimpleProxy")
	if err == nil && filepath.Clean(existingPath) == filepath.Clean(executablePath) {
		log.Println("Auto-start is already set up with the current path.")
		return
	}

	err = key.SetStringValue("SimpleProxy", executablePath)
	if err != nil {
		log.Fatalf("Failed to set registry value: %v", err)
	}

	log.Println("Successfully added/updated auto-start entry.")
}
