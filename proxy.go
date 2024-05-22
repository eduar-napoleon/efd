package main

import (
    "io"
    "log"
    "net"
    "net/http"
)

//GOOS=windows GOARCH=x86 go build -ldflags="-s -w -H=windowsgui" -o proxy.exe .

func handleTunneling(w http.ResponseWriter, r *http.Request) {
    destConn, err := net.Dial("tcp", r.Host)
    if err != nil {
        http.Error(w, err.Error(), http.StatusServiceUnavailable)
        return
    }
    w.WriteHeader(http.StatusOK)
    hijacker, ok := w.(http.Hijacker)
    if !ok {
        http.Error(w, "Hijacking not supported", http.StatusInternalServerError)
        return
    }
    clientConn, _, err := hijacker.Hijack()
    if err != nil {
        http.Error(w, err.Error(), http.StatusServiceUnavailable)
    }
    go transfer(destConn, clientConn)
    go transfer(clientConn, destConn)
}

func transfer(destination io.WriteCloser, source io.ReadCloser) {
    defer destination.Close()
    defer source.Close()
    io.Copy(destination, source)
}

func main() {
    server := &http.Server{
        Addr: ":8080",
        Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            if r.Method == http.MethodConnect {
                handleTunneling(w, r)
            } else {
                http.Error(w, "Not supported", http.StatusMethodNotAllowed)
            }
        }),
    }

	log.Println("Starting proxy server on :8080")
    log.Fatal(server.ListenAndServe())
    // Set up the application to auto-start
    setupAutoStart()
}
