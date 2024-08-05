const express = require("express");
const fs = require("fs");
const { randomUUID } = require("crypto");
const { get_audio_from_elevenlabs } = require("./eleven-labs");
const { chatGPT_key } = require("./api_keys");

const app = express();
const port = 3000;
const api = "/api/v1";

const body_parser = require("body-parser");
var json_parser = body_parser.json();

const base_dir = "./content";
const description_file = "description.txt";
const audio_file = "output.mp3";

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

app.post(api + "/describe", json_parser, async (req, res) => {
  const reqBody = req.body;
  const location = "location";

  if (Object.keys(req.query).length === 0) {
    res.status(500).json({
      message: `Invalid request, query parameter '${location}' does not exist in payload`,
    });
    return;
  }
  var locationName = req.query.name;
  var descriptionType = req.query.type;

  var chatgptQuery = `Give me a ${descriptionType} description about ${locationName}. Please respond only with the description itself.`;

  console.log(chatgptQuery);
  const apiUrl = "https://api.openai.com/v1/chat/completions";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${chatGPT_key}`,
  };

  const data = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: chatgptQuery }],
  };

  const options = {
    method: "POST",
    headers: headers,
    body: JSON.stringify(data),
  };

  fetch(apiUrl, options)
    .then((response) => {
      console.log("ChatGPT");
      // console.log("Headers: ", response.headers);

      switch (response.status) {
        case 404:
          throw Error("URL not found");
        case 429:
          throw Error("Too many requests");
        default:
          console.log("Status: ", response.status);
      }

      return response.json();
    })
    .then(async (responseData) => {
      console.log("Fetched data: ", responseData);
      const chatgpt_answer = responseData["choices"][0]["message"]["content"];
      console.log(chatgpt_answer);

      const uuid = randomUUID();
      console.log("Generated UUID: ", uuid);

      // by responding this late there will be a considerable delay
      // we can't respond earlier because we can't guarantee that the files exists
      // we need to improve the API for polling results
      // GET /api/v1/status/{uuid}
      // 201 Resource created
      // 425 Too early

      // create ./content/{uuid} folder
      const folder = base_dir + "/" + uuid;
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
      }

      // create ./content/{uuid}/description.txt
      const description_file_path = folder + "/" + description_file;
      fs.writeFileSync(description_file_path, chatgpt_answer);

      // create audio file
      const audio_file_path = folder + "/" + audio_file;
      await get_audio_from_elevenlabs(chatgpt_answer, audio_file_path);

      res.status(200).json({ id: uuid });
    })
    .catch((error) => {
      console.error("Fetch error: ", error);
      res.status(500).json({ message: "Server not available" });
    });
});

app.get(api + "/text/:uuid", async (req, res) => {
  if (Object.keys(req.params).length === 0 || req.params.uuid == "") {
    res.status(500).json({
      message: `Missing 'uuid' path parameter`,
    });
    return;
  }

  const url_uuid = req.params.uuid;
  const txt_file = base_dir + "/" + url_uuid + "/" + description_file;

  fs.readFile(txt_file, "utf-8", (err, data) => {
    if (err) {
      res.status(404).json({ description: data });
      console.error("Failed to read file because:", err);
      return;
    }
    res.status(200).json({ description: data });
  });
});

app.get(api + "/audio/:uuid", async (req, res) => {
  if (Object.keys(req.params).length === 0 || req.params.uuid == "") {
    res.status(500).json({
      message: `Missing 'uuid' path parameter`,
    });
    return;
  }

  const url_uuid = req.params.uuid;
  const audio_file_path = base_dir + "/" + url_uuid + "/" + audio_file;

  if (!fs.existsSync(audio_file_path)) {
    res.status(404).json({ message: "Audio file not found" })
  }

  res.status(200).download(audio_file_path);
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
