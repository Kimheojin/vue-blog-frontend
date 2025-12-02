import { inject, singleton } from "tsyringe";
import HttpRepository from "../HttpRepository.ts";
import SeoUnifiedSearchResponse from "../../entity/seo/response/SeoUnifiedSearchResponse.ts";

@singleton()
export default class SeoSearchRepository {
    constructor(
        @inject(HttpRepository) private readonly httpRepository: HttpRepository
    ) {}

    public async unifiedSearch(term: string): Promise<SeoUnifiedSearchResponse> {
        return this.httpRepository.get<SeoUnifiedSearchResponse>({
            path: '/api/seo/unified-search',
            params: {
                term
            },
        }, SeoUnifiedSearchResponse);
    }
}
