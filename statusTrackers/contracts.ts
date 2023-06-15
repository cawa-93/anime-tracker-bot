import {ListNode} from "../listsTrackers/contracts.ts";


export enum Platforms {
    anitubeinua
}

export type AnimeState = {
    episodes: {
        released: number,
        total: number | undefined
    },
    url: string,
    title: string
}


export interface StatusTracker {
    getStatus(node: ListNode): Promise<AnimeState | undefined>
}