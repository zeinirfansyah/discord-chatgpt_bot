const { Client, Events, GatewayIntentBits } = require("discord.js");
require("dotenv/config");
const { OpenAIApi, Configuration } = require("openai");

const config = new Configuration({
  apiKey: process.env.OPENAI_KEY,
});

const openai = new OpenAIApi(config);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (clientUser) => {
  console.log(`Logged in as ${clientUser.tag}`);
});

client.login(process.env.BOT_TOKEN);

const BOT_CHANNEL = "YOUR_CHANNEL_ID";
const PAST_MESSAGES = 5;

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== BOT_CHANNEL) return;

  message.channel.sendTyping();

  let messages = Array.from(
    await message.channel.messages.fetch({
      limit: PAST_MESSAGES,
      before: message.id,
    })
  );

  messages = messages.map((m) => m[1]);
  messages.unshift(message);

  let users = [
    ...new Set([
      ...messages.map((m) => m.member.displayName),
      client.user.username,
    ]),
  ];

  let lastUser = users.pop();

  let prompt = `This is a conversation with ${users.join(
    ", "
  )} and ${lastUser}.\n\n`;

  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    prompt += `${m.member.displayName}: ${m.content}\n`;
  }

  prompt += `${client.user.username}: `;
  console.log("prompt: ", prompt);

  const response = await openai.createCompletion({
    prompt,
    model: "text-davinci-003",
    temperature: 0.7,
    max_tokens: 256,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: ["\n"],
  });

  console.log("response: ", response.data.choices[0].text);
  await message.channel.send(response.data.choices[0].text);
});
