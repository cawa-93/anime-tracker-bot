import {ListNode, ListTracker} from "./listsTrackers/contracts.ts";
import {MyAnimeListListsTracker} from "./listsTrackers/myAnimeList.ts";
import {AnitubeInUaStatusTracker} from "./statusTrackers/AnitubeInUa.ts";
import {AnimeState, Platforms} from "./statusTrackers/contracts.ts";
import {sendNotification} from "./bot.ts";


const trackers: ListTracker[] = [
    new MyAnimeListListsTracker()
]

let results = []
for (const tracker1 of trackers) {
    results.push(...await tracker1.getLists())
}

type AnimeStatusMerged = {
    list: ListNode,
    platforms: Record<Platforms, AnimeState | undefined>
}

const anitubeTracker = new AnitubeInUaStatusTracker()


const prevMergedState: AnimeStatusMerged[] = await Deno.readTextFile('./merged-state.json').then(s => JSON.parse(s || '[]'))
const merged: AnimeStatusMerged[] = []
for (const list of results) {

    // if (list.title !== 'Kono Subarashii Sekai ni Shukufuku wo! 3') {
    //     continue
    // }

    console.group(list.title)
    merged.push({
        list,
        platforms: {
            [Platforms.anitubeinua]: await anitubeTracker.getStatus(list)
        }
    })
    console.groupEnd()
    // break
}

for (const currentState of merged) {
    const prevState = prevMergedState.find(s => s.list.id === currentState.list.id)

    for (const key of Object.keys(currentState.platforms)) {
        const currentPlatformId = key as unknown as Platforms
        const platform = currentState.platforms[currentPlatformId];
        if (
            platform &&
            (
                (platform.episodes?.released || 0) > (prevState?.platforms?.[currentPlatformId]?.episodes?.released || 0)
            )
            && platform.episodes?.released > currentState.list.status.episodes.watched
        ) {
            if (currentState.list.status.kind === 'planned' && platform?.episodes.released < currentState.list.num_episodes) {
                continue
            }

            await sendNotification(`${platform.title}\n\nВийшла ${platform.episodes.released}-та серія\n\n${platform.url}`)
        }
    }

}


await Deno.writeTextFile('./merged-state.json', JSON.stringify(merged))

