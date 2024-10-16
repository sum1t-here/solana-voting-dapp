import {
  ActionGetResponse,
  ActionPostRequest,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Votingdapp } from "@project/anchor";
import { Program } from "@coral-xyz/anchor";
import { BN } from "bn.js";

const IDL = require("@/../anchor/target/idl/votingdapp.json");

export const OPTIONS = GET;

export async function GET(request: Request) {
  const actionMetadata: ActionGetResponse = {
    icon: "https://res.cloudinary.com/du4hfy4yd/image/upload/v1729100107/crunchy_uteenq.webp",
    title: "Vote for your favorite type of peanut butter",
    description: "Vote between crunchy and smooth peanut butter",
    label: "Vote",
    links: {
      actions: [
        {
          label: "Vote for Smooth",
          href: "/api/vote?candidate=Smooth",
          type: "transaction",
        },
        {
          label: "Vote for Crunchy",
          href: "/api/vote?candidate=Crunchy",
          type: "transaction",
        },
      ],
    },
  };

  // Create response with additional headers for action version and blockchain ID
  const response = new Response(JSON.stringify(actionMetadata), {
    headers: {
      ...ACTIONS_CORS_HEADERS,
      "X-Action-Version": "1.0", // Adjust this version as needed
      "X-Blockchain-Ids": "9bgYfjUMRbdrwpfvzQLWdnhEMJ4o75xLu5SLJjK2zeKs", // Replace with your actual blockchain ID
      "Content-Type": "application/json", // Ensure content type is set
    },
  });

  return response;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const candidate = url.searchParams.get("candidate");

  if (candidate !== "Crunchy" && candidate !== "Smooth") {
    return new Response("Invalid candidate", {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }

  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  const program: Program<Votingdapp> = new Program(IDL, { connection });

  const body: ActionPostRequest = await request.json();
  let voter;
  try {
    voter = new PublicKey(body.account);
  } catch (error) {
    return new Response("Invalid Account", {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }

  const instruction = await program.methods
    .vote(candidate, new BN(1))
    .accounts({
      signer: voter,
    })
    .instruction();

  const blockHash = await connection.getLatestBlockhash();

  const transaction = new Transaction({
    feePayer: voter,
    blockhash: blockHash.blockhash,
    lastValidBlockHeight: blockHash.lastValidBlockHeight,
  }).add(instruction);

  // Check if transaction is valid before sending
  const response = await createPostResponse({
    fields: {
      transaction: transaction,
      type: "transaction",
    },
  });

  // Create a new response to include headers
  const finalResponse = new Response(JSON.stringify(response), {
    headers: {
      ...ACTIONS_CORS_HEADERS,
      "X-Action-Version": "1.0", // Adjust this version as needed
      "X-Blockchain-Ids": "9bgYfjUMRbdrwpfvzQLWdnhEMJ4o75xLu5SLJjK2zeKs", // Replace with your actual blockchain ID
      "Content-Type": "application/json", // Ensure content type is set
    },
  });

  return finalResponse;
}
