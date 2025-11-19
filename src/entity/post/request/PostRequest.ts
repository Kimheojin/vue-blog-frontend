import TagRequest from "../../tag/request/TagRequest.ts";

export default class PostRequest{
    public title: string = ''
    public content: string = ''
    public categoryName: string = ''
    public postStatus: string ='PUBLISHED'
    public tagList: TagRequest[] = []
}
