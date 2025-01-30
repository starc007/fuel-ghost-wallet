import fs from "fs/promises";
import path from "path";

const STORAGE_FILE = path.join(process.cwd(), "authenticators.json");

// Initialize storage file if it doesn't exist
async function initStorage() {
  try {
    await fs.access(STORAGE_FILE);
  } catch {
    await fs.writeFile(STORAGE_FILE, JSON.stringify({}));
  }
}

async function readStorage() {
  await initStorage();
  const data = await fs.readFile(STORAGE_FILE, "utf8");
  return JSON.parse(data);
}

async function writeStorage(data) {
  await fs.writeFile(STORAGE_FILE, JSON.stringify(data, null, 2));
}

export async function saveAuthenticator(userId, authenticator) {
  const data = await readStorage();
  data[userId] = authenticator;
  await writeStorage(data);
  console.log("Saved to storage:", data[userId]);
}

export async function getAuthenticator(userId) {
  const data = await readStorage();
  const authenticator = data[userId];
  console.log("Retrieved from storage:", authenticator);
  return authenticator;
}

export async function saveChallenge(userId, challenge) {
  const data = await readStorage();
  data[`${userId}_challenge`] = challenge;
  await writeStorage(data);
}

export async function getChallenge(userId) {
  const data = await readStorage();
  return data[`${userId}_challenge`];
}
