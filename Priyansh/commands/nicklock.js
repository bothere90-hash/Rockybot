const fs = require("fs");
const path = require("path");
const config = require("../../config.json"); 

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
  if (!data.threads[threadID]) data.threads[threadID] = { nicklock: { enabled: false, name: "" } };
  saveLocks(data);
  return data.threads[threadID];
}

module.exports.config = {
  name: "nicklock",
  version: "1.0",
  hasPermission: 1,
  credits: "Anurag Mishra",
  description: "Lock all nicknames (admin only)",
  commandCategory: "group",
  usages: "[name/off]",
  cooldowns: 5,
};

module.exports.run = async ({ api, event, args }) => {
  if (event.senderID !== config.ADMIN_UID) {
    return api.sendMessage("❌ Bhai ye command sirf admin ke liye hai.", event.threadID);
  }

  const data = loadLocks();
  const tRec = ensureThread(event.threadID);

  if (!args[0]) {
    return api.sendMessage(
      `Nickname lock: ${tRec.nicklock.enabled ? `ON — "${tRec.nicklock.name}"` : "OFF"}`,
      event.threadID
    );
  }

  if (args[0].toLowerCase() === "off") {
    tRec.nicklock.enabled = false;
    tRec.nicklock.name = "";
    data.threads[event.threadID] = tRec;
    saveLocks(data);
    return api.sendMessage("✅ Nickname lock disabled.", event.threadID);
  }

  const name = args.join(" ");
  tRec.nicklock.enabled = true;
  tRec.nicklock.name = name;
  data.threads[event.threadID] = tRec;
  saveLocks(data);

  api.getThreadInfo(event.threadID, (err, info) => {
    if (err) return api.sendMessage("Thread info error.", event.threadID);
    const members = info.participantIDs;
    members.forEach((uid) => api.changeNickname(name, uid, event.threadID));
    api.sendMessage(`✅ Nickname lock enabled. All set to "${name}"`, event.threadID);
  });
};
