import {ListNode} from "../listsTrackers/contracts.ts";
// import {AnimeStateAnitubeInUA} from "./AnitubeInUa.ts";



export enum Platforms {
    anitubeinua
}

// export type PlatformToStateMap = {
//     [Platforms.anitubeinua]: AnimeStateAnitubeInUA
// }

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