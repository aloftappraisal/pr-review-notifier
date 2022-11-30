import { setFailed } from "@actions/core";
import { context } from "@actions/github";
import { handleOpen, handlePush, handleReview } from "./utils";

(async () => {
  try {
    const { eventName, payload } = context;
    switch (eventName) {
      case "pull_request": {
        switch (payload.action) {
          case "opened": {
            await handleOpen();
            break;
          }
          case "edited": {
            //TODO - find a way to trigger this with pull request context
            await handlePush();
            break;
          }
        }
        break;
      }
      case "pull_request_review": {
        await handleReview();
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
