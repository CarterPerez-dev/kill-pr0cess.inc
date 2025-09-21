# shell.nix

{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.rustc
    pkgs.cargo
    pkgs.pkg-config
    pkgs.openssl
  ];

  shellHook = ''
    echo "Welcome to the Rust backend dev shell!"
    echo "Rust version: $(rustc --version)"
  '';
}

