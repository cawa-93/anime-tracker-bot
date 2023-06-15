const romanHash = {
    I: 1,
    V: 5,
    X: 10,
    L: 50,
    C: 100,
    D: 500,
    M: 1000,
} as const;


export function parseRom(s: string): number {
    let accumulator = 0;
    for (let i = 0; i < s.length; i++) {
        if (s[i] === "I" && s[i + 1] === "V") {
            accumulator += 4;
            i++;
        } else if (s[i] === "I" && s[i + 1] === "X") {
            accumulator += 9;
            i++;
        } else if (s[i] === "X" && s[i + 1] === "L") {
            accumulator += 40;
            i++;
        } else if (s[i] === "X" && s[i + 1] === "C") {
            accumulator += 90;
            i++;
        } else if (s[i] === "C" && s[i + 1] === "D") {
            accumulator += 400;
            i++;
        } else if (s[i] === "C" && s[i + 1] === "M") {
            accumulator += 900;
            i++;
        } else {
            // @ts-ignore
            accumulator += romanHash[s[i]];
        }
    }
    return accumulator;
}
export function convertToRoman(num: number) {
    var ref = [['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]] as const;
    var res: string[] = [];
    ref.forEach(function(p) {
        while (num >= p[1]) {
            res.push(p[0]);
            num -= p[1];
        }
    });
    return res.join('');
}