import {ListNode} from "../listsTrackers/contracts.ts";

export type Status = {
    episodes: {
        released: number,
        total: number | undefined
    }
}


export interface StatusTracker {
    getStatus(node: ListNode): Promise<Status>
}