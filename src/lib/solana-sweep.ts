import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { USDT } from "@/lib/constants";
import { ADMIN_WALLET_INDEX } from "@/lib/wallet";
import {
  generateSolanaDepositAddress,
  getHeliusApiKey,
  getSolanaKeypair,
  getSolanaRpcUrl,
} from "@/lib/solana-wallet";

function getConnection() {
  return new Connection(getSolanaRpcUrl(), "confirmed");
}

async function fundSolanaGas(toAddress: string) {
  const connection = getConnection();
  const admin = getSolanaKeypair(ADMIN_WALLET_INDEX);
  const destination = new PublicKey(toAddress);
  const lamports = Math.floor(0.01 * LAMPORTS_PER_SOL);

  const adminBalance = await connection.getBalance(admin.publicKey);
  if (adminBalance < lamports + 5000) {
    throw new Error("Admin Solana wallet needs SOL for sweep gas");
  }

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: admin.publicKey,
      toPubkey: destination,
      lamports,
    })
  );

  const signature = await sendAndConfirmTransaction(connection, tx, [admin]);
  return signature;
}

export async function sweepSolana(walletIndex: number) {
  if (walletIndex === ADMIN_WALLET_INDEX) return null;
  if (!getHeliusApiKey()) {
    throw new Error("HELIUS_API_KEY is required for Solana sweep");
  }

  const connection = getConnection();
  const source = getSolanaKeypair(walletIndex);
  const admin = getSolanaKeypair(ADMIN_WALLET_INDEX);
  const mint = new PublicKey(USDT.SOL.mint);
  const sourceAta = getAssociatedTokenAddressSync(mint, source.publicKey);
  const adminAta = getAssociatedTokenAddressSync(mint, admin.publicKey);

  let tokenBalance: bigint;
  try {
    const account = await getAccount(connection, sourceAta, undefined, TOKEN_PROGRAM_ID);
    tokenBalance = account.amount;
  } catch {
    return null;
  }

  if (tokenBalance === BigInt(0)) return null;

  const sourceSol = await connection.getBalance(source.publicKey);
  if (sourceSol < 5000) {
    await fundSolanaGas(source.publicKey.toBase58());
  }

  const tx = new Transaction().add(
    createAssociatedTokenAccountIdempotentInstruction(
      admin.publicKey,
      adminAta,
      admin.publicKey,
      mint
    ),
    createTransferInstruction(sourceAta, adminAta, source.publicKey, tokenBalance)
  );

  const txHash = await sendAndConfirmTransaction(connection, tx, [source, admin]);
  const amount = Number(tokenBalance) / Math.pow(10, USDT.SOL.decimals);

  return {
    txHash,
    amount,
    to: generateSolanaDepositAddress(ADMIN_WALLET_INDEX),
  };
}
