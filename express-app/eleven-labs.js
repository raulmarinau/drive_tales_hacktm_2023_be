const fs = require("fs");
const { elevenlabs_key } = require("./api_keys");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const voices_url = "https://api.elevenlabs.io/v1/voices";
const settings_url = "https://api.elevenlabs.io/v1/voices/settings/default";

const headers = {
  Accept: "application/json",
  "xi-api-key": elevenlabs_key,
};

let voice_id = "";
let stability = "";
let similarity_boost = "";

async function get_audio_from_elevenlabs(text, full_path_name) {
  fetch(voices_url, { method: "GET", headers })
    .then((res) => {
      console.log("Eleven labs voices");
      console.log("Status: " + res.status);
      // console.log("Headers: ", res.headers);
      return res.json();
    })
    .then((data) => {
      voice_id = data["voices"].find((v) => v.name === "Adam")["voice_id"];
      console.log("Voice id picked: ", voice_id);

      return fetch(settings_url, { method: "GET", headers });
    })
    .then((res) => {
      console.log("Eleven labs default voice settings");
      console.log("Status: " + res.status);
      // console.log("Headers: ", res.headers);
      return res.json();
    })
    .then((data) => {
      stability = data["stability"];
      similarity_boost = data["similarity_boost"];

      console.log("Stability: ", stability);
      console.log("Similarity boost: ", similarity_boost);

      const tts_url =
        "https://api.elevenlabs.io/v1/text-to-speech/" + voice_id + "/stream";
      console.log(tts_url);

      const tts_headers = {
        "Content-Type": "application/json",
        "xi-api-key": elevenlabs_key,
      };
      const tts_data = {
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: stability,
          similarity_boost: similarity_boost,
        },
      };

      return fetch(tts_url, {
        method: "POST",
        headers: tts_headers,
        body: JSON.stringify(tts_data),
        stream: true,
      });
    })
    .then((res) => {
      console.log("Eleven labs generated response");
      console.log("Status: " + res.status);
      // console.log("Headers: ", res.headers);

      if (res.status == 422) {
        throw Error("Bad request");
      }

      const fileStream = fs.createWriteStream(full_path_name);

      res.body.pipe(fileStream);
      res.body.on("error", (error) => {
        console.error("Error:", error);
      });

      res.body.on("end", () => {
        console.log("File downloaded successfully");
      });
    })
    .catch((error) => {
      console.error("Error: ", error);
    });
}

module.exports = { get_audio_from_elevenlabs };
