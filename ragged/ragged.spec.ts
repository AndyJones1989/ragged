import { Ragged } from "./class";
import { getEmbeddings } from "./getEmbeddings";
import { getMatchesFromEmbeddings } from "./getMatches";
import { Pinecone } from "@pinecone-database/pinecone";
import { Message } from "ai";
import { jest, describe, beforeEach, it, expect } from "@jest/globals";

jest.mock("./getEmbeddings");
jest.mock("./getMatches");
jest.mock("@pinecone-database/pinecone");
jest.mock("openai-edge");

describe("Ragged", () => {
 let ragged: Ragged;
 let openAiKey = "test-openai-key";
 let pineconeKey = "test-pinecone-key";

 beforeEach(() => {
  ragged = new Ragged(openAiKey, pineconeKey);
 });

 describe("getContext", () => {
  it("should return selected records based on relevance", async () => {
   const message = "test message";
   const pineconeIndex = "test-index";
   const minRelevance = 0.3;
   const embedding = [0.1, 0.2, 0.3];
   const matches = [
    { score: 0.4, metadata: { text: "match1" } },
    { score: 0.2, metadata: { text: "match2" } },
   ];

   // @ts-ignore
   (getEmbeddings as jest.Mock).mockResolvedValue(embedding);
   // @ts-ignore
   (getMatchesFromEmbeddings as jest.Mock).mockResolvedValue(matches);

   const result = await ragged.getContext(message, pineconeIndex, minRelevance);

   expect(result).toEqual([{ score: 0.4, metadata: { text: "match1" } }]);
  });
 });

 it("should throw an error if context is not available", async () => {
  const message = "test message";
  const conversation: Message[] = [{ role: "user", content: "Hello", id: "0" }];
  const prompt = "test prompt";
  const pineconeIndex = "test-index";
  const minRelevance = 0.3;

  // @ts-ignore
  jest.spyOn(ragged, "getContext").mockResolvedValue(null);

  await expect(
   ragged.makeLlmRequest(
    message,
    conversation,
    prompt,
    pineconeIndex,
    minRelevance
   )
  ).rejects.toThrow("Context is not available");
 });

 describe("addContext", () => {
  it("should add context to Pinecone", async () => {
   const pineconeIndex = "test-index";
   const pineconeCloudRegion = "us-east-1";
   const context = ["context1", "context2"];
   const embedding = [0.1, 0.2, 0.3];
   const pinecone = {
    // @ts-expect-error
    listIndexes: jest.fn().mockResolvedValue({ indexes: [] }),
    createIndex: jest.fn(),
    Index: jest.fn().mockReturnValue({
     upsert: jest.fn(),
    }),
   };

   // @ts-ignore
   (getEmbeddings as jest.Mock).mockResolvedValue(embedding);
   (Pinecone as jest.Mock).mockImplementation(() => pinecone);

   const result = await ragged.addContext(
    pineconeIndex,
    pineconeCloudRegion,
    context
   );

   expect(pinecone.createIndex).toHaveBeenCalled();
   // @ts-expect-error
   expect(pinecone.Index(pineconeIndex).upsert).toHaveBeenCalledWith([
    { id: "key1", values: embedding, metadata: { text: "context1" } },
    { id: "key2", values: embedding, metadata: { text: "context2" } },
   ]);
   expect(result).toEqual({ success: true, message: "success" });
  });

  it("should return an error if no context is provided", async () => {
   const pineconeIndex = "test-index";
   const pineconeCloudRegion = "us-east-1";
   const context: string[] = [];

   const result = await ragged.addContext(
    pineconeIndex,
    pineconeCloudRegion,
    context
   );

   expect(result).toEqual({
    success: false,
    message: "whoops, no context found!",
   });
  });
 });
});
