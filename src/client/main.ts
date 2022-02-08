/**
 * Hello world
 */

 import {
    establishConnection,
    checkProgram,
    establishPayer,
    sayHello,
  } from './hello_world';
  
  async function main() {
    console.log("Let's say hello to a Solana account...");
  
    // Establish connection to the cluster
    await establishConnection();
  
    // Determine who pays for the fees
    await establishPayer();
  
    await checkProgram();
  
    // Say hello to an account
    await sayHello();
  
    console.log('Success');
  }
  
  main().then(
    () => process.exit(),
    err => {
      console.error(err);
      process.exit(-1);
    },
  );
  