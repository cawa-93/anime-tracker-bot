export type ListKind = 'planned' | 'watching'


export type ListNodeStatus = {
    kind: ListKind,
    episodes: {
        watched: number
    }
}

// Я ПОДИВИВСЯ
// ВИЙШЛИ
// ВСЬОГО ВИЙДЕ


export type ListNode = {
    /** MAL id */
    id: number
    title: string
    num_episodes: number
    status: ListNodeStatus
}


export interface ListTracker {
    getLists(): Promise<readonly ListNode[]>
}