<script setup lang="ts">
import { useRouter } from 'vue-router';
import type PostItem from '../../entity/post/data/PostItem.ts';
import { getMarkdownPreview } from '../../composables/modifyMarkdown.ts';

const props = defineProps<{
  posts: PostItem[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  title: string;
  emptyMessage: string;
  showAllPostsButton?: boolean;
}>();

const emit = defineEmits<{
  pageChange: [page: number];
}>();

const router = useRouter();

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function goToPost(postId: number) {
  router.push(`/post/${postId}`);
}

function goToAllPosts() {
  router.push('/posts');
}

function goToCategory(categoryName: string) {
  router.push(`/category/${categoryName}`);
}

function handlePageChange(page: number) {
  emit('pageChange', page);
}
</script>

<template>
  <div class="posts-container">
    <div class="header-section">
      <h2 class="posts-info">
        {{ props.totalElements }}개의 게시글
      </h2>

      <div v-if="props.showAllPostsButton" class="navigation-buttons">
        <el-button @click="goToAllPosts"
                   class="all-posts-button"
                   text >전체 글 보기</el-button>
      </div>
    </div>

    <div v-if="props.isLoading" class="loading-text">
      게시글을 불러오는 중...
    </div>

    <div v-else>
      <div class="posts-list">
        <div
            v-for="post in props.posts"
            :key="post.postId"
            class="post-item"
        >

          <div class = "post-hover"
               @click="goToPost(post.postId)">
            <div class="post-header">
              <span class="post-title">{{ post.title }}</span>
              <el-link
                  v-if="!props.showAllPostsButton"
                  class="category-link bold-text custom-category-link"
                  @click.stop="goToCategory(post.categoryName)"
              >
                {{ post.categoryName }}
              </el-link>
            </div>

          <div class="post-content-preview">
            {{ getMarkdownPreview(post.content, 200) }}
          </div>

          <div
              v-if="post.tagList && post.tagList.length"
              class="post-tags"
          >
            <el-tag
                v-for="tag in post.tagList"
                :key="`post-${post.postId}-tag-${tag.tagId}`"
                size="small"
                effect="plain"
            >
              {{ tag.tagName }}
            </el-tag>
          </div>
        </div>

        <div class="post-meta">
          <span class="post-author opacity-blur">작성자 : {{ post.memberName }}</span>
          <span class="post-date opacity-blur">  |  작성 날짜 : {{ formatDate(post.regDate) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="pagination-container" v-if="props.totalPages > 1">
      <el-pagination
          v-model:current-page="props.currentPage"
          :total="props.totalElements"
          :page-size="5"
          layout="prev, pager, next"
          @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>

/* 나눔바른펜 폰트 import */
@import url('https://hangeul.pstatic.net/hangeul_static/css/nanum-barun-pen.css');

.bold-text {
  font-family: 'NanumBarunPenBold', sans-serif;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin: 40px 0;
}
/* 페이지 번호 버튼 크기 조정 */
.pagination-container :deep(.el-pager li) {
  min-width: 40px; /* 버튼 최소 너비 */
  height: 40px; /* 버튼 높이 */
  line-height: 40px; /* 텍스트 세로 중앙 정렬 */
  font-size: 20px; /* 페이지 번호 크기 */
}

/* 호버 시 색상 */
.pagination-container :deep(.el-pager li:hover) {
  background-color: #2d5a3d;
  color: white;
}

/* 선택된 페이지 색상 */
.pagination-container :deep(.el-pager li.is-active) {
  color: #66c989;
}

/* 이전/다음 버튼 호버 시 색상 */
.pagination-container :deep(.el-pagination button:hover) {
  color: #66c989;
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.posts-info{
  font-size: 32px;
}

.post-header {
  display: flex;
  align-items: center;
}

.post-title {
  font-size: 30px;
  font-weight: bold;
  margin-top: 16px;
  margin-bottom: 16px;
}

/* 기존 post-hover 스타일 */
.post-hover:hover {
  color: rgba(234, 190, 16, 0.8);
  transition: all 0.1ms ease;
  cursor: pointer;
}

/* 카테고리 링크에 호버할 때 부모의 호버 효과 제거 */
.post-hover:has(.category-link:hover) {
  color: initial;
  cursor: default;
}

.post-content-preview{
  font-size: 20px;
  margin-bottom: 4px;
}
.post-meta{
  font-size: 16px;
  margin-top: 12px;
  margin-bottom: 32px;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.post-tags :deep(.el-tag) {
  color: #e2e8f0;
  background-color: transparent;
  border: 1px solid #475569;
  opacity: 0.8;
  padding: 2px 8px;
  font-size: 17px;
}

.category-link {
  margin-left: auto;
}

.opacity-blur {
  opacity: 0.6;
}

.all-posts-button {
  color: #dcdc83 !important;
  font-size: 20px !important;
  font-weight: bold;

}

.all-posts-button:hover {
  background-color: #424242 !important;
}

.custom-category-link {
  color: #dcdc83 !important;
  font-size: 16px;
  font-weight: bold;
}

.custom-category-link:hover {
  color: #f0f0a0 !important;
}
</style>
