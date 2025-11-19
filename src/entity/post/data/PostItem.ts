import type PostTag from "../../tag/data/PostTag.ts";

export default class PostItem{
    public postId: number = 0
    public title: string = ''
    public memberName: string = ''
    public content: string = ''
    public categoryName: string= ''
    public status: string= ''
    public regDate: string = ''
    public tagList: PostTag[] = []
}
