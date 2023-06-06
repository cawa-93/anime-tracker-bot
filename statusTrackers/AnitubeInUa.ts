import {Status, StatusTracker} from "./contracts.ts";
import {ListNode} from "../listsTrackers/contracts.ts";
import {DOMParser, type Element, type HTMLDocument} from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";


function closest(childEl: Element, selectorString: string): Element | null {
    const { match } = childEl.ownerDocument!._nwapi; // See note below
    let el: Element | null = childEl;
    do {
        // Note: Not using `el.matches(selectorString)` because on a browser if you override
        // `matches`, you *don't* see it being used by `closest`.
        if (match(selectorString, el)) {
            return el;
        }
        el = el.parentElement;
    } while (el !== null);
    return null;
}


export class AnitubeInUaStatusTracker implements StatusTracker {

    private getPage(path: `/${string}`, info?: RequestInit) {
        return fetch(`https://anitube.in.ua${path}`, info).then(r => r.text())
    }

    private getSearch(query: string) {

        return this.getPage('/index.php?do=search', {
            method: 'POST',
            body: new URLSearchParams({
                // Костиль, бо anitube.in.ua може не містити в оригінальній назві деякі символи.
                // Наприклад "Gintama°" -> "Gintama"
                story: query
            })
        })
    }

    /**
     * Пошук цільового блоку аніме за відповідним посиланням яке повинно містити точну оригінальну назву
     * @param document
     * @param title
     * @private
     */
    private getStatusFromSearchPage(document: HTMLDocument, title: string): string | undefined {
        const targetLink = document.querySelector(`article.story a[href$="${title.toLowerCase().replace(/\s+/g, '-')}.html"]`)

        if (!targetLink) {
            return undefined
        }

        const targetStory = closest(targetLink, 'article.story')

        return targetStory?.querySelector('.story_infa')?.textContent || undefined
    }


    private async getStatusByLookingOnAnimePages(document: HTMLDocument, title: string) {
        const urls: string[] = [...document.querySelectorAll('article.story h2 a')].map(el => el.getAttribute("href"))
        for (const url of urls) {
            const html = await fetch(url).then(r => r.text())
            if (!html.includes(`https://twitter.com/intent/tweet?text=${title}%20`)) {
                continue
            }

            const document = new DOMParser().parseFromString(html, "text/html")

            if (!document) {
                throw new Error('Не вдалось розпарсити сторінку аніме', {cause: {document}})
            }

            return document.querySelector('article.story .rcol > .story_c_r').textContent
        }

        return undefined
    }


    async getStatus({title}: ListNode): Promise<Status> {
        console.log('[AnitubeInUa][getStatus]', title)

        const normalizedTitle = title.replace(/[^a-z0-9-_\s]/ig, '')

        const page = await this.getSearch(normalizedTitle)
        const document = new DOMParser().parseFromString(page, "text/html")

        if (!document) {
            throw new Error('Не вдалось розпарсити сторінку з результатами пошуку', {cause: {document}})
        }

        const info = this.getStatusFromSearchPage(document, normalizedTitle) || await this.getStatusByLookingOnAnimePages(document, normalizedTitle)

        if (!info) {
            throw new Error(`Невдалось знайти відповідне аніме за назвою "${title}" ("${normalizedTitle}")`)
        }



        const [_, releasedStr, totalStr] = info.match(/(?<=Серій: )([0-9]+) з ([0-9]+|XX)/) || []

        const released = parseInt(releasedStr)
        const total = isNaN(parseInt(totalStr)) ? undefined : parseInt(totalStr)

        if (isNaN(released)) {
            throw new Error(`Невдалось розпарсити кількість серіїй для аніме "${title}" ("${normalizedTitle}}")`)
        }

        return {
            episodes: {
                released,
                total
            }
        }
    }
}