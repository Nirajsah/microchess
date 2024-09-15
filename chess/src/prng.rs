use std::cell::RefCell;

thread_local! {
    static STATE: RefCell<u32> = RefCell::new(1804289383);
}

pub fn get_random() -> u32 {
    STATE.with(|state| {
        let mut state = state.borrow_mut();
        *state ^= *state << 13;
        *state ^= *state >> 17;
        *state ^= *state << 5;
        *state
    })
}

fn get_random_u64() -> u64 {
    let n1 = get_random() as u64 & 0xFFFF;
    let n2 = get_random() as u64 & 0xFFFF;
    let n3 = get_random() as u64 & 0xFFFF;
    let n4 = get_random() as u64 & 0xFFFF;

    n1 | (n2 << 16) | (n3 << 32) | (n4 << 48)
}

pub fn generate_magic_number() -> u64 {
    return get_random_u64() & get_random_u64() & get_random_u64();
}
