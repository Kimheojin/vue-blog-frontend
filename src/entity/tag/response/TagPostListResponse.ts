import type TagPostSummary from "../data/TagPostSummary.ts";

export default class TagPostListResponse {
    public content: TagPostSummary[] = [];
    public pageNumber: number = 0;
    public pageSize: number = 15;
    public totalElements: number = 0;
    public totalPages: number = 0;
    public first: boolean = true;
    public last: boolean = true;
}
