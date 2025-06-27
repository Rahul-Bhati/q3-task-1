import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, Wallet, AnchorProvider } from "@coral-xyz/anchor";
import { IDL, Turbin3Prereq } from "./program/Turbin3_prereq";
import wallet from "./Turbin3-wallet.json";

const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

// We're going to import our keypair from the wallet file
const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

// Create a devnet connection
const connection = new Connection("https://api.devnet.solana.com");

// To register ourselves as having completed pre - requisites, we need to submit our github accountname as a utf8 buffer:

// Create our anchor provider
const provider = new AnchorProvider(connection, new Wallet(keypair), { commitment: "confirmed" });

// Create our program
const program: Program<Turbin3Prereq> = new Program(IDL, provider);

// Create the PDA for our enrollment account
const account_seeds = [Buffer.from("prereqs"), keypair.publicKey.toBuffer()];
const [account_key, _account_bump] = PublicKey.findProgramAddressSync(account_seeds, program.programId);

const mintCollection = new PublicKey("5ebsp5RChCGK7ssRZMVMufgVZhd2kFbNaotcZ5UvytN2");

const mintTs = Keypair.generate();
const [authorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("collection"), mintCollection.toBuffer()],
    program.programId
);
console.log("Authority PDA:", authorityPda.toBase58());

// Execute the initialize transaction
(async () => {
    const accountInfo = await connection.getAccountInfo(account_key);
    if (!accountInfo) {
        const txhash = await program.methods
            .initialize("Rahul-Bhati")
            .accountsPartial({
                user: keypair.publicKey,
                account: account_key,
                system_program: SystemProgram.programId,
            })
            .signers([keypair])
            .rpc();

        console.log(`Success! TX: https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
    } else {
        console.log("Account already exists, skipping initialize.");
    }
})();

// Execute the update transaction
(async () => {
    try {
        const txhash = await program.methods
            .update("Rahul-Bhati")
            .accountsPartial({
                user: keypair.publicKey,
                account: account_key,
                system_program: SystemProgram.programId,
            })
            .signers([keypair])
            .rpc();

        console.log(
            `GitHub updated: https://explorer.solana.com/tx/${txhash}?cluster=devnet`
        );
    } catch (e) {
        console.error(" Update failed:", e);
    }
})();

// [99,111,108,108,101,99,116,105,111,110]
// Execute the submitTs transaction
// (async () => {
//     try {
//         const txhash = await program.methods
//             .submit_ts()
//             .accountsPartial({
//                 user: keypair.publicKey, // user
//                 account: account_key, // account
//                 mint: mintTs.publicKey, // mint
//                 collection: mintCollection, // collection
//                 authority: authorityPda, // authority 
//                 mpl_core_program: MPL_CORE_PROGRAM_ID, // mpl_core+program
//                 system_program: SystemProgram.programId, // system_program
//             })
//             .signers([keypair, mintTs])
//             .rpc();
//         console.log(`Success! Check out your TX here: https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
//     } catch (e) {
//         console.error(`Oops, something went wrong: ${e}`);
//     }
// })

(async () => {
    try {
        console.log("Submitting TS...");
        const txhash = await program.methods
            .submitTs()
            .accountsPartial({
                user: keypair.publicKey,
                account: account_key,
                mint: mintTs.publicKey,
                collection: mintCollection,
                authority: authorityPda,
                mpl_core_program: MPL_CORE_PROGRAM_ID,
                system_program: SystemProgram.programId,
            })
            .signers([keypair, mintTs])
            .rpc();

        console.log(`Submit success! https://explorer.solana.com/tx/${txhash}?cluster=devnet`);
    } catch (e: any) {
        console.error("Submit TS failed:", e);
        if (e.logs) console.error("Logs:", e.logs);
    }
})();
