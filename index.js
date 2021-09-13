const github = require("@actions/github");
const core = require("@actions/core");
const { handleOpen, handlePush, handleReview } = require("./utils");

(async () => {
  try {
    const { eventName, payload } = github.context;
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
    core.setFailed(error.message);
  }
})();
