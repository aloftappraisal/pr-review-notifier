"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleReview = exports.handlePush = exports.handleOpen = void 0;
var core_1 = require("@actions/core");
var github_1 = require("@actions/github");
var micromark_1 = require("micromark");
var html_to_mrkdwn_1 = require("html-to-mrkdwn");
var web_api_1 = require("@slack/web-api");
var slackClient = new web_api_1.WebClient((0, core_1.getInput)("slack_bot_token"));
var channelId = (0, core_1.getInput)("slack_channel_id");
var prReviewsChannelId = "C04B4TN6UHJ"; // #tech-prs
var githubToSlackName = function (github) {
    var users = JSON.parse((0, core_1.getInput)("slack_users"));
    var user = users.find(function (user) { return user["github_username"] === github; });
    return user === undefined ? "*".concat(github, "*") : "<@".concat(user["slack_id"], ">");
};
var deleteHtmlComments = function (html) { return html.replace(/<!--.*?-->/g, ""); };
var markdownToMrkdwn = function (markdown) {
    return (0, html_to_mrkdwn_1.default)((0, micromark_1.micromark)(deleteHtmlComments(markdown))).text;
};
var mrkdwnQuote = function (mrkdwn) {
    return mrkdwn
        .split("\n")
        .map(function (s) { return ">".concat(s); })
        .join("\n");
};
var handleOpen = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, pull_request, sender, author, reviewers, prTitleLink, bodySection, reviewersSection, prReviewsMessage, slackMessage;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("handling open");
                _a = github_1.context.payload, pull_request = _a.pull_request, sender = _a.sender;
                author = githubToSlackName(sender.login);
                reviewers = pull_request.requested_reviewers.map(function (reviewer) {
                    return githubToSlackName(reviewer.login);
                });
                prTitleLink = "<".concat(pull_request._links.html.href, "|*").concat(pull_request.title, "*>");
                bodySection = pull_request.body
                    ? "\n".concat(mrkdwnQuote(markdownToMrkdwn(pull_request.body)))
                    : "";
                reviewersSection = reviewers.length > 0 ? "\n*Reviewers:* ".concat(reviewers.join(", ")) : "";
                return [4 /*yield*/, slackClient.chat.postMessage({
                        channel: prReviewsChannelId,
                        text: "".concat(author, " opened ").concat(prTitleLink).concat(reviewersSection).concat(bodySection),
                        unfurl_links: false,
                    })];
            case 1:
                prReviewsMessage = _b.sent();
                if (!prReviewsMessage.ok) {
                    throw new Error("Failed to send slack message");
                }
                if (!(reviewers.length !== 0)) return [3 /*break*/, 3];
                return [4 /*yield*/, slackClient.chat.postMessage({
                        channel: channelId,
                        text: "".concat(reviewers.join(","), ", ").concat(author, " requested your review on ").concat(prTitleLink),
                    })];
            case 2:
                slackMessage = _b.sent();
                if (!slackMessage.ok) {
                    throw new Error("Failed to send slack message");
                }
                _b.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.handleOpen = handleOpen;
var handlePush = function () { return __awaiter(void 0, void 0, void 0, function () {
    var pull_request, reviewers, PR;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("handling push");
                pull_request = github_1.context.payload.pull_request;
                if (!pull_request) {
                    return [2 /*return*/];
                }
                reviewers = pull_request.requested_reviewers.map(function (reviewer) {
                    return githubToSlackName(reviewer.login);
                });
                PR = "<".concat(pull_request._links.html.href, "|*").concat(pull_request.title, "*>");
                if (reviewers.length === 0) {
                    return [2 /*return*/];
                }
                return [4 /*yield*/, slackClient.chat.postMessage({
                        channel: channelId,
                        text: "Attention ".concat(reviewers.join(", "), ", updates were made to ").concat(PR),
                    })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.handlePush = handlePush;
var handleReview = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, pull_request, review, author, reviewer, baseText;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("handling review");
                _a = github_1.context.payload, pull_request = _a.pull_request, review = _a.review;
                if (!pull_request) {
                    return [2 /*return*/];
                }
                author = githubToSlackName(pull_request.user.login);
                reviewer = githubToSlackName(review.user.login);
                if (!reviewer) {
                    throw Error("Could not map ".concat(review.user.login, " to the users you provided in action.yml"));
                }
                if (!author) {
                    throw Error("Could not map ".concat(pull_request.user.login, " to the users you provided in action.yml"));
                }
                if (author.normalize() === reviewer.normalize()) {
                    return [2 /*return*/];
                }
                switch (review.state) {
                    case "changes_requested":
                        baseText = "requested changes on your PR.";
                        break;
                    case "commented":
                        baseText = "commented on your PR.";
                        break;
                    case "approved":
                        baseText = "approved your PR. Yay!";
                        break;
                    default:
                        throw Error("unknown review state");
                }
                return [4 /*yield*/, slackClient.chat.postMessage({
                        channel: channelId,
                        text: "".concat(author, ", ").concat(reviewer, " ").concat(baseText),
                    })];
            case 1:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.handleReview = handleReview;
//# sourceMappingURL=utils.js.map