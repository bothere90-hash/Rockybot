const fs = require("fs");
const path = require("path");

const LOCKS_FILE = path.join(__dirname, "..", "locks.json");

function loadLocks() {
  try {
    if (!fs.existsSync(LOCKS_FILE)) return { threads: {} };
    return JSON.parse(fs.readFileSync(LOCKS_FILE, "utf8") || "{}");
  } catch {
    return { threads: {} };
  }
}

module.exports.config = {
  name: "groupProtect",
  eventType: ["log:thread-name", "log:user-nickname"],
  version: "1.0",
  credits: "Anurag Mishra",
};

module.exports.run = async ({ api, event }) => {
  const data = loadLocks();
  const tRec = data.threads[event.threadID];
  if (!tRec) return;

  // 🔒 Group name protection
  if (event.logMessageType === "log:thread-name" && tRec.gclock && tRec.gclock.enabled) {
    if (event.logMessageData && event.logMessageData.name !== tRec.gclock.title) {
      api.setTitle(tRec.gclock.title, event.threadID);
      api.sendMessage("🔒 Group name lock active! Wapas original title set kar diya.", event.threadID);
    }
  }

  // 🔒 Nickname protection
  if (event.logMessageType === "log:user-nickname" && tRec.nicklock && tRec.nicklock.enabled) {
    const uid = event.logMessageData.id;
    if (event.logMessageData.nickname !== tRec.nicklock.name) {
      api.changeNickname(tRec.nicklock.name, event.threadID, uid);
      api.sendMessage("🔒 Nickname lock active! Wapas original nickname set kar diya.", event.threadID);
    }
  }
};
