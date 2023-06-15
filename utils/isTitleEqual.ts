import {parseRom} from "./romanian.ts";

const replacer = (_: string, arg: string) => parseRom(arg).toString()

export function getUnifiedTitle(title: string): string {
    return title.trim()
        .replace(/(?<![a-z])(part|season)s?(?![a-z])/ig, '')
        .replace(/([0-9]+)(?:st|nd|rd|th)?/ig, '$1')
        .replace(/(?<![a-zA-Z])([IVXLCDM]+)(?![a-zA-Z])/g, replacer)
        .replace(/[^a-z0-9]+/ig, '')
        .toLowerCase()
}

export function isTitleEqual(title1: string, title2: string): boolean {
    return title1.toUpperCase() === title2.toUpperCase() || getUnifiedTitle(title1) === getUnifiedTitle(title2)
}