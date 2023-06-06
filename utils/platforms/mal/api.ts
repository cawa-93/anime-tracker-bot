import * as MalConfig from "../../../config/myanimelist.ts";


export const apiBasePoint = `https://api.myanimelist.net/v2`;



export function callApi(endpoint: `/${string}`, init?: RequestInit) {
    const resolvedInit: RequestInit = {
        headers: {
            'X-MAL-CLIENT-ID': MalConfig.CLIENT_ID,
            ...init?.headers
        },
        ...init
    }

    return fetch(`${apiBasePoint}${endpoint}`, resolvedInit).then(r => r.json())
}