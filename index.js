const github = require("@actions/github");
const { createSlackThread, handlePush, handleReview } = require("./utils");

(async () => {
  try {
    const { eventName, payload } = github.context;
    switch (eventName) {
      case "pull_request": {
        if (payload.action === "opened") {
          await createSlackThread();
        }
      }
      case "push": {
        await handlePush();
      }
      case "pull_request_review": {
        await handleReview();
      }
      default: {
        console.log(`Event: ${eventName} not implemented, continuing.`);
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
})();
