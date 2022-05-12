const got = require("got");
const config = require("./config.json");

const helixOptions = {
  responseType: "json",
  throwHttpErrors: true,
  headers: {
    Authorization: `Bearer ${config.bot.auth.access_token}`,
    "Client-Id": "umhhyrvkdriayr0psc3ttmsnq2j8h0",
  },
};

const helix = {
  get: async (path, json) => {
    return await got(`https://api.twitch.tv/helix/${path}`, {
      ...helixOptions,
      json,
    });
  },
  post: async (path, json) => {
    return await got.post(`https://api.twitch.tv/helix/${path}`, {
      ...helixOptions,
      json,
    });
  },
  patch: async (path, json) => {
    return await got.patch(`https://api.twitch.tv/helix/${path}`, {
      ...helixOptions,
      json,
    });
  },
};

module.exports = {
  updateStreamTitle: async function (channelId, channelData) {
    let newData = {};
    // for (const [key, value] of Object.entries(oldStreamData)) {
    //   if (key == "title") {
    //     newData[key] = value;
    //     console.log(`${key}: ${value}`);
    //   }
    // }
    // console.log(`Old: ` + oldStreamData, `New: ` + newData);
    // return body.data[0];
    await helix.patch(
      `channels?broadcaster_id=${encodeURIComponent(channelId)}`,
      channelData
    );
  },
  getChannel: async function (userId) {
    const { body } = await helix.get(
      `channels?broadcaster_id=${encodeURIComponent(userId)}`
    );

    return body.data[0];
  },
};
