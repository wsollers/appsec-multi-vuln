use std::env;
use std::fs;
use std::path::PathBuf;

fn main() {
    let name = env::args().nth(1).unwrap_or_else(|| "item.txt".to_string());
    let mut path = PathBuf::from("data");
    path.push(name);
    match fs::read_to_string(path) {
        Ok(value) => print!("{value}"),
        Err(err) => eprintln!("{err}"),
    }
}
