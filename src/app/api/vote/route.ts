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
    icon: "https://drive.google.com/file/d/1ner621LKqTMVGpoEHqNnXaWNXpyJS2q5/view?usp=sharing",
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

  return Response.json(actionMetadata, { headers: ACTIONS_CORS_HEADERS });
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

  const response = await createPostResponse({
    fields: {
      transaction: transaction,
      type: "transaction",
    },
  });

  return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
}
