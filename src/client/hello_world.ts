/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
    Keypair,
    Connection,
    PublicKey,
    LAMPORTS_PER_SOL,
    SystemProgram,
    TransactionInstruction,
    Transaction,
    sendAndConfirmTransaction,
  } from '@solana/web3.js';
  import * as path from 'path';
  import * as fs from 'mz/fs';
  
  import {getPayer, getRpcUrl, createKeypairFromFile} from './utils';
  
  /**
   * Connection to the network
   */
  let connection: Connection;
  
  /**
   * Keypair associated to the fees' payer
   */
  let payer: Keypair;
  
  /**
   * Hello world's program id
   */
  let programId: PublicKey;
  
  /**
   * The public key of the account we are saying hello to
   */
  let greetedPubkey: PublicKey;
  
  /**
   * Path to program files
  */
  
  const PROGRAM_PATH = path.resolve(__dirname, '../program-rust/dist/program');
  
  /**
   * Path to program shared object file which should be deployed on chain.
   * This file is created when running either:
   *   - `npm run build:program-c`
   *   - `npm run build:program-rust`
   */
  const PROGRAM_SO_PATH = path.join(PROGRAM_PATH, 'helloworld.so');
  
  /**
   * Path to the keypair of the deployed program.
   * This file is created when running `solana program deploy dist/program/helloworld.so`
   */

  // TODO: Try to change keypar.json
  const PROGRAM_KEYPAIR_PATH = path.join(PROGRAM_PATH, 'helloworld-keypair.json');
  
  /**
   * Establish a connection to the cluster
   */
  export async function establishConnection(): Promise<void> {
    const rpcUrl = await getRpcUrl();
    connection = new Connection(rpcUrl, 'confirmed');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', rpcUrl, version);
  }
  
  /**
   * Establish an account to pay for everything
   */
  export async function establishPayer(): Promise<void> {
    let fees = 10;
    if (!payer) {
      const {feeCalculator} = await connection.getRecentBlockhash();
  
      payer = await getPayer();
    }
  
    let lamports = await connection.getBalance(payer.publicKey);
    if (lamports < fees) {
      // If current balance is not enough to pay for fees, request an airdrop
      const sig = await connection.requestAirdrop(
        payer.publicKey,
        fees - lamports,
      );
      await connection.confirmTransaction(sig);
      lamports = await connection.getBalance(payer.publicKey);
    }
  
    console.log(
      'Using account',
      payer.publicKey.toBase58(),
      'containing',
      lamports / LAMPORTS_PER_SOL,
      'SOL to pay for fees',
    );
  }
  
  export async function checkProgram(): Promise<void> {
    // Read program id from keypair file
    try {
      const programKeypair = await createKeypairFromFile(PROGRAM_KEYPAIR_PATH);
      programId = programKeypair.publicKey;
    } catch (err) {
      const errMsg = (err as Error).message;
      throw new Error(
        `Failed to read program keypair at '${PROGRAM_KEYPAIR_PATH}' due to error: ${errMsg}. Program may need to be deployed with \`solana program deploy dist/program/helloworld.so\``,
      );
    }
  
    // Check if the program has been deployed
    const programInfo = await connection.getAccountInfo(programId);
    if (programInfo === null) {
      if (fs.existsSync(PROGRAM_SO_PATH)) {
        throw new Error(
          'Program needs to be deployed with `solana program deploy dist/program/helloworld.so`',
        );
      } else {
        throw new Error('Program needs to be built and deployed');
      }
    } else if (!programInfo.executable) {
      throw new Error(`Program is not executable`);
    }
    console.log(`Using program ${programId.toBase58()}`);
  
    // Derive the address (public key) of a greeting account from the program so that it's easy to find later.
    const GREETING_SEED = 'hello';
    greetedPubkey = await PublicKey.createWithSeed(
      payer.publicKey,
      GREETING_SEED,
      programId,
    );
  
    // Check if the greeting account has already been created
    const greetedAccount = await connection.getAccountInfo(greetedPubkey);
    if (greetedAccount === null) {
      console.log(
        'Creating account',
        greetedPubkey.toBase58(),
        'to say hello to',
      );
      const lamports = await connection.getMinimumBalanceForRentExemption(
        1234,
      );
  
      const transaction = new Transaction().add(
        SystemProgram.createAccountWithSeed({
          fromPubkey: payer.publicKey,
          basePubkey: payer.publicKey,
          seed: GREETING_SEED,
          newAccountPubkey: greetedPubkey,
          lamports,
          space: 1234,
          programId,
        }),
      );
      await sendAndConfirmTransaction(connection, transaction, [payer]);
    }
  }
  
  /**
   * Say hello
   */
  export async function sayHello(): Promise<void> {
    console.log('Saying hello to', greetedPubkey.toBase58());
    const instruction = new TransactionInstruction({
      keys: [{pubkey: greetedPubkey, isSigner: false, isWritable: true}],
      programId,
      data: Buffer.alloc(0), // All instructions are hellos
    });
    await sendAndConfirmTransaction(
      connection,
      new Transaction().add(instruction),
      [payer],
    );
  }
  