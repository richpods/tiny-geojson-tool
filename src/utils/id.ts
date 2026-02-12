let counter = 0;

function randomHex(bytes: number): string {
    const buf = crypto.getRandomValues(new Uint8Array(bytes));
    return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function generateFeatureId(): string {
    return `richpods-${randomHex(6)}-${++counter}`;
}
