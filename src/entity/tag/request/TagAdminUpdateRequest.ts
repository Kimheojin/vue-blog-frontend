import TagRequest from "./TagRequest.ts";

export default class TagAdminUpdateRequest {
    public postId: number = 0;
    public DtoList: TagRequest[] = [];
}
