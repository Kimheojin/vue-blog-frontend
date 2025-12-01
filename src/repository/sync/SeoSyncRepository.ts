import { inject, singleton } from "tsyringe";
import HttpRepository from "../HttpRepository.ts";
import SeoMongoSyncResponse from "../../entity/sync/response/SeoMongoSyncResponse.ts";
import SeoDataCountResponse from "../../entity/sync/response/SeoDataCountResponse.ts";

@singleton()
export default class SeoSyncRepository {
    constructor(
        @inject(HttpRepository) private readonly httpRepository: HttpRepository
    ) {}

    public async syncMongoSeoData(): Promise<SeoMongoSyncResponse> {
        return this.httpRepository.post<SeoMongoSyncResponse>({
            path: '/api/admin/seo/mongo-sync'
        }, SeoMongoSyncResponse);
    }

    public async getSeoDataCount(): Promise<SeoDataCountResponse> {
        return this.httpRepository.get<SeoDataCountResponse>({
            path: '/api/admin/seo/mongo/seo-data'
        }, SeoDataCountResponse);
    }
}
