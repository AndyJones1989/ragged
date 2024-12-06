import { Ragged } from "./ragged/class";

const open = "";

const pine = "";
const ragged = new Ragged(open, pine);

ragged.makeLlmRequest(
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
