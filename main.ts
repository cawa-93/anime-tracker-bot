import {ListNode, ListTracker} from "./listsTrackers/contracts.ts";
import {MyAnimeListListsTracker} from "./listsTrackers/myAnimeList.ts";
import {AnitubeInUaStatusTracker} from "./statusTrackers/AnitubeInUa.ts";
import {AnimeState, Platforms, StatusTracker} from "./statusTrackers/contracts.ts";
import {sendNotification} from "./bot.ts";
import superjson from 'npm:superjson'



const listTrackers: ListTracker[] = [
    new MyAnimeListListsTracker()
]

const stateTrackers: [Platforms, StatusTracker][] = [
    [Platforms.anitubeinua, new AnitubeInUaStatusTracker()]
]


const results: ListNode[] = []
for (const tracker1 of listTrackers) {
    results.push(...await tracker1.getLists())
}

type AnimeStatusMerged = {
    list: ListNode,
    platforms: Map<Platforms, AnimeState | undefined>
}

type MergedMap = Map<AnimeStatusMerged['list']['id'], AnimeStatusMerged>

const prevMergedState: MergedMap = await Deno.readTextFile('./merged-state.json').then(s => s.trim() ? superjson.parse(s) : new Map())


async function getStates(node: ListNode) {
    return new Map(
        await Promise.all(
            stateTrackers.map(async ([platformId, tracker]) => [platformId, await tracker.getStatus(node)] as const)
        )
    )

}

const notFound: Map<ListNode['id'], ListNode> = new Map()
const merged: MergedMap = new Map()


for (const listNode of results) {
    try {

        const prevMerged = prevMergedState.get(listNode.id)
        const state = await getStates(listNode)

        let isNothingFound = true

        for (const [platformId, animeState] of state) {
            if (isNothingFound && animeState !== undefined) {
                isNothingFound = false
            }

            if (!animeState?.episodes.released) {
                continue
            }


            const currentReleased = prevMerged?.platforms.get(platformId)?.episodes.released || 0
            const prevReleased = prevMerged?.platforms.get(platformId)?.episodes.released || 0

            if (currentReleased > prevReleased && currentReleased > listNode.status.episodes.watched) {
                if (listNode.status.kind === 'planned' && currentReleased < listNode.num_episodes) {
                    continue
                }

                await sendNotification(`${animeState.title}\n\nВийшла ${animeState.episodes.released}-та серія\n\n${animeState.url}`)
            }
        }

        if (isNothingFound) {
            notFound.set(listNode.id, listNode)
        } else {
            merged.set(listNode.id, {
                list: listNode,
                platforms: state
            })
        }
    }
    catch (e) {
        await sendNotification(`Невдалось перевірити оновлення для аніме ${listNode.title} (id: ${listNode.id}): ${e}\n\n${e?.stack}`)
    }
}

console.log(...notFound.values())


await Deno.writeTextFile('./merged-state.json', superjson.stringify(merged))

