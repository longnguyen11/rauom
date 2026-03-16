#!/usr/bin/env node

/**
 * Follow Pulley CipherSprint challenge links.
 *
 * Default mode is one step per run. The script stores the next URL in a state
 * file so you can run it repeatedly without copying URLs around.
 *
 * Examples:
 *   npm run ciphersprint -- --email you@example.com
 *   npm run ciphersprint -- --state-file .ciphersprint-state.json
 *   npm run ciphersprint -- --all --email you@example.com
 *   npm run ciphersprint -- --reset --email you@example.com
 */

import fs from "node:fs";
import process from "node:process";

const DEFAULT_MAX_STEPS = 100;
const DEFAULT_STATE_FILE = ".ciphersprint-state.json";
const DEFAULT_LOG_FILE = ".ciphersprint-progress.log";
const BASE_URL = "https://ciphersprint.pulley.com";

function parseArgs(argv) {
  const args = {
    startUrl: null,
    email: process.env.CIPHERSPRINT_EMAIL ?? null,
    maxSteps: DEFAULT_MAX_STEPS,
    verbose: false,
    all: false,
    reset: false,
    stateFile: DEFAULT_STATE_FILE,
    logFile: DEFAULT_LOG_FILE,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--start-url" && argv[i + 1]) {
      args.startUrl = argv[i + 1];
      i += 1;
      continue;
    }

    if (token === "--email" && argv[i + 1]) {
      args.email = argv[i + 1];
      i += 1;
      continue;
    }

    if (token === "--max-steps" && argv[i + 1]) {
      const parsed = Number.parseInt(argv[i + 1], 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        args.maxSteps = parsed;
      }
      i += 1;
      continue;
    }

    if (token === "--state-file" && argv[i + 1]) {
      args.stateFile = argv[i + 1];
      i += 1;
      continue;
    }

    if (token === "--log-file" && argv[i + 1]) {
      args.logFile = argv[i + 1];
      i += 1;
      continue;
    }

    if (token === "--verbose") {
      args.verbose = true;
      continue;
    }

    if (token === "--all") {
      args.all = true;
      continue;
    }

    if (token === "--reset") {
      args.reset = true;
      continue;
    }

    if (token === "--no-log") {
      args.logFile = null;
      continue;
    }
  }

  return args;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function decodeBase64(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = (4 - (normalized.length % 4)) % 4;
  const padded = `${normalized}${"=".repeat(padLength)}`;
  return Buffer.from(padded, "base64").toString("utf8");
}

function decodeHex(value) {
  const clean = value.replace(/^0x/i, "").replace(/\s+/g, "");
  if (!/^[0-9a-f]+$/i.test(clean)) {
    throw new Error("Hex payload contains non-hex characters.");
  }
  if (clean.length % 2 !== 0) {
    throw new Error("Hex payload has odd length.");
  }
  return Buffer.from(clean, "hex").toString("utf8");
}

function rotN(value, shift) {
  const normalizedShift = ((shift % 26) + 26) % 26;
  return value.replace(/[A-Za-z]/g, (char) => {
    const base = char <= "Z" ? 65 : 97;
    const code = char.charCodeAt(0) - base;
    return String.fromCharCode(((code + normalizedShift) % 26) + base);
  });
}

function decodeBinary(value) {
  const compact = value.replace(/\s+/g, "");
  const chunks = /^[01]+$/.test(compact)
    ? compact.match(/.{1,8}/g)
    : value.match(/[01]{8}/g);

  if (!chunks || chunks.length === 0) {
    throw new Error("Binary payload has no decodable bytes.");
  }

  if (chunks.some((chunk) => chunk.length !== 8)) {
    throw new Error("Binary payload is not byte-aligned.");
  }

  return String.fromCharCode(
    ...chunks.map((chunk) => Number.parseInt(chunk, 2)),
  );
}

function decodeAsciiCodes(value) {
  const parts = value
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map((part) => Number.parseInt(part, 10));

  if (parts.length === 0 || parts.some((n) => Number.isNaN(n))) {
    throw new Error("ASCII code payload is malformed.");
  }

  return String.fromCharCode(...parts);
}

function decodeAtbash(value) {
  return value.replace(/[A-Za-z]/g, (char) => {
    const isUpper = char <= "Z";
    const base = isUpper ? 65 : 97;
    const index = char.charCodeAt(0) - base;
    return String.fromCharCode(base + (25 - index));
  });
}

function swapAdjacentPairs(value) {
  const chars = value.split("");
  for (let i = 0; i < chars.length - 1; i += 2) {
    const temp = chars[i];
    chars[i] = chars[i + 1];
    chars[i + 1] = temp;
  }
  return chars.join("");
}

function rotateString(value, amount, direction) {
  if (value.length === 0) {
    return value;
  }

  const normalized = ((amount % value.length) + value.length) % value.length;
  if (normalized === 0) {
    return value;
  }

  if (direction === "left") {
    return `${value.slice(normalized)}${value.slice(0, normalized)}`;
  }

  if (direction === "right") {
    return `${value.slice(-normalized)}${value.slice(0, -normalized)}`;
  }

  throw new Error(`Unknown rotate direction: ${direction}`);
}

function decodeCustomHexCharacterSet(payload, methodText) {
  const charsetMatch = methodText.match(
    /custom hex character set\s+['"]?([^'"\s]+)['"]?/i,
  );
  if (!charsetMatch) {
    throw new Error(
      `Could not determine custom hex character set from: "${methodText}"`,
    );
  }

  const charset = charsetMatch[1];
  if (charset.length !== 16) {
    throw new Error(
      `Custom hex character set must be 16 characters, got ${charset.length}.`,
    );
  }

  const unique = new Set(charset);
  if (unique.size !== 16) {
    throw new Error("Custom hex character set contains duplicate characters.");
  }

  const map = new Map();
  for (let i = 0; i < charset.length; i += 1) {
    map.set(charset[i], i.toString(16));
  }

  let decoded = "";
  for (const ch of payload) {
    const nibble = map.get(ch);
    if (nibble === undefined) {
      throw new Error(
        `Custom hex payload contains char not in charset: "${ch}"`,
      );
    }
    decoded += nibble;
  }

  return decoded;
}

function parseMessagePackUintArray(buffer) {
  let offset = 0;

  if (buffer.length === 0) {
    throw new Error("MessagePack payload is empty.");
  }

  const readByte = () => {
    if (offset >= buffer.length) {
      throw new Error("Unexpected end of MessagePack payload.");
    }
    const value = buffer[offset];
    offset += 1;
    return value;
  };

  const readUInt16 = () => (readByte() << 8) | readByte();
  const readUInt32 = () =>
    ((readByte() << 24) >>> 0) | (readByte() << 16) | (readByte() << 8) | readByte();

  const readArrayLength = () => {
    const header = readByte();
    if ((header & 0xf0) === 0x90) {
      return header & 0x0f;
    }
    if (header === 0xdc) {
      return readUInt16();
    }
    if (header === 0xdd) {
      return readUInt32();
    }
    throw new Error(`Unsupported MessagePack array header: 0x${header.toString(16)}`);
  };

  const readUint = () => {
    const type = readByte();

    // Positive fixint
    if (type <= 0x7f) {
      return type;
    }

    if (type === 0xcc) {
      return readByte();
    }
    if (type === 0xcd) {
      return readUInt16();
    }
    if (type === 0xce) {
      return readUInt32();
    }

    throw new Error(`Unsupported MessagePack integer type: 0x${type.toString(16)}`);
  };

  const length = readArrayLength();
  const result = [];
  for (let i = 0; i < length; i += 1) {
    result.push(readUint());
  }

  return result;
}

function decodeScrambledByMessagePackPositions(payload, methodText) {
  const match = methodText.match(/messagepack:\s*([A-Za-z0-9+/=]+)/i);
  if (!match) {
    throw new Error(
      `Could not determine MessagePack payload from method: "${methodText}"`,
    );
  }

  const packed = Buffer.from(match[1], "base64");
  const positionsRaw = parseMessagePackUintArray(packed);

  if (positionsRaw.length !== payload.length) {
    throw new Error(
      `Position map length ${positionsRaw.length} does not match payload length ${payload.length}.`,
    );
  }

  const min = Math.min(...positionsRaw);
  const max = Math.max(...positionsRaw);

  let positions = positionsRaw;
  // Support both zero-based and one-based position maps.
  if (min === 1 && max === payload.length) {
    positions = positionsRaw.map((position) => position - 1);
  } else if (!(min === 0 && max === payload.length - 1)) {
    throw new Error("Position map is not zero-based or one-based contiguous range.");
  }

  const output = Array(payload.length);
  for (let i = 0; i < payload.length; i += 1) {
    output[positions[i]] = payload[i];
  }

  if (output.some((char) => char === undefined)) {
    throw new Error("Failed to unscramble payload due to missing positions.");
  }

  return output.join("");
}

function extractShift(methodText) {
  const text = methodText.toLowerCase();

  const rotMatch = text.match(/rot(?:ation)?\s*[-_ ]?\s*(-?\d{1,2})/i);
  if (rotMatch) {
    return Number.parseInt(rotMatch[1], 10);
  }

  const shiftMatch = text.match(/shift(?:ed)?(?:\s+by)?\s*(-?\d{1,2})/i);
  if (shiftMatch) {
    return Number.parseInt(shiftMatch[1], 10);
  }

  const byMatch = text.match(/\bby\s*(-?\d{1,2})\b/i);
  if (byMatch) {
    return Number.parseInt(byMatch[1], 10);
  }

  return null;
}

function decodeCircularRotation(payload, methodText) {
  const method = methodText.toLowerCase();
  const amountMatch = method.match(/\bby\s*(-?\d+)\b/);
  if (!amountMatch) {
    throw new Error(`Could not determine circular rotation amount from: "${methodText}"`);
  }

  const amount = Number.parseInt(amountMatch[1], 10);
  if (Number.isNaN(amount)) {
    throw new Error(`Circular rotation amount is invalid in: "${methodText}"`);
  }

  const encryptedDirection = method.includes("left")
    ? "left"
    : method.includes("right")
      ? "right"
      : null;

  if (!encryptedDirection) {
    throw new Error(`Could not determine circular rotation direction from: "${methodText}"`);
  }

  const decodeDirection = encryptedDirection === "left" ? "right" : "left";
  return rotateString(payload, amount, decodeDirection);
}

function decodePayload(payload, methodText) {
  const method = methodText.toLowerCase();

  if (
    method.includes("plain text") ||
    method.includes("not encrypted") ||
    method.includes("no encryption") ||
    method.includes("nothing")
  ) {
    return payload;
  }

  if (method.includes("custom hex character set")) {
    return decodeCustomHexCharacterSet(payload, methodText);
  }

  if (method.includes("scrambled") && method.includes("messagepack")) {
    return decodeScrambledByMessagePackPositions(payload, methodText);
  }

  if (method.includes("base64") || method.includes("base 64")) {
    return decodeBase64(payload);
  }

  if (method.includes("hex")) {
    return decodeHex(payload);
  }

  if (
    (method.includes("url") || method.includes("percent")) &&
    method.includes("encod")
  ) {
    return decodeURIComponent(payload);
  }

  if (method.includes("reverse")) {
    return payload.split("").reverse().join("");
  }

  if (
    (method.includes("swap") || method.includes("swapped")) &&
    method.includes("pair")
  ) {
    return swapAdjacentPairs(payload);
  }

  if (
    method.includes("circular") &&
    (method.includes("rotat") || method.includes("shift"))
  ) {
    return decodeCircularRotation(payload, methodText);
  }

  if (method.includes("atbash")) {
    return decodeAtbash(payload);
  }

  if (method.includes("ascii")) {
    return decodeAsciiCodes(payload);
  }

  if (method.includes("binary")) {
    return decodeBinary(payload);
  }

  if (method.includes("rot13")) {
    return rotN(payload, 13);
  }

  if (
    method.includes("caesar") ||
    /\brot[-_ ]?\d{1,2}\b/.test(method) ||
    method.includes("shift")
  ) {
    const shift = extractShift(methodText);
    if (shift === null) {
      throw new Error(`Could not determine Caesar shift from: "${methodText}"`);
    }
    return rotN(payload, shift);
  }

  throw new Error(`Unsupported encryption method: "${methodText}"`);
}

function decodeNextPath(encryptedPath, methodText) {
  const firstUnderscore = encryptedPath.indexOf("_");

  if (firstUnderscore === -1) {
    return decodePayload(encryptedPath, methodText);
  }

  const prefix = encryptedPath.slice(0, firstUnderscore);
  const payload = encryptedPath.slice(firstUnderscore + 1);
  const decodedPayload = decodePayload(payload, methodText);

  if (
    decodedPayload.startsWith("task_") ||
    decodedPayload.startsWith("/") ||
    decodedPayload.startsWith("http://") ||
    decodedPayload.startsWith("https://")
  ) {
    return decodedPayload;
  }

  return `${prefix}_${decodedPayload}`;
}

function buildNextUrl(currentUrl, nextPath) {
  if (/^https?:\/\//i.test(nextPath)) {
    return nextPath;
  }
  return new URL(nextPath, currentUrl).toString();
}

function readState(stateFile) {
  try {
    if (!fs.existsSync(stateFile)) {
      return null;
    }
    const text = fs.readFileSync(stateFile, "utf8");
    const parsed = safeJsonParse(text);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function saveState(stateFile, state) {
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf8");
}

function clearState(stateFile) {
  if (fs.existsSync(stateFile)) {
    fs.unlinkSync(stateFile);
  }
}

function appendProgressLog(options, entry) {
  if (!options.logFile) {
    return;
  }

  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${entry}\n`;
  fs.appendFileSync(options.logFile, line, "utf8");
}

function clearProgressLog(options) {
  if (!options.logFile) {
    return;
  }

  if (fs.existsSync(options.logFile)) {
    fs.unlinkSync(options.logFile);
  }
}

function getStartUrlFromEmail(email) {
  return `${BASE_URL}/${encodeURIComponent(email)}`;
}

function resolveInitialUrl(options) {
  if (options.startUrl) {
    return options.startUrl;
  }

  if (!options.reset) {
    const state = readState(options.stateFile);
    if (state && typeof state.nextUrl === "string" && state.nextUrl.length > 0) {
      return state.nextUrl;
    }
  }

  if (options.email) {
    return getStartUrlFromEmail(options.email);
  }

  throw new Error(
    "No URL to run. Pass --email, --start-url, or use an existing state file.",
  );
}

function printStepHeader(step, url, payload) {
  console.log(`\n[Step ${step}] GET ${url}`);
  if (payload.level !== undefined) {
    console.log(`Level: ${payload.level}`);
  }
  if (payload.encryption_method) {
    console.log(`Method: ${payload.encryption_method}`);
  }
  if (payload.expires_in) {
    console.log(`Expires: ${payload.expires_in}`);
  }
}

function printResponseDump(response, bodyText) {
  const headers = Object.fromEntries(response.headers.entries());
  console.log(`HTTP: ${response.status} ${response.statusText}`.trim());
  console.log("Headers:");
  console.log(JSON.stringify(headers, null, 2));
  console.log("Body:");
  console.log(bodyText.length > 0 ? bodyText : "(empty)");
}

async function runStep(step, currentUrl, options) {
  appendProgressLog(
    options,
    `STEP ${step} REQUEST ${JSON.stringify({ url: currentUrl }, null, 2)}`,
  );

  const response = await fetch(currentUrl, { method: "GET" });
  const bodyText = await response.text();
  const headers = Object.fromEntries(response.headers.entries());

  appendProgressLog(
    options,
    `STEP ${step} RESPONSE ${JSON.stringify(
      {
        url: currentUrl,
        status: response.status,
        statusText: response.statusText,
        headers,
        body: bodyText,
      },
      null,
      2,
    )}`,
  );

  if (options.verbose) {
    printResponseDump(response, bodyText);
  }

  const json = safeJsonParse(bodyText);

  if (!response.ok) {
    appendProgressLog(
      options,
      `STEP ${step} ERROR ${JSON.stringify(
        {
          url: currentUrl,
          status: response.status,
          body: bodyText,
        },
        null,
        2,
      )}`,
    );

    return {
      ok: false,
      status: response.status,
      bodyText,
    };
  }

  if (!json) {
    return {
      ok: true,
      done: true,
      rawBody: bodyText,
    };
  }

  appendProgressLog(
    options,
    `STEP ${step} PARSED_JSON ${JSON.stringify(json, null, 2)}`,
  );

  printStepHeader(step, currentUrl, json);
  if (options.verbose) {
    console.log("Parsed JSON:");
    console.log(JSON.stringify(json, null, 2));
  }

  const hasNext =
    typeof json.encrypted_path === "string" &&
    typeof json.encryption_method === "string";

  if (!hasNext) {
    appendProgressLog(
      options,
      `STEP ${step} TERMINAL ${JSON.stringify(json, null, 2)}`,
    );

    return {
      ok: true,
      done: true,
      payload: json,
    };
  }

  let nextPath;
  try {
    nextPath = decodeNextPath(json.encrypted_path, json.encryption_method);
  } catch (error) {
    appendProgressLog(
      options,
      `STEP ${step} DECODE_ERROR ${JSON.stringify(
        {
          encryptedPath: json.encrypted_path,
          encryptionMethod: json.encryption_method,
          message: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      )}`,
    );
    throw error;
  }

  const nextUrl = buildNextUrl(currentUrl, nextPath);

  appendProgressLog(
    options,
    `STEP ${step} NEXT ${JSON.stringify(
      {
        nextPath,
        nextUrl,
      },
      null,
      2,
    )}`,
  );

  return {
    ok: true,
    done: false,
    payload: json,
    nextPath,
    nextUrl,
  };
}

async function runSingleStep(startUrl, options) {
  appendProgressLog(options, `RUN START ${JSON.stringify({ mode: "single-step", startUrl }, null, 2)}`);
  const result = await runStep(1, startUrl, options);

  if (!result.ok) {
    console.error(`\nRequest failed: ${result.status}`);
    if (result.bodyText) {
      console.error(result.bodyText);
    }
    process.exitCode = 1;
    appendProgressLog(options, "RUN END failure");
    return;
  }

  if (result.done) {
    clearState(options.stateFile);
    console.log("\nFinished this challenge chain.");
    if (result.payload) {
      console.log(JSON.stringify(result.payload, null, 2));
    } else if (result.rawBody) {
      console.log(result.rawBody);
    }
    appendProgressLog(options, "RUN END success terminal");
    return;
  }

  saveState(options.stateFile, {
    nextUrl: result.nextUrl,
    nextPath: result.nextPath,
    level: result.payload?.level ?? null,
    updatedAt: new Date().toISOString(),
  });

  console.log(`Next path: ${result.nextPath}`);
  console.log(`Next URL: ${result.nextUrl}`);
  console.log(`Saved state: ${options.stateFile}`);
  console.log("Run the same command again for the next single step.");
  appendProgressLog(
    options,
    `RUN END success next ${JSON.stringify({ nextUrl: result.nextUrl }, null, 2)}`,
  );
}

async function runAll(startUrl, options) {
  appendProgressLog(options, `RUN START ${JSON.stringify({ mode: "all-steps", startUrl }, null, 2)}`);
  let currentUrl = startUrl;

  for (let step = 1; step <= options.maxSteps; step += 1) {
    const result = await runStep(step, currentUrl, options);

    if (!result.ok) {
      console.error(`\nRequest failed at step ${step}: ${result.status}`);
      if (result.bodyText) {
        console.error(result.bodyText);
      }
      process.exitCode = 1;
      appendProgressLog(options, `RUN END failure step ${step}`);
      return;
    }

    if (result.done) {
      clearState(options.stateFile);
      console.log("\nFinished this challenge chain.");
      if (result.payload) {
        console.log(JSON.stringify(result.payload, null, 2));
      } else if (result.rawBody) {
        console.log(result.rawBody);
      }
      appendProgressLog(options, "RUN END success terminal");
      return;
    }

    console.log(`Next path: ${result.nextPath}`);
    console.log(`Next URL: ${result.nextUrl}`);

    currentUrl = result.nextUrl;
  }

  console.error("\nStopped: reached max steps before terminal response.");
  process.exitCode = 1;
  appendProgressLog(options, `RUN END failure max-steps ${options.maxSteps}`);
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  try {
    if (options.reset) {
      clearState(options.stateFile);
      clearProgressLog(options);
    }

    const startUrl = resolveInitialUrl(options);

    console.log(`Starting URL: ${startUrl}`);
    console.log(`Mode: ${options.all ? "all-steps" : "single-step"}`);
    if (options.logFile) {
      console.log(`Log file: ${options.logFile}`);
    }
    if (!options.all) {
      console.log(`State file: ${options.stateFile}`);
    }

    if (options.all) {
      await runAll(startUrl, options);
      return;
    }

    await runSingleStep(startUrl, options);
  } catch (error) {
    appendProgressLog(
      options,
      `FATAL ${JSON.stringify(
        {
          message: error instanceof Error ? error.message : String(error),
        },
        null,
        2,
      )}`,
    );
    throw error;
  }
}

run().catch((error) => {
  console.error("Fatal error:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
