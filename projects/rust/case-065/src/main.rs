fn main() {
    let value = std::env::args().nth(1).unwrap_or_else(|| "sample".to_string());
    let digest = md5::compute(value.as_bytes());
    println!("{:x}", digest);
}
