<p align="center">
  <a href="https://solana.com">
    <img alt="Solana" src="https://i.imgur.com/uBVzyX3.png" width="250" />
  </a>
</p>


# Hello world on Solana

### Start local validator in separate tab

```bash
solana-test-validator
```

### Install npm dependencies

```bash
npm install
```

### Build the on-chain program

Go to /src/program/

```bash
cargo build-bpf --bpf-out-dir=dist/program
```

### Deploy the on-chain program

```bash
solana program deploy dist/program/helloworld.so
```

### Run the JavaScript client

Go to root directory WSoS-2022

```bash
npm run start
```