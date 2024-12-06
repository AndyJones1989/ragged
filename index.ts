import { Ragged } from "./ragged/class";

const open = "";
const pine = "";
const ragged = new Ragged(open, pine);

async function main() {
 const output = await ragged.makeLlmRequest(
  "tell me something cool about Peachy",
  [
   {
    id: "1",
    role: "user",
    content: "wow, nice to meet you!",
   },
  ],
  "",
  "cat-peach",
  0.1
 );

 console.log(output);
}

main();
