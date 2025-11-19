<script setup lang="ts">
import {onMounted, ref} from 'vue';
import {useRouter} from "vue-router";
import {ElMessage, ElMessageBox} from "element-plus";
import {container} from "tsyringe";
import PostAdminRepository from "../../../repository/post/PostAdminRepository.ts";
import DeletePostRequest from "../../../entity/post/request/DeletePostRequest.ts";
import type PostItem from "../../../entity/post/data/PostItem.ts";
import type PostPageResponse from "../../../entity/post/response/PostPageResponse.ts";
import {useAdminAuth} from "../../../composables/useAdminAuth.ts";
import { useErrorHandler } from '../../../composables/useErrorHandler.ts';

const { customHandleError } = useErrorHandler();

const router = useRouter();
const POST_ADMIN_REPOSITORY = container.resolve(PostAdminRepository);

const { isCheckingAuth, checkAuth } = useAdminAuth();

const posts = ref<PostItem[]>([]);
const isLoading = ref(false);
const isDeleting = ref(false);

const currentPage = ref(0);
const totalPages = ref(0);
const totalElements = ref(0);

onMounted(async () => {
  const isAuth = await checkAuth();
  if (isAuth) {
    await loadPosts();
  }
});

async function loadPosts(page: number = 0) {
  isLoading.value = true;
  try {
    const response: PostPageResponse<PostItem> = await POST_ADMIN_REPOSITORY.getAdminPagePosts(page, 10);
    posts.value = response.content;
    currentPage.value = response.pageNumber;
    totalPages.value = response.totalPages;
    totalElements.value = response.totalElements;
  } catch (error) {
    customHandleError(error, '게시글을 불러오는데 실패했습니다.');
  } finally {
    isLoading.value = false;
  }
}

async function handleDelete(post: PostItem) {
  try {
    const titlePreview = post.title.length > 30
        ? post.title.substring(0, 30) + '...'
        : post.title;

    await ElMessageBox.confirm(
        `게시글을 삭제하시겠습니까?\n\n"${titlePreview}"`,
        '게시글 삭제',
        {
          confirmButtonText: '삭제',
          cancelButtonText: '취소',
          type: 'warning',
        }
    );

    isDeleting.value = true;

    const request = new DeletePostRequest();
    request.postId = post.postId;

    await POST_ADMIN_REPOSITORY.deletePost(request);
    ElMessage.success('게시글이 성공적으로 삭제되었습니다.');

    await loadPosts(currentPage.value);

  } catch (error: any) {
    if (error !== 'cancel') {
      customHandleError(error, '게시글 삭제에 실패했습니다.');
    }
  } finally {
    isDeleting.value = false;
  }
}

async function handlePageChange(page: number) {
  await loadPosts(page - 1);
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateString;
  }
}

function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'PUBLISHED': '발행',
    'DRAFT': '임시저장',
    'PRIVATE': '비공개',
    'SCHEDULED': '예약됨'
  };
  return statusMap[status] || status;
}

function getStatusColor(status: string): string {
  const colorMap: { [key: string]: string } = {
    'PUBLISHED': '#67c23a',
    'DRAFT': '#e6a23c',
    'PRIVATE': '#f56c6c',
    'SCHEDULED': '#409eff'
  };
  return colorMap[status] || '#909399';
}

function goBack() {
  router.back();
}
</script>
<template>
  <div class="post-delete-page">
    <div class="post-delete-container">
      <div v-if="isCheckingAuth" class="loading-text">
        인증 확인 중...
      </div>

      <div v-else>
        <div class="page-header">
          <h1>게시글 삭제</h1>
          <div class="header-actions">
            <span class="posts-count">총 {{ totalElements }}개의 게시글</span>
            <el-button @click="goBack" >돌아가기</el-button>
          </div>
        </div>

        <div v-if="isLoading" class="loading-text">
          게시글 목록을 불러오는 중...
        </div>

        <div v-else-if="posts.length === 0" class="empty-text">
          삭제할 게시글이 없습니다.
        </div>

        <div v-else>
          <div class="posts-list">
            <div
                v-for="post in posts"
                :key="`post-${post.postId}`"
                class="post-item"
            >
              <div class="post-header">
                <h3 class="post-title">{{ post.title }}</h3>
                <div class="post-actions">
                  <el-button
                      type="danger"
                      size="small"
                      @click="handleDelete(post)"
                      :loading="isDeleting"
                      class="bold-text"
                  >
                    삭제
                  </el-button>
                </div>
              </div>

              <div class="post-meta">
                <div class="post-info">
                  <span class="post-author">{{ post.memberName }}</span>
                  <span class="post-category">{{ post.categoryName }}</span>
                  <span
                      class="post-status"
                      :style="{ backgroundColor: getStatusColor(post.status) }"
                  >
                    {{ getStatusText(post.status) }}
                  </span>
                  <span class="post-date">{{ formatDate(post.regDate) }}</span>
                </div>
              </div>

              <div class="post-content-preview">
                {{ post.content.substring(0, 150) }}{{ post.content.length > 150 ? '...' : '' }}
              </div>

              <div
                  v-if="post.tagList && post.tagList.length"
                  class="post-tags"
              >
                <el-tag
                    v-for="tag in post.tagList"
                    :key="`delete-tag-${post.postId}-${tag.tagId}`"
                    size="small"
                >
                  {{ tag.tagName }}
                </el-tag>
              </div>
            </div>
          </div>

          <div class="pagination-container" v-if="totalPages > 1">
            <el-pagination
                v-model:current-page="currentPage"
                :page-size="10"
                :total="totalElements"
                layout="prev, pager, next"
                @current-change="handlePageChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 나눔바른펜 폰트 import */
@import url('https://hangeul.pstatic.net/hangeul_static/css/nanum-barun-pen.css');

.bold-text {
  font-family: 'NanumBarunPenBold', sans-serif;
}

.post-delete-page {
  padding: 20px;
  font-family: 'NanumBarunPen', sans-serif;
  background-color: #1a1a1a;
  min-height: 100vh;
  color: #e0e0e0;
}

.post-delete-container {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #444;
}

.page-title {
  font-size: 28px;
  color: #e0e0e0;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.posts-count {
  color: #b0b0b0;
  font-size: 16px;
}

.loading-text,
.empty-text {
  text-align: center;
  color: #b0b0b0;
  font-size: 18px;
  margin: 60px 0;
  padding: 40px;
  background-color: #2a2a2a;
  border-radius: 12px;
  border: 1px solid #444;
}

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.post-item {
  background-color: #2a2a2a;
  border-radius: 12px;
  border: 1px solid #444;
  padding: 20px;
  transition: all 0.3s ease;
}

.post-item:hover {
  border-color: #f56c6c;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.2);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.post-title {
  color: #e0e0e0;
  margin: 0;
  font-size: 18px;
  flex: 1;
  line-height: 1.4;
}

.post-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  margin-left: 20px;
}

.post-meta {
  margin-bottom: 15px;
}

.post-info {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  align-items: center;
}

.post-author {
  color: #66b1ff;
  font-weight: bold;
}

.post-category {
  color: #f56c6c;
  font-weight: bold;
}

.post-status {
  color: white;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.post-date {
  color: #888;
  font-size: 14px;
}

.post-content-preview {
  color: #ccc;
  line-height: 1.5;
  font-size: 14px;
  background-color: #1e1e1e;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #333;
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

@media (max-width: 768px) {
  .post-delete-page {
    padding: 10px;
  }

  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .post-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .post-actions {
    margin-left: 0;
    align-self: flex-end;
  }

  .post-info {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>
