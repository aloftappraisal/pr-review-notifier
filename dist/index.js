var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { setFailed } from "@actions/core";
import { context } from "@actions/github";
import { handleOpen, handlePush, handleReview } from "./utils.js";
((opts) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(opts);
    try {
        const { eventName, payload } = context;
        switch (eventName) {
            case "pull_request": {
                switch (payload.action) {
                    case "opened": {
                        yield handleOpen();
                        break;
                    }
                    case "edited": {
                        //TODO - find a way to trigger this with pull request context
                        yield handlePush();
                        break;
                    }
                }
                break;
            }
            case "pull_request_review": {
                yield handleReview();
                break;
            }
            default: {
                console.log(`Event: ${eventName} not implemented, continuing.`);
            }
        }
    }
    catch (error) {
        setFailed(error.message);
    }
}))();
//# sourceMappingURL=index.js.map