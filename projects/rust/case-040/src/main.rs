fn main() {
    let raw = Box::into_raw(Box::new(String::from("sample")));
    unsafe {
        drop(Box::from_raw(raw));
        println!("{}", (*raw).len());
    }
}
