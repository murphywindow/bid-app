const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const OWNER = process.env.GH_OWNER;
const REPO = process.env.GH_REPO;
const TOKEN = process.env.GH_TOKEN;
const FILE_PATH = "data/projects.json";

const apiBase = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;

async function getFile() {
  const res = await fetch(apiBase, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  const json = await res.json();
  return {
    sha: json.sha,
    data: JSON.parse(Buffer.from(json.content, "base64").toString())
  };
}

async function saveFile(data, sha, message) {
  await fetch(apiBase, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(JSON.stringify(data, null, 2)).toString("base64"),
      sha
    })
  });
}

app.get("/api/projects", async (_, res) => {
  try {
    const file = await getFile();
    res.json(file.data);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.post("/api/projects", async (req, res) => {
  try {
    const file = await getFile();
    file.data.push(req.body);
    await saveFile(file.data, file.sha, "Add project");
    res.sendStatus(201);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.listen(3000);
