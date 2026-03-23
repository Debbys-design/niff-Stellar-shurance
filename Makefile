WASM := target/wasm32-unknown-unknown/release/niffyinsure.wasm

.PHONY: build test fmt lint sha clean

build:
	cargo build --target wasm32-unknown-unknown --release

test:
	cargo test

fmt:
	cargo fmt --all -- --check

lint:
	cargo clippy --target wasm32-unknown-unknown --release -- -D warnings

sha: build
	sha256sum $(WASM)

clean:
	cargo clean
