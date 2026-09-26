use std::env;
use std::process::Command;

fn main() {
    let value = env::args().nth(1).unwrap_or_else(|| "printf sample".to_string());
    let status = if cfg!(windows) {
        Command::new("cmd").args(["/C", &value]).status()
    } else {
        Command::new("sh").args(["-c", &value]).status()
    };
    println!("{}", status.map(|s| s.code().unwrap_or_default()).unwrap_or(1));
}
