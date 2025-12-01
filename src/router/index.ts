import { createRouter, createWebHistory } from 'vue-router';


import Menu from "../components/Menu.vue";
import AboutMe from "../views/Aboutme.vue";
import LoginPage from "../views/LoginPage.vue";
import AdminPage from "../views/AdminPage.vue";
import PostWrite from "../views/admin/post/PostWrite.vue";
import CategoryAdd from "../views/admin/category/CategoryAdd.vue";
import CategoryPosts from "../components/post/CategoryPosts.vue";
import CategoryDelete from "../views/admin/category/CategoryDelete.vue";
import CategoryModify from "../views/admin/category/CategoryModify.vue";
import PostDelete from "../views/admin/post/PostDelete.vue";
import PostModify from "../views/admin/post/PostModify.vue";
import CommentAdmin from "../views/admin/comment/CommentAdmin.vue";
import Allposts from "../components/post/Allposts.vue";
import PostDetail from "../components/PostDetail.vue";
import ImageDelete from "../views/admin/image/ImageDelete.vue";
import ImageList from "../views/admin/image/ImageList.vue";
import ImageUpload from "../views/admin/image/ImageUpload.vue";
import TagAdmin from "../views/admin/tag/TagAdmin.vue";
import SeoMongoSync from "../views/admin/seo/SeoMongoSync.vue";

const routes = [

    {
        path: '/',
        component: Allposts  // 홈 페이지를 전체 게시글 리스트로 설정
    },
    {
        path: '/posts',
        component: Allposts  // 전체 게시글 리스트
    },
    {
        path: '/post/:postId',
        component: PostDetail,  // 단일 게시글 보기
        props: true
    },
    {
        path: '/menu',
        component: Menu
    },
    {
        path: '/about',
        component: AboutMe
    },
    {
        path: '/admin/login',
        component: LoginPage
    },
    {
        path: '/admin',
        component: AdminPage
    },
    {
        path: '/admin/post/write',
        component: PostWrite
    },
    {
        path: '/admin/post/delete',
        component: PostDelete
    },
    {
        path: '/admin/post/modify',
        component: PostModify
    },
    {
        path: '/admin/category/add',
        component: CategoryAdd
    },
    {
        path: '/admin/category/modify',
        component: CategoryModify
    },
    {
        path: '/admin/category/delete',
        component: CategoryDelete
    },
    {
        path: '/category/:categoryName',
        component: CategoryPosts
    },
    {
        path: '/admin/comment',
        component: CommentAdmin
    },
    {
        path: '/admin/image/delete',
        component: ImageDelete
    },
    {
        path: '/admin/image/list',
        component: ImageList
    },
    {
        path: '/admin/image/upload',
        component: ImageUpload
    },
    {
        path: '/admin/tag',
        component: TagAdmin
    },
    {
        path: '/admin/seo/mongo-sync',
        component: SeoMongoSync
    }
];



const router = createRouter({
    history: createWebHistory(),
    routes,
});

export default router;
