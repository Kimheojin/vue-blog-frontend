import { inject, singleton } from "tsyringe";
import HttpRepository from "../HttpRepository.ts";
import TagAdminUpdateRequest from "../../entity/tag/request/TagAdminUpdateRequest.ts";
import TagAdminListResponse from "../../entity/tag/response/TagAdminListResponse.ts";
import type TagInfo from "../../entity/tag/data/TagInfo.ts";

@singleton()
export default class TagAdminRepository {
    constructor(
        @inject(HttpRepository) private readonly httpRepository: HttpRepository
    ) {}

    public async addTags(request: TagAdminUpdateRequest): Promise<TagInfo[]> {
        const response = await this.httpRepository.post({
            path: '/api/admin/tag/list',
            body: request
        }, TagAdminListResponse);

        return response.tagResponseList || [];
    }

    public async deleteTags(request: TagAdminUpdateRequest): Promise<TagInfo[]> {
        const response = await this.httpRepository.delete({
            path: '/api/admin/tag/list',
            body: request
        }, TagAdminListResponse);

        return response.tagResponseList || [];
    }
}
