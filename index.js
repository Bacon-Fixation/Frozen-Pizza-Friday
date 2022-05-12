const config = require("./config.json");
const { default: wordsCount } = require("words-count");
const twitchapi = require("./twitch-api");
const filter = require("no-swears");
const {
  ChatClient,
  AlternateMessageModifier,
  UserStateTracker,
  SlowModeRateLimiter,
} = require("dank-twitch-irc");
const twitchClient = new ChatClient({
  username: `${config.bot.username}`,
  password: `${config.bot.auth.access_token}`,
  rateLimits: "default",
  ignoreUnhandledPromiseRejections: true,
  installDefaultMixins: true,
});

// slow down responses in slow chat mode
twitchClient.use(new SlowModeRateLimiter(twitchClient, 10));
// create User State Tracker - keeps track of the bots mod status and the message senders status
twitchClient.use(new UserStateTracker(twitchClient));
// just in case the first message failed to send it will resend response with /me
twitchClient.use(new AlternateMessageModifier(twitchClient));

// for "close" events
twitchClient.on("close", (error) => {
  if (error != null) {
    console.error("Client closed due to error", error);
  }
});
// for "error" events
twitchClient.on("error", (err) => {
  console.error(err);
});

// for "ready" events
twitchClient.on("ready", () => {
  console.log(`Successfully Connected`, new Date().toLocaleString());
});

twitchClient.on("PRIVMSG", async (msg) => {
  console.log(msg);
  if (msg.username == config.bot.login) return;
  if (msg.isMod == false) return console.log("not a mod");
  const messageText = msg.messageText.toLowerCase();
  const wordCount = wordsCount(messageText);
  // ignore messages that are not 3 words long
  if (wordCount != 3) return;

  const today = new Date();
  let isFriday = today.getDay() == 5 ? true : false;
  // Ignore when its not Friday
  if (isFriday == false) return;

  const array = messageText.split(" ");
  let frozen = false,
    pizza = false,
    friday = false;
  const newTitle = [];
  for (let index in array) {
    if (array[index].charAt(0) == "f" && index == 0) {
      frozen = true;
      newTitle.push(
        `${array[index].charAt(0).toUpperCase()}${array[index]
          .slice(1)
          .toLowerCase()}`
      );
    }
    if (array[index].charAt(0) == "p" && index == 1) {
      pizza = true;
      newTitle.push(
        `${array[index].charAt(0).toUpperCase()}${array[index]
          .slice(1)
          .toLowerCase()}`
      );
    }
    if (array[index].charAt(0) == "f" && index == 2) {
      friday = true;
      newTitle.push(
        `${array[index].charAt(0).toUpperCase()}${array[index]
          .slice(1)
          .toLowerCase()}`
      );
    }
  }

  if (frozen && pizza && friday) {
    console.log(messageText, filter.hasSwearsSync(messageText));
    if (filter.hasSwearsSync(msg.messageText) == true)
      return twitchClient.say(
        msg.channelName,
        "That is inappropriate for a title."
      );
    const channelData = await twitchapi.getChannel(msg.channelID);
    let newData = {};

    if (!channelData) return console.log("Failed to find channel");
    const oldTitle = channelData.title.split(" ");

    let streak = 0;
    let one = false,
      two = false,
      three = false;
    let tempArray = [];
    for (index in oldTitle) {
      if (oldTitle[index].charAt(0).toLowerCase() == "f" && streak == 0) {
        one = true;
        tempArray.push(`${oldTitle[index]}`);
        ++streak;
        continue;
      }
      if (oldTitle[index].charAt(0).toLowerCase() == "p" && streak == 1) {
        two = true;
        tempArray.push(`${oldTitle[index]}`);
        ++streak;
        continue;
      }
      if (oldTitle[index].charAt(0).toLowerCase() == "f" && streak == 2) {
        three = true;
        tempArray.push(`${oldTitle[index]}`);

        ++streak;
      }
      if (one && two && three) {
        for (const [key, value] of Object.entries(channelData)) {
          if (key == "title") {
            newData[key] = oldTitle
              .join(" ")
              .replace(tempArray.join(" "), newTitle.join(" "));
          }
        }
        await twitchClient.say(
          msg.channelName,
          `Title Changed: "${oldTitle.join(" ")}" --> "${oldTitle
            .join(" ")
            .replace(tempArray.join(" "), newTitle.join(" "))}"`
        );
        return await twitchapi.updateStreamTitle(msg.channelID, newData);
      }
      streak = 0;
    }

    return;
  }
});
// Connect
twitchClient.connect();
twitchClient.join(config.bot.login);
