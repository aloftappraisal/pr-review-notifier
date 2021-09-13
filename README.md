# pr-reviews javascript action

Upon various actions taken on a PR, this action will tag the author and reviewer in Slack.

## Inputs

## `slack_bot_token`

**Required** The ID of the slack bot associated with this action.

## `slack_channel_id`

**Required** The ID of the slack channel that you want the bot to post messages in.

## `github_token`

**Required** Personal access token with repository rights.

## `slack_users`

**Required** This is JSON stringified array of the users you would like to be able to notify via slack when they are requested to review a PR. The format should be `[{ github_username: string, slack_id: string }]`.


## Example usage

uses: jonnyliu15/pr-reviews-action \n
with:\n
         `bot-token: ${{ secrets.SLACK_BOT_TOKEN }}\n
          channel-id: 'C01K5D346EL'\n
          github-token: ${{ secrets.GITHUB_TOKEN }}\n
          slack-users: '[\n
            { "github_username": "jonnyliu15", "slack_id": "U022GSCCH1A" }]',`\n
