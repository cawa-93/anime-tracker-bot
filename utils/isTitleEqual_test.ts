import {assertEquals} from "https://deno.land/std@0.191.0/testing/asserts.ts";
import {getUnifiedTitle} from "./isTitleEqual.ts";
import {convertToRoman} from "./romanian.ts";

const PLACEHOLDER = '%PLACEHOLDER%'

const formatOrdinals = (n: number) => {
    const pr = new Intl.PluralRules("en-US", {type: "ordinal"});

    const suffixes = new Map([
        ["one", "st"],
        ["two", "nd"],
        ["few", "rd"],
        ["other", "th"],
    ]);

    const rule = pr.select(n);
    const suffix = suffixes.get(rule);
    return `${n}${suffix}`;
};


function buildTestCases(inputTemplate: string, expectedTemplate: string) {
    const testCases: { input: string, expected: string }[] = []

    const words = ['Part']

    for (let i = 1; i <= 4; i++) {
        const expected = expectedTemplate.replace(PLACEHOLDER, String(i))
        for (const word of words) {
            const preparedCases = [
                `${word} ${i}`,
                `${i} ${word}`,
                `${word} ${formatOrdinals(i)}`,
                `${formatOrdinals(i)} ${word}`,
                `${word} ${convertToRoman(i)}`,
                `${convertToRoman(i)} ${word}`,
            ].flatMap(s => {
                const input = inputTemplate.replace(PLACEHOLDER, s)

                if (input.includes(PLACEHOLDER)) {
                    return buildTestCases(input, expected)
                }

                return ({
                    input: inputTemplate.replace(PLACEHOLDER, s), expected
                });
            })
            testCases.push(
                ...preparedCases
            )
        }
    }

    return testCases
}

const testCases = [
    {
        inputTemplate: `Genjitsu Shugi Yuusha no Oukoku Saikenki ${PLACEHOLDER}`,
        expectedTemplate: `genjitsushugiyuushanooukokusaikenki${PLACEHOLDER}`
    },
    {
        inputTemplate: `JoJo no Kimyou na Bouken ${PLACEHOLDER}: Stardust Crusaders ${PLACEHOLDER} `,
        expectedTemplate: `jojonokimyounabouken${PLACEHOLDER}stardustcrusaders${PLACEHOLDER}`
    },
    {
        inputTemplate: `Tensei shitara Slime Datta Ken ${PLACEHOLDER} ${PLACEHOLDER}`,
        expectedTemplate: `tenseishitaraslimedattaken${PLACEHOLDER}${PLACEHOLDER}`
    },
    {
        inputTemplate: `Lupin: ${PLACEHOLDER}`,
        expectedTemplate: `lupin${PLACEHOLDER}`
    },
    {
        inputTemplate: `Lupin III: ${PLACEHOLDER}`,
        expectedTemplate: `lupin3${PLACEHOLDER}`
    },
];


for (const {inputTemplate, expectedTemplate} of testCases) {
    Deno.test(inputTemplate, () => {
        for (const test of buildTestCases(inputTemplate, expectedTemplate)) {
            assertEquals(getUnifiedTitle(test.input), test.expected);
        }
    });
}
