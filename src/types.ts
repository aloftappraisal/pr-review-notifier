import { WebClient } from "@slack/web-api";

type UserMap = {
    [github: string]: string
}
export type Handler = (client: WebClient, users: UserMap, channelId: string) => Promise<void>