const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion,
makeCacheableSignalKeyStore,
downloadMediaMessage
} = require("@whiskeysockets/baileys");

const P = require("pino");
const readline = require("readline");
const fs = require("fs-extra");
const { Sticker } = require("wa-sticker-formatter");
const yts = require("yt-search");
const ytdl = require("ytdl-core");

const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
});

async function question(text) {
return new Promise((resolve) => {
rl.question(text, resolve);
});
}

async function startBot() {

const { state, saveCreds } =
await useMultiFileAuthState("./session");

const { version } =
await fetchLatestBaileysVersion();

const sock = makeWASocket({
version,
logger: P({ level: "silent" }),
printQRInTerminal: false,

auth: {
creds: state.creds,
keys: makeCacheableSignalKeyStore(
state.keys,
P({ level: "silent" })
)
}
});

/* PAIR CODE */

if (!sock.authState.creds.registered) {

const phoneNumber =
await question("📱 Enter Number : ");

const code =
await sock.requestPairingCode(phoneNumber);

console.log(`\n✅ PAIR CODE : ${code}\n`);

}

/* CONNECTION */

sock.ev.on("connection.update", async (update) => {

const {
connection,
lastDisconnect
} = update;

if (connection === "open") {

console.log("✅ DARK-KING-MD Connected");

}

if (connection === "close") {

const shouldReconnect =
lastDisconnect?.error?.output?.statusCode !==
DisconnectReason.loggedOut;

if (shouldReconnect) {
startBot();
}

}

});

/* AUTO STATUS SEEN */

sock.ev.on("messages.upsert", async ({ messages }) => {

const msg = messages[0];

if (!msg.message) return;

try {

if (msg.key.remoteJid === "status@broadcast") {

await sock.readMessages([msg.key]);

console.log("✅ Status Seen");

return;

}

} catch (e) {
console.log(e);
}

});

/* SAVE SESSION */

sock.ev.on("creds.update", saveCreds);

/* MESSAGE EVENTS */

sock.ev.on("messages.upsert", async ({ messages }) => {

const msg = messages[0];

if (!msg.message) return;

const sender = msg.key.remoteJid;

const messageText =
msg.message.conversation ||
msg.message.extendedTextMessage?.text;

console.log("Message :", messageText);

/* AUTO VOICE REPLY */

if (!msg.key.fromMe) {

/* HI */

if (
messageText?.toLowerCase() === "hi"
) {

await sock.sendMessage(sender, {
audio: {
url: "https://files.catbox.moe/5de5tx.mp3"
},
mimetype: "audio/mp4",
ptt: true
});

}

/* BYE */

if (
messageText?.toLowerCase() === "bye"
) {

await sock.sendMessage(sender, {
audio: {
url: "https://files.catbox.moe/7l9g1f.mp3"
},
mimetype: "audio/mp4",
ptt: true
});

}

/* GOOD MORNING */

if (
messageText?.toLowerCase() === "gm" ||
messageText?.toLowerCase() === "good morning"
) {

await sock.sendMessage(sender, {
audio: {
url: "https://files.catbox.moe/u8d7h1.mp3"
},
mimetype: "audio/mp4",
ptt: true
});

}

/* GOOD NIGHT */

if (
messageText?.toLowerCase() === "gn" ||
messageText?.toLowerCase() === "good night"
) {

await sock.sendMessage(sender, {
audio: {
url: "https://files.catbox.moe/h0x2r4.mp3"
},
mimetype: "audio/mp4",
ptt: true
});

}

}

/* MENU */

if (messageText?.toLowerCase() === ".menu") {

await sock.sendMessage(sender, {
text:
`🌟 DARK-KING-MD MENU 🌟

╭────────────◇
│ .alive
│ .ping
│ .owner
│ .s
│ .song
│ .video
╰────────────◇

🎵 .song faded
🎬 .video faded`
});

}

/* ALIVE */

if (messageText?.toLowerCase() === ".alive") {

await sock.sendMessage(sender, {
text:
`🤖 DARK-KING-MD

🟢 Status : Online
⚡ Mode : Public
👑 Owner : Rukshan`
});

}

/* PING */

if (messageText?.toLowerCase() === ".ping") {

await sock.sendMessage(sender, {
text: "⚡ Pong"
});

}

/* OWNER */

if (messageText?.toLowerCase() === ".owner") {

await sock.sendMessage(sender, {
text: "👑 Owner : Rukshan"
});

}

/* STICKER COMMAND */

if (
messageText?.toLowerCase() === ".s" &&
msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
) {

try {

const quoted =
msg.message.extendedTextMessage.contextInfo;

const buffer = await downloadMediaMessage(
{
message: quoted.quotedMessage
},
"buffer",
{},
{
logger: P({ level: "silent" }),
reuploadRequest: sock.updateMediaMessage
}
);

const sticker = new Sticker(buffer, {
pack: "DARK-KING-MD",
author: "Rukshan",
type: "full"
});

const stickerBuffer =
await sticker.toBuffer();

await sock.sendMessage(sender, {
sticker: stickerBuffer
});

} catch (e) {

console.log(e);

await sock.sendMessage(sender, {
text: "❌ Sticker Failed"
});

}

}

/* SONG DOWNLOAD */

if (messageText?.startsWith(".song ")) {

try {

const query = messageText.slice(6);

await sock.sendMessage(sender, {
text: "🔍 Searching Song..."
});

const search = await yts(query);

const video = search.videos[0];

if (!video) {

return sock.sendMessage(sender, {
text: "❌ Song Not Found"
});

}

const stream = ytdl(video.url, {
filter: "audioonly"
});

const path = "./song.mp3";

const writeStream =
fs.createWriteStream(path);

stream.pipe(writeStream);

writeStream.on("finish", async () => {

await sock.sendMessage(sender, {
audio: fs.readFileSync(path),
mimetype: "audio/mp4",
ptt: false
});

fs.unlinkSync(path);

});

} catch (e) {

console.log(e);

await sock.sendMessage(sender, {
text: "❌ Song Download Failed"
});

}

}

/* VIDEO DOWNLOAD */

if (messageText?.startsWith(".video ")) {

try {

const query = messageText.slice(7);

await sock.sendMessage(sender, {
text: "🔍 Searching Video..."
});

const search = await yts(query);

const video = search.videos[0];

if (!video) {

return sock.sendMessage(sender, {
text: "❌ Video Not Found"
});

}

const stream = ytdl(video.url, {
filter: "videoandaudio"
});

const path = "./video.mp4";

const writeStream =
fs.createWriteStream(path);

stream.pipe(writeStream);

writeStream.on("finish", async () => {

await sock.sendMessage(sender, {
video: fs.readFileSync(path),
caption: `🎬 ${video.title}`
});

fs.unlinkSync(path);

});

} catch (e) {

console.log(e);

await sock.sendMessage(sender, {
text: "❌ Video Download Failed"
});

}

}

});

}

startBot();
