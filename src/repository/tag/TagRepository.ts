import { inject, singleton } from "tsyringe";
import HttpRepository from "../HttpRepository.ts";
import TagListResponse from "../../entity/tag/response/TagListResponse.ts";
import type TagInfo from "../../entity/tag/data/TagInfo.ts";
import TagPostListResponse from "../../entity/tag/response/TagPostListResponse.ts";

@singleton()
export default class TagRepository {
    constructor(
        @inject(HttpRepository) private readonly httpRepository: HttpRepository
    ) {}

    public async getTagList(): Promise<TagInfo[]> {
        const response = await this.httpRepository.get({
            path: '/api/tag/list',
        }, TagListResponse);

        return response.tagResponseDtoList || [];
    }

    public async getPostsByTag(tagId: number, tagName: string, page: number = 0, size: number = 15)
    : Promise<TagPostListResponse> {
        return this.httpRepository.get<TagPostListResponse>({
            path: '/api/tag/postlist',
            params: {
                tagId,
                tagName,
                page,
                size
            }
        }, TagPostListResponse);
    }
}
