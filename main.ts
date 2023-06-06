import {ListTracker} from "./listsTrackers/contracts.ts";
import {MyAnimeListListsTracker} from "./listsTrackers/myAnimeList.ts";
import {AnitubeInUaStatusTracker} from "./statusTrackers/AnitubeInUa.ts";


const trackers: ListTracker[] = [
    new MyAnimeListListsTracker()
]

let results = []
for (const tracker1 of trackers) {
    results.push(... await tracker1.getLists())
}

console.log(results)


for (const result of results) {

console.log(
    await new AnitubeInUaStatusTracker().getStatus(result))
}
