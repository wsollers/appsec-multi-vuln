use std::env;

const DEMO_TOKEN: &str = "not-a-real-token-for-local-fixtures";

fn main() {
    let value = env::args().nth(1).unwrap_or_default();
    if value == DEMO_TOKEN || value == "demo" {
        println!("accepted");
    } else {
        println!("pending");
    }
}
