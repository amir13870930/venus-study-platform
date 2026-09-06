const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

const DATA_DIR = path.join(__dirname, "data");
const STATE_FILE = path.join(DATA_DIR, "state.json");
const PUBLIC_DIR = path.join(__dirname, "public");

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

function ensureStorage() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(STATE_FILE, "{}", "utf8");
  }
}

function readState() {
  ensureStorage();

  try {
    const text = fs.readFileSync(STATE_FILE, "utf8").trim();
    return text ? JSON.parse(text) : {};
  } catch (error) {
    console.error("Could not read state:", error);
    return {};
  }
}

function writeState(state) {
  ensureStorage();
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify(state, null, 2),
    "utf8"
  );
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "venus-study-platform"
  });
});

app.get("/api/bootstrap", (req, res) => {
  res.json(readState());
});

app.get("/api/state/:key", (req, res) => {
  const state = readState();
  const key = req.params.key;

  res.json({
    key,
    value: Object.prototype.hasOwnProperty.call(state, key)
      ? state[key]
      : null
  });
});

app.put("/api/state/:key", (req, res) => {
  const key = req.params.key;

  if (!req.body || !Object.prototype.hasOwnProperty.call(req.body, "value")) {
    return res.status(400).json({
      ok: false,
      error: "value is required"
    });
  }

  const state = readState();
  state[key] = req.body.value;
  writeState(state);

  res.json({ ok: true, key });
});

app.post("/api/state/:key", (req, res) => {
  const key = req.params.key;

  if (!req.body || !Object.prototype.hasOwnProperty.call(req.body, "value")) {
    return res.status(400).json({
      ok: false,
      error: "value is required"
    });
  }

  const state = readState();
  state[key] = req.body.value;
  writeState(state);

  res.json({ ok: true, key });
});

app.use(express.static(PUBLIC_DIR));

app.get("*", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

ensureStorage();

app.listen(PORT, HOST, () => {
  console.log(`Venus Study Platform running on port ${PORT}`);
});
