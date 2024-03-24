export function parseOpenseaUrl(url: string | null): { platform: string | null, NftContractAddress: string | null, NftId: string | null } {
    if(!url) {
        return { platform: null, NftContractAddress: null, NftId: null };

    }
    const regex = /^https:\/\/opensea\.io\/assets\/([a-z]+)\/([^\/]+)\/([^\/]+)/;
    const matches = url.match(regex);

    if (matches && matches.length === 4) {
        const platform = matches[1] ?? null
        const NftContractAddress = matches[2] ?? null
        const NftId = matches[3] ?? null

        return { platform, NftContractAddress, NftId };
    } else {
        return { platform: null, NftContractAddress: null, NftId: null };
    }
}