const ascii0 = "0".charCodeAt(0);
const ascii9 = "9".charCodeAt(0);

export function isDigit(ch: string) {
    const num = ch.charCodeAt(0);
    if(num>=ascii0 && num<=ascii9) {
        return true;
    }

    return false;
}
