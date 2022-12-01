import { setFailed } from "@actions/core";
import { context } from "@actions/github";
import { WebClient } from "@slack/web-api";
import { handleOpen, handlePush, handleReview } from "./utils.js";

const getEnvs = () => {
  const { SLACK_BOT_TOKEN, SLACK_CHANNEL_ID, SLACK_USERS } = process.env
  return {
    SLACK_BOT_TOKEN,
    SLACK_CHANNEL_ID,
    SLACK_USERS: JSON.parse(SLACK_USERS)
  }
}

(async () => {
  try {
    const { SLACK_BOT_TOKEN, SLACK_CHANNEL_ID, SLACK_USERS } = getEnvs();
    const slackClient = new WebClient(SLACK_BOT_TOKEN);
    const { eventName, payload } = context;
    switch (eventName) {
      case "pull_request": {
        switch (payload.action) {
          case "opened": {
            await handleOpen(slackClient, SLACK_USERS, SLACK_CHANNEL_ID);
            break;
          }
          case "edited": {
            //TODO - find a way to trigger this with pull request context
            await handlePush(slackClient, SLACK_USERS, SLACK_CHANNEL_ID);
            break;
          }
        }
        break;
      }
      case "pull_request_review": {
        await handleReview(slackClient, SLACK_USERS, SLACK_CHANNEL_ID);
        break;
      }
      default: {
        console.log(`Event: ${eventName} not implemented, continuing.`);
      }
    }
  } catch (error) {
    setFailed(error.message);
  }
})();
