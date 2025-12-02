import type SeoSearchResult from "../data/SeoSearchResult.ts";

export default class SeoUnifiedSearchResponse {
    public postSearchResponseDtoList: SeoSearchResult[] = [];
    public totalCount: number = 0;
}
