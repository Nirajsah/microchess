{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
    systems.url = "github:nix-systems/default";
    # Rust
    rust-overlay.url = "github:oxalica/rust-overlay";
    crane.url = "github:ipetkov/crane";
    nixup.url = "github:Twey/nixup";
    # Dev tools
    treefmt-nix.url = "github:numtide/treefmt-nix";
  };

  outputs = inputs:
    inputs.flake-parts.lib.mkFlake {inherit inputs;} {
      systems = import inputs.systems;
      imports = [
        inputs.treefmt-nix.flakeModule
      ];

      perSystem = {
        config,
        self',
        inputs',
        lib,
        system,
        ...
      }: let
        pkgs = import inputs.nixpkgs {
          inherit system;
          overlays = [(import inputs.rust-overlay)];
        };

        rust-stable = pkgs.rust-bin.fromRustupToolchainFile ./toolchains/stable/rust-toolchain.toml;

        rust-toolchain =
          rust-stable
          // (pkgs.callPackage inputs.nixup {} {
            default = rust-stable;
            nightly = pkgs.rust-bin.fromRustupToolchainFile ./toolchains/nightly/rust-toolchain.toml;
          });

        craneLib = inputs.crane.lib.${system}.overrideToolchain rust-toolchain;

        buildInputs = with pkgs; [
          rust-toolchain
          wasm-bindgen-cli
          wasm-pack
          nodejs
          bun
          protobuf
          pkg-config
          openssl
          openssl.dev
          clang
          cmake
          gcc
          llvm
          libclang
        ];

        nativeBuildInputs = with pkgs; [
          wasm-bindgen-cli
          wasm-pack
          protobuf
          pkg-config
          clang
          cmake
          gcc
        ];
      in {
        _module.args.pkgs = pkgs;

        packages = {
          default = craneLib.buildPackage {
            src = ./.;
            pname = "microchess";
            version = "0.1.0";
            cargoExtraArgs = "--locked";
            inherit buildInputs nativeBuildInputs;
            doCheck = false;
            meta = with lib; {
              description = "A decentralized platform for playing on-chain chess";
              homepage = "https://github.com/Nirajsah/microchess";
              license = licenses.asl20;
            };
          };
        };

        devShells = {
          default = pkgs.mkShell {
            inherit buildInputs nativeBuildInputs;
            inputsFrom = [
              config.treefmt.build.devShell
            ];
            shellHook = ''
              export PATH=$PWD/target/debug:$PATH
              export RUST_LOG=debug
              export CARGO_TARGET_DIR="$PWD/target"
              export LIBCLANG_PATH="${pkgs.libclang.lib}/lib"
              export BINDGEN_EXTRA_CLANG_ARGS="-isystem ${pkgs.clang}/resource-root/include"
              export PKG_CONFIG_PATH="${pkgs.openssl.dev}/lib/pkgconfig"
              export RUST_BACKTRACE=1
              export RUST_SRC_PATH="${rust-toolchain}/lib/rustlib/src/rust/library"

              echo "🏁 MicroChess development environment loaded!"
              echo "📦 Available tools: rust, wasm-bindgen-cli, bun, protobuf, helix"
              echo "🦀 Rust version: $(rustc --version)"
              echo "📦 Node version: $(node --version)"
              echo "🍞 Bun version: $(bun --version)"
              echo ""
              echo "To get started:"
              echo "  cargo check          # Check Rust code"
              echo "  cargo test           # Run tests"
              echo "  cd frontend && bun install  # Install frontend deps"
              echo "  cd frontend && bun dev      # Start dev server"
            '';
          };
        };

        treefmt.config = {
          projectRootFile = "flake.nix";
          programs = {
            nixpkgs-fmt.enable = true;
            rustfmt.enable = true;
            prettier.enable = true;
          };
        };
      };
    };
}
