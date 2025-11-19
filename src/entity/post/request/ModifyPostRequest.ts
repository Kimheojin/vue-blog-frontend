import TagRequest from "../../tag/request/TagRequest.ts";

export default class ModifyPostRequest{
    public postId: number = 0
    public title: string = ''
    public content: string = ''
    public categoryName: string = ''
    public postStatus: string ='PUBLISHED'
    public tagList: TagRequest[] = []
}
