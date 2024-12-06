import {
 Pinecone,
 type ScoredPineconeRecord,
} from "@pinecone-database/pinecone";

export type Metadata = {
 url: string;
 text: string;
 chunk: string;
 hash: string;
};

export const getMatchesFromEmbeddings = async (
 pineconeKey: string,
 pineconeIndex: string,
 embeddings: number[],
 topK: number
): Promise<ScoredPineconeRecord<Metadata>[]> => {
 const pinecone = new Pinecone({ apiKey: pineconeKey });

 if (!pineconeIndex) {
  throw new Error("db index not provided");
 }

 // check the index exists in pinecone
 const indexes = (await pinecone.listIndexes())?.indexes;
 if (!indexes || indexes.filter((i) => i.name === pineconeIndex).length !== 1) {
  throw new Error(`Index ${pineconeIndex} does not exist`);
 }

 const index = pinecone!.Index<Metadata>(pineconeIndex);

 const pineconeNamespace = index.namespace("");

 try {
  const queryResult = await pineconeNamespace.query({
   vector: embeddings,
   topK,
   includeMetadata: true,
  });
  return queryResult.matches || [];
 } catch (e) {
  console.log("Error getting matches: ", e);
  throw new Error(`Error getting matches: ${e}`);
 }
};
