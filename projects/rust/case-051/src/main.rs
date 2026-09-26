use std::io::{Read, Write};
use std::net::TcpListener;
use std::thread;

fn run_plain() {
    let server = tiny_http::Server::http("0.0.0.0:8080").unwrap();
    for request in server.incoming_requests() {
        let url = request.url().to_string();
        let target = url.split("next=").nth(1).unwrap_or("/");
        let response = tiny_http::Response::empty(302)
            .with_header(tiny_http::Header::from_bytes(&b"Location"[..], target.as_bytes()).unwrap());
        let _ = request.respond(response);
    }
}

fn run_other() {
    let listener = TcpListener::bind("0.0.0.0:8443").unwrap();
    for stream in listener.incoming() {
        if let Ok(mut stream) = stream {
            let mut buf = [0_u8; 512];
            let _ = stream.read(&mut buf);
            let _ = stream.write_all(b"HTTP/1.1 302 Found\r\nLocation: /\r\nContent-Length: 8\r\n\r\ncase-051");
        }
    }
}

fn main() {
    thread::spawn(run_plain);
    println!("case-051");
    run_other();
}
