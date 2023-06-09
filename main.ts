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


const notFound: Map<ListNode['id'], ListNode> = new Map()
const merged: MergedMap = new Map()


for (const listNode of results) {
    try {

        const prevMerged = prevMergedState.get(listNode.id)

        /**
         * Масив платформ на яких вже вийшли всі серії.
         * Перевіряти ці платформи немає сенсу, оскільки вже відомо що всі серії цільового шоу на ній вже вийшли,
         * Тому ці платформи можна сміливо пропускати.
         */
        const alreadyFullAired: Platforms[] = prevMerged
            ? [...prevMerged.platforms.entries()]
                .reduce(
                    (acc, [p, s]) => {
                        if (s?.episodes.released && s?.episodes.total && s?.episodes.released === s?.episodes.total) {
                            acc.push(p)
                        }

                        return acc;
                    },
                    [] as Platforms[]
                )
            : []

        if (alreadyFullAired.length === (Object.keys(Platforms).length / 2)) {
            console.log(listNode.id, `"${listNode.title}"`, 'Швидкий пропуск')
        }

        const state = new Map(
            await Promise.all(
                stateTrackers.map(
                    async ([platformId, tracker]) => [
                        platformId,
                        alreadyFullAired.includes(platformId)
                            /**
                             * Якщо відомо, що на платформі вийшли всі серії, то замість оновлення стану просто використати попередній
                             */
                            ? prevMerged?.platforms.get(platformId)
                            /**
                             * Якщо раніше платформа не була оброблена, або на момент останнього сканування на ній не вийшли всі серії запустити нове сканування.
                             */
                            : await tracker.getStatus(listNode)
                    ] as const
                )
            )
        )

        let isNothingFound = true

        for (const [platformId, animeState] of state) {
            if (animeState !== undefined) {
                isNothingFound = false
            }

            if (!animeState?.episodes.released) {
                continue
            }


            const currentReleased = animeState.episodes.released
            const prevReleased = prevMerged?.platforms.get(platformId)?.episodes.released || 0

            if (currentReleased > prevReleased && currentReleased > listNode.status.episodes.watched) {
                if (listNode.status.kind === 'planned' && currentReleased < listNode.num_episodes) {
                    continue
                }

                const totalEpisodes = animeState.episodes.total || listNode.num_episodes
                const episodesText = currentReleased === totalEpisodes ? (totalEpisodes > 1 ? `🎉 Вийшли всі серії` : '🎉 Реліз') : `Вийшла ${currentReleased}-та серія з ${totalEpisodes || '??'}`

                await sendNotification(`${animeState.title}\n\n${episodesText}\n\n${animeState.url}`)
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
        await sendNotification(`Невдалось перевірити оновлення для аніме ${listNode.title} (id: ${listNode.id}): ${e}\n\n${JSON.stringify(e?.cause || '')}\n\n${e?.stack}`)
    }
}

console.log(...notFound.values())


await Deno.writeTextFile('./merged-state.json', superjson.stringify(merged))
await Deno.writeTextFile('./not-found-state.json', superjson.stringify(notFound))

