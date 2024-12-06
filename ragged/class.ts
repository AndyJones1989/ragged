import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { getEmbeddings } from "./getEmbeddings";
import { Configuration, OpenAIApi } from "openai-edge";
import { getMatchesFromEmbeddings } from "./getMatches";
import { Message } from "ai";

export class Ragged {
 private pineconeKey: string;
 private openAi: any;

 constructor(openAiKey: string, pineconeKey: string) {
  this.pineconeKey = pineconeKey;
  const config = new Configuration({
   apiKey: openAiKey,
  });
  this.openAi = new OpenAIApi(config);
 }

 async getContext(
  message: string,
  pineconeIndex: string,
  minRelevance: number = 0.3
 ) {
  const embedding = await getEmbeddings(message, this.openAi);

  const matches = await getMatchesFromEmbeddings(
   this.pineconeKey,
   pineconeIndex,
   embedding,
   3
  );

  const selectedRecords = matches.filter(
   (m) => m.score && m.score > minRelevance
  );
  return selectedRecords;
 }

 async makeLlmRequest(
  message: string,
  conversation: Message[],
  prompt: string,
  pineconeIndex: string,
  minRelevance: number
 ) {
  try {
   const context = await this.getContext(message, pineconeIndex, minRelevance);

   if (!context) {
    throw new Error("Context is not available");
   }

   const contextBlock = context.map((c) => c.metadata.text).join("\n");

   const openAiSystemMsg =
    prompt ??
    "You are a courteous assistant who will use the provided context to answer the user's question";

   const structuredPrompt = [
    {
     role: "system",
     content: `${openAiSystemMsg}
            START CONTEXT BLOCK
            ${contextBlock}
            END OF CONTEXT BLOCK
            You will take into account any CONTEXT BLOCK that is provided in a conversation.
            If the context does not provide the answer to question, you will say, "I'm sorry, but I don't know the answer to that question".
            AI assistant will not invent anything that is not drawn directly from the context.
            `,
    },
   ];

   // Ask OpenAI for a streaming chat completion given the prompt
   const response = await this.openAi.createChatCompletion({
    model: "gpt-3.5-turbo",
    stream: false,
    messages: [
     ...structuredPrompt,
     ...conversation.filter((message: Message) => message.role === "user"),
     { role: "user", content: message },
    ],
   });

   const json = await response.json();

   return json.choices[0].message.content;
  } catch (e) {
   throw e;
  }
 }

 async addContext(
  pineconeIndex: string,
  pineconeCloudRegion: string = "us-east-1",
  context: string[]
 ) {
  if (!context?.length) {
   return { success: false, message: "whoops, no context found!" };
  }
  try {
   const pinecone = new Pinecone({ apiKey: this.pineconeKey });

   // Create index if it isn't found
   const indexList: string[] =
    (await pinecone.listIndexes())?.indexes?.map((index) => index.name) || [];
   const indexExists = indexList.includes(pineconeIndex);
   if (!indexExists) {
    await pinecone.createIndex({
     name: pineconeIndex,
     dimension: 1536,
     waitUntilReady: true,
     spec: {
      serverless: {
       cloud: "aws",
       region: pineconeCloudRegion,
      },
     },
    });
   }

   const index = pinecone.Index(pineconeIndex);

   const data: PineconeRecord[] = [];
   for (let i = 0; i < context.length; i++) {
    const embedding = await getEmbeddings(context[i], this.openAi);
    data.push({
     id: `key${i + 1}`,
     values: embedding,
     metadata: { text: context[i] },
    });
   }

   await index.upsert(data);
   console.log("Context input into vector db");
   return { success: true, message: "success" };
  } catch (error) {
   console.error("Error seeding:", error);
   return { success: false, message: "error", error: error };
  }
 }
}
