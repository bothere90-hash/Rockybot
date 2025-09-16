const fs = require("fs");
const path = require("path");

const LOCKS_FILE = path.join(__dirname, "..", "..", "locks.json");
function loadLocks() {
  try {
    if (!fs.existsSync(LOCKS_FILE)) return { threads: {} };
    return JSON.parse(fs.readFileSync(LOCKS_FILE, "utf8") || "{}");
  } catch {
    return { threads: {} };
  }
}
function saveLocks(data) {
  fs.writeFileSync(LOCKS_FILE, JSON.stringify(data, null, 2));
}
function ensureThread(threadID) {
  const data = loadLocks();
  if (!data.threads[threadID]) data.threads[threadID] = { gclock: { enabled: false, title: "" } };
  saveLocks(data);
  return data.threads[threadID];
}

module.exports.config = {
  name: "gclock",
  version: "1.0",
  hasPermission: 1,
  credits: "Anurag Mishra",
  description: "Lock group name to a fixed title",
  commandCategory: "group",
  usages: "[title/off]",
  cooldowns: 5,
};

module.exports.run = async ({ api, event, args }) => {
  const data = loadLocks();
  const tRec = ensureThread(event.threadID);

  if (!args[0]) {
    return api.sendMessage(
      `Group name lock: ${tRec.gclock.enabled ? `ON — "${tRec.gclock.title}"` : "OFF"}`,
      event.threadID
    );
  }

  if (args[0].toLowerCase() === "off") {
    tRec.gclock.enabled = false;
    tRec.gclock.title = "";
    data.threads[event.threadID] = tRec;
    saveLocks(data);
    return api.sendMessage("✅ Group name lock disabled.", event.threadID);
  }

  const title = args.join(" ");
  tRec.gclock.enabled = true;
  tRec.gclock.title = title;
  data.threads[event.threadID] = tRec;
  saveLocks(data);

  api.setTitle(title, event.threadID, (err) => {
    if (err) return api.sendMessage("Bot admin nahi hai, title set nahi kar paaya.", event.threadID);
    api.sendMessage(`✅ Group name locked to "${title}"`, event.threadID);
  });
};
