<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { container } from "tsyringe";
import { marked } from "marked";
import PostRepository from "../repository/post/PostRepository.ts";
import PostItem from "../entity/post/data/PostItem.ts";
import PostComments from "../components/PostComments.vue";
import { useErrorHandler } from "../composables/useErrorHandler.ts";

const { customHandleError } = useErrorHandler();

const route = useRoute();
const router = useRouter();
const POST_REPOSITORY = container.resolve(PostRepository);

const post = ref<PostItem>(new PostItem());
const isLoading = ref(true);
const postId = ref<number>(0);

marked.setOptions({
    breaks: true,
    gfm: true,
});

const renderedContent = computed(() => {
    if (!post.value.content) return "";
    const html = marked(post.value.content);

    nextTick(() => {
        if ((window as any).hljs) {
            (window as any).hljs.highlightAll();
        }
    });

    return html;
});

const isPostLoaded = computed(() => {
    return post.value.postId > 0;
});

watch(
    () => route.params.postId,
    (newPostId) => {
        const newPostIdNum = Number(newPostId);
        if (newPostId && postId.value !== newPostIdNum) {
            postId.value = newPostIdNum;
            loadPost();
        }
    },
    { immediate: true }
);

async function loadPost() {
    isLoading.value = true;
    try {
        const loadedPost = await POST_REPOSITORY.getSinglePost(postId.value);
        post.value = loadedPost;
    } catch (error) {
        customHandleError(error, "게시글을 불러오는데 실패했습니다.");
        router.replace("/");
    } finally {
        isLoading.value = false;
    }
}

watch(
    () => post.value.content,
    () => {
        nextTick(() => {
            if ((window as any).hljs) {
                (window as any).hljs.highlightAll();
            }
        });
    }
);

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function goToCategory(categoryName: string) {
    router.push(`/category/${categoryName}`);
}

function goBack() {
    router.back();
}
</script>
<template>
    <div class="post-detail-page">
        <div class="post-detail-container">
            <div v-if="isLoading" class="loading-text">
                게시글을 불러오는 중...
            </div>

            <div v-else-if="isPostLoaded" class="post-content">
                <div class="post-header">
                    <div class="post-title">{{ post.title }}</div>
                    <div class="post-meta">
                        <el-tag
                            class="category-tag"
                            size="large"
                            type="warning"
                            effect="plain"
                            @click="goToCategory(post.categoryName)"
                        >
                            {{ post.categoryName }}
                        </el-tag>
                        <span class="post-author">{{ post.memberName }}</span>
                        <span class="post-date">{{
                            formatDate(post.regDate)
                        }}</span>
                    </div>
                </div>

                <!-- GitHub 마크다운 스타일 적용 -->
                <div class="post-body">
                    <article
                        class="markdown-body"
                        v-html="renderedContent"
                    ></article>
                </div>

                <div class="bottom-navigation">
                    <el-button
                        @click="goBack"
                        type="warning"
                        text
                        bg
                        class="nav-button"
                        >이전으로</el-button
                    >
                    <el-button
                        @click="goToCategory(post.categoryName)"
                        type="warning"
                        text
                        bg
                        class="nav-button"
                    >
                        {{ post.categoryName }} 카테고리 더 보기
                    </el-button>
                </div>
                <PostComments :post-id="post.postId" />
            </div>

            <div v-else class="error-text">게시글을 찾을 수 없습니다.</div>
        </div>
    </div>
</template>
<style scoped>
/* 나눔바른펜 폰트 */
@import url("https://hangeul.pstatic.net/hangeul_static/css/nanum-barun-pen.css");

.post-detail-page {
    width: 100%;
    max-width: 1000px;
    margin: 0 auto;
    font-family: "NanumBarunPen", sans-serif;
}

.loading-text,
.error-text {
    text-align: center;
    color: #b0b0b0;
    font-size: 16px;
    margin: 40px 0;
}

.post-header {
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 1px solid #444;
}

.post-title {
    font-size: 36px;
    color: #ffffff;
    margin: 0 0 20px 0;
    line-height: 1.4;
    word-break: keep-all;
    font-weight: bold;
}

.post-meta {
    display: flex;
    align-items: center;
    gap: 15px;
    flex-wrap: wrap;
}

.category-tag {
    cursor: pointer;
    font-size: 14px;
}

.post-author {
    color: #b0b0b0;
    font-size: 14px;
    font-weight: bold;
}

.post-date {
    color: #909399;
    font-size: 14px;
}

.post-body {
    margin-bottom: 40px;
}

/* GitHub 마크다운 스타일 커스터마이징 - :deep() 사용 */
:deep(.markdown-body) {
    box-sizing: border-box;
    min-width: 200px;
    max-width: 100%;
    margin: 0;
    padding: 0;
    background-color: transparent !important;
    line-height: 1.7; /* 줄간격 늘리기 (기본 1.5 → 1.7) */
    letter-spacing: 0.05em; /* 글자간격 추가 */
}

/* 한글 폰트 적용 - :deep() 사용 */
:deep(.markdown-body h1),
:deep(.markdown-body h2),
:deep(.markdown-body h3),
:deep(.markdown-body h4),
:deep(.markdown-body h5),
:deep(.markdown-body h6) {
    font-family: "NanumBarunPenBold", -apple-system, BlinkMacSystemFont,
        "Segoe UI", Helvetica, Arial, sans-serif;
    word-break: keep-all;
}

:deep(.markdown-body h1) {
    color: #fff86b;
    line-height: 1.5;
    font-size: 2.5em;
}

:deep(.markdown-body h2) {
    color: #cddc39;
    line-height: 1.5;
    font-size: 2em;
}

:deep(.markdown-body h3) {
    color: #9ccc65;
    line-height: 1.5;
    font-size: 1.7em;
}

:deep(.markdown-body h4) {
    color: #8bc34a;
    line-height: 1.5;
    font-size: 1.4em;
}

:deep(.markdown-body p),
:deep(.markdown-body li),
:deep(.markdown-body blockquote) {
    font-family: "NanumBarunPen", -apple-system, BlinkMacSystemFont, "Segoe UI",
        Helvetica, Arial, sans-serif !important;
    word-break: keep-all;
    overflow-wrap: break-word;
    font-size: 20px !important;
    margin-bottom: 1em; /* 단락 간격 추가 */
}

:deep(.markdown-body code),
:deep(.markdown-body pre) {
    font-family: "Fira Code", "JetBrains Mono", "Monaco", "Consolas",
        "Courier New", monospace;
}

/* 코드 블록 배경색 및 스타일 추가 */
:deep(.markdown-body pre) {
    background-color: #1e1e1e;
    border-radius: 13px;
    overflow-x: auto; /* 코드가 길어질 경우 가로 스크롤 생성 */
    padding: 1rem;
    /* 은은한 그림자 (잘 안보임) */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 마크다운 링크 스타일 */
:deep(.markdown-body a) {
    color: #90caf9 !important;
    text-decoration: none;
}

:deep(.markdown-body a:hover) {
    color: #16c2d7 !important;
    text-decoration: none;
}

:deep(.markdown-body a:visited) {
    color: #90caf9 !important;
    text-decoration: none;
}
:deep(.markdown-body a:visited:hover) {
    color: #16c2d7 !important;
    text-decoration: none;
}

.bottom-navigation {
    display: flex;
    justify-content: space-between;
    padding-top: 20px;
    border-top: 1px solid #444;
    flex-wrap: wrap;
    gap: 10px;
}

.nav-button {
    font-weight: bold !important;
    color: #a3d363 !important;
    font-size: 19px !important;
}

/* 반응형 */
@media (max-width: 767px) {
    .post-detail-container {
        padding: 15px;
    }

    .bottom-navigation {
        flex-direction: column;
        gap: 10px;
    }

    .post-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }

    .post-title {
        font-size: 28px;
    }
}

@media (max-width: 480px) {
    .post-detail-container {
        padding: 10px;
    }
}
</style>
