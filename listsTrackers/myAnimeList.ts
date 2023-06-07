import {ListNode, ListTracker} from "./contracts.ts";
import * as MalConfig from '../config/myanimelist.ts'
import * as malApi from '../utils/platforms/mal/api.ts'

type MALNode = {
    id: number
    title: string
    num_episodes: number

}
type MALStatus = {
    status: | 'watching'
        | 'completed'
        | 'on_hold'
        | 'dropped'
        | 'plan_to_watch'

    num_episodes_watched: number,
    is_rewatching: boolean
}

type MALListItem = {
    node: MALNode,
    list_status: MALStatus
}

export class MyAnimeListListsTracker implements ListTracker {

    private async getUserAnimeList(): Promise<MALListItem[]> {
        const searchParams = new URLSearchParams({
            fields: 'list_status,num_episodes',
            nsfw: 'true',
            limit: '1000',
        })

        let nextRequestEndpoint: `/${string}` = `/users/${MalConfig.USER_NAME}/animelist?${searchParams}`

        const results: MALListItem[] = []

        while (nextRequestEndpoint) {
            const {data, paging, error} = await malApi.callApi(nextRequestEndpoint)
            console.log({nextRequestEndpoint, error, MalConfig})
            // TODO: Додати обробку помилки
            results.push(...data)
            nextRequestEndpoint = paging.next?.replace(malApi.apiBasePoint, '')
        }

        return results
    }


    private convertStatus(status: MALStatus['status']): ListNode['status']['kind'] {
        switch (status) {
            case "watching":
                return 'watching'
            case "plan_to_watch":
                return "planned"
            default:
                throw new Error('Не підтримуваний тип списку')

        }
    }

    async getLists(): Promise<readonly ListNode[]> {
        const animes = await this.getUserAnimeList()

        return  animes.reduce((list, item) => {
            if (!(['watching', 'plan_to_watch'] as MALStatus['status'][]).includes(item.list_status.status)) {
                return list
            }


            list.push({
                id: item.node.id,
                title: item.node.title,
                num_episodes: item.node.num_episodes,
                status: {
                    kind: this.convertStatus(item.list_status.status),
                    episodes: {
                        watched: item.list_status.num_episodes_watched
                    }
                }
            })

            return list
        }, <ListNode[]>[])
    }
}