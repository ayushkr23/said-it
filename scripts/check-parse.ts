import { readFileSync, writeFileSync } from "node:fs";
import { parseWhatsApp } from "../src/lib/whatsapp.ts";
import { defaultToday, findPromises } from "../src/lib/promises.ts";

const file = "public/sample/WhatsApp Chat with DBMS Project 🦥.txt";
const chat = parseWhatsApp(readFileSync(file, "utf8"), file.split("/").pop());
console.log("chat:", chat.chatName, "| messages:", chat.messages.length, "| senders:", chat.senders.join(", "));

if (process.argv.includes("--run")) {
  const today = defaultToday(chat);
  const verdict = await findPromises({
    chat,
    me: "Ayush",
    today,
    model: process.env.MODEL ?? "gemma3:4b",
    onStep: (s, info) => console.log("step:", s, info ?? ""),
  });
  console.log(JSON.stringify(verdict, null, 2));
  if (process.argv.includes("--save")) {
    writeFileSync("src/data/recorded.json", JSON.stringify(verdict, null, 2));
    console.log("saved src/data/recorded.json");
  }
}
