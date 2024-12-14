# RagState

## Intro

Hey! RagState is a super-simple abstraction for hooking up a vector database to an LLM so you can harness the power of LLMs with your own data. Building a chatbot for a restaurant, garage, or maybe even a vehicle rental company? RagState makes it simple by exposing 2 fundamental methods.

BEFORE READING ON:

You're going to need an openAi account with sufficient funding to make api calls (don't worry, it's no more expensive than your usual openAi calls), and a [pinecone account](https://www.pinecone.io/?utm_term=pinecone%20database&utm_campaign=brand-eu&utm_source=adwords&utm_medium=ppc&hsa_acc=3111363649&hsa_cam=21023356007&hsa_grp=156209469342&hsa_ad=690982079000&hsa_src=g&hsa_tgt=kwd-1627713670725&hsa_kw=pinecone%20database&hsa_mt=e&hsa_net=adwords&hsa_ver=3&gad_source=1&gclid=CjwKCAiA9vS6BhA9EiwAJpnXw_Qwb4N6pJw9QTMTpHXncqQPoj_zkgcGzzoT5hLm_T6qJpjcIiC_DxoCrDIQAvD_BwE).

## Quick-start

To get started, import ragstate and instatiate it:

`import { RagState } from "ragstate";`

`const openaiToken = 'abc123';`
`const pineconeKey = '123abc';`

`const ragState = new RagState(openaiToken, pineconeKey);`

`const response = await ragState.addContext("fun-facts", "us-east-1", [
"RagState is a really simple way to build context enabled chat agents!",
]);`

`console.log(response);`

once you've done that you can make your first call to the LLM:

`const output = await ragState.makeLlmRequest(`

`"tell me something cool about RagState", // current question`

`[`

`{
id: "1",
role: "user",
content: "hello llm!",
},`
`], // conversation history`

`"", // the system prompt you wish to add (we add our own by default if omitted)`

`"my-index", // your pinecone index`

`0.1 // min relevance`

`"gpt-3.5-turbo" // your chosen llm`
`);`

`console.log(output);`

## addContext

It does exactly what it says on the tin! this method will add context entries to your pinecone index (and create you the index if it doesn't exist). It takes 3 arguments:

`pineconeIndex` : the string name of your pinecone index that you wish to add the entry to.

`pineconeCloudRegion` : the AWS region your vector db is hosted in (us-east-1 is the pinecone default).

`context`: this is the new entries you wish to put into your vector db. For now it simply takes an array of strings, which will be uploaded as separate entries. However, we will be including all sorts of filetypes in future....

## makeLlmRequest

This method takes all the admin out of making a context-supported LLM call. It will provide you with a response from gpt-3.5-turbo (other models will be added soon, along with response-streaming) customised to your data. It requires:

`message`: the current user question (or latest entry in the conversation).

`conversation`: this is the conversation history, and takes the form of an array of ai message objects ({role, content, id}).

`prompt`: this is an optional argument that enables you to provide the 'system' arguments to the LLM. For example, asking it to answer in the style of a comedy pirate, or whatever floats your boat....

`pineconeIndex`: this is the index within your pinecone account that you wish to draw context from.

`minRelevance`: this should be a number between -1 and 1. It is a scale that tailors how relevant a vector db entry must be to be included in the context. -1 would mean all entries would be included, 1 would mean that none would as it would be too stringent. 0.3 is the default.

`model`: The GPT model you wish to use. We support gpt-3.5-turbo, gpt-4o and gpt-4o-mini.

## getContext

For more advanced users we've also exposed a getContext method, this will return relevant vector documents without passing them to the LLM, so you can manage this stage yourself should you wish. You'll need to provide the user message, pineconeIndex and minRelevance.

## ChangeLog

v1.0.4: first public release  
v1.0.5: added support for model selection
v1.0.6: README improvements
