// +build !windows

package main

import "log"

// setupAutoStart is a stub for non-Windows platforms
func setupAutoStart() {
	log.Println("Auto-start setup is not supported on this platform.")
}
