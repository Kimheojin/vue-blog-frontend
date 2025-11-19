<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { container } from "tsyringe";
import PostAdminRepository from "../../../repository/post/PostAdminRepository.ts";
import CategoryRepository from "../../../repository/category/CategoryRepository.ts";
import ModifyPostRequest from "../../../entity/post/request/ModifyPostRequest.ts";
import type PostItem from "../../../entity/post/data/PostItem.ts";
import type Category from "../../../entity/category/data/Category.ts";
import type PostPageResponse from "../../../entity/post/response/PostPageResponse.ts";
import {useAdminAuth} from "../../../composables/useAdminAuth.ts";
import { useErrorHandler } from '../../../composables/useErrorHandler.ts';
import TagRequest from "../../../entity/tag/request/TagRequest.ts";

const { customHandleError } = useErrorHandler();

const router = useRouter();
const POST_ADMIN_REPOSITORY = container.resolve(PostAdminRepository);
const CATEGORY_REPOSITORY = container.resolve(CategoryRepository);

const { isCheckingAuth, checkAuth } = useAdminAuth();

const posts = ref<PostItem[]>([]);
const categories = ref<Category[]>([]);
const selectedPost = ref<PostItem | null>(null);
const isLoadingPosts = ref(false);
const isLoadingCategories = ref(false);
const isModifying = ref(false);
const newTag = ref('');

const currentPage = ref(0);
const totalPages = ref(0);
const totalElements = ref(0);

const state = reactive({
  post: new ModifyPostRequest()
});

onMounted(async () => {
  const isAuth = await checkAuth();
  if (isAuth) {
    await Promise.all([loadPosts(), loadCategories()]);
  }
});

async function loadPosts(page: number = 0) {
  isLoadingPosts.value = true;
  try {
    const response: PostPageResponse<PostItem> = await POST_ADMIN_REPOSITORY.getAdminPagePosts(page, 10);
    posts.value = response.content;
    currentPage.value = response.pageNumber;
    totalPages.value = response.totalPages;
    totalElements.value = response.totalElements;
  } catch (error) {
    customHandleError(error, '게시글을 불러오는데 실패했습니다.');
  } finally {
    isLoadingPosts.value = false;
  }
}

async function loadCategories() {
  isLoadingCategories.value = true;
  try {
    categories.value = await CATEGORY_REPOSITORY.getCategories();
  } catch (error) {
    customHandleError(error, '카테고리를 불러오는데 실패했습니다.');
  } finally {
    isLoadingCategories.value = false;
  }
}

function selectPost(post: PostItem) {
  selectedPost.value = post;
  state.post.postId = post.postId;
  state.post.title = post.title;
  state.post.content = post.content;
  state.post.categoryName = post.categoryName;
  state.post.postStatus = post.status;
  state.post.tagList = (post.tagList || []).map((tag) => {
    const tagRequest = new TagRequest();
    tagRequest.tagName = tag.tagName;
    return tagRequest;
  });
}

async function handleModify() {
  if (!selectedPost.value) {
    ElMessage.warning('수정할 게시글을 선택해주세요.');
    return;
  }

  if (!state.post.title.trim()) {
    ElMessage.warning('제목을 입력해주세요.');
    return;
  }

  if (!state.post.content.trim()) {
    ElMessage.warning('내용을 입력해주세요.');
    return;
  }

  if (!state.post.categoryName) {
    ElMessage.warning('카테고리를 선택해주세요.');
    return;
  }

  isModifying.value = true;

  try {
    await POST_ADMIN_REPOSITORY.modifyPost(state.post);
    ElMessage.success('게시글이 성공적으로 수정되었습니다.');

    backToPostList();
    await loadPosts(currentPage.value);

  } catch (error) {
    customHandleError(error, '게시글 수정에 실패했습니다.');
  } finally {
    isModifying.value = false;
  }
}

async function handlePageChange(page: number) {
  await loadPosts(page - 1);
}

function backToPostList() {
  selectedPost.value = null;
  state.post = new ModifyPostRequest();
  newTag.value = '';
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

function addTag() {
  const tagName = newTag.value.trim();
  if (!tagName) {
    ElMessage.warning('태그명을 입력해주세요.');
    return;
  }

  const isDuplicate = state.post.tagList.some(tag => tag.tagName === tagName);
  if (isDuplicate) {
    ElMessage.warning('이미 추가된 태그입니다.');
    return;
  }

  const tagRequest = new TagRequest();
  tagRequest.tagName = tagName;
  state.post.tagList.push(tagRequest);
  newTag.value = '';
}

function removeTag(index: number) {
  state.post.tagList.splice(index, 1);
}
</script>
<template>
  <div class="post-modify-page">
    <div class="post-modify-container">
      <div v-if="isCheckingAuth" class="loading-text">
        인증 확인 중...
      </div>

      <div v-else>
        <!-- 게시물 목록 화면 -->
        <div v-if="!selectedPost">
          <div class="page-header">
            <h2 class="page-title bold-text">게시글 수정 - 게시글 선택</h2>
            <div class="header-actions">
              <span class="posts-count">총 {{ totalElements }}개의 게시글</span>
              <el-button @click="goBack" class="bold-text">돌아가기</el-button>
            </div>
          </div>

          <div v-if="isLoadingPosts" class="loading-text">
            게시글 목록을 불러오는 중...
          </div>

          <div v-else-if="posts.length === 0" class="empty-text">
            수정할 게시글이 없습니다.
          </div>

          <div v-else>
            <div class="posts-list">
              <div
                  v-for="post in posts"
                  :key="`post-${post.postId}`"
                  class="post-item"
                  @click="selectPost(post)"
              >
                <div class="post-header">
                  <h3 class="post-title">{{ post.title }}</h3>
                  <div class="post-meta-inline">
                    <span
                        class="post-status"
                        :style="{ backgroundColor: getStatusColor(post.status) }"
                    >
                      {{ getStatusText(post.status) }}
                    </span>
                    <span class="post-date">{{ formatDate(post.regDate) }}</span>
                  </div>
                </div>

                <div class="post-info">
                  <span class="post-author">{{ post.memberName }}</span>
                  <span class="post-category">{{ post.categoryName }}</span>
                </div>

                <div class="post-content-preview">
                  {{ post.content.substring(0, 100) }}{{ post.content.length > 100 ? '...' : '' }}
                </div>

                <div
                    v-if="post.tagList && post.tagList.length"
                    class="post-tags"
                >
                  <el-tag
                      v-for="tag in post.tagList"
                      :key="`post-${post.postId}-tag-${tag.tagId}`"
                      size="small"
                      effect="dark"
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

        <!-- 수정 폼 화면 -->
        <div v-else>
          <div class="page-header">
            <h2 class="page-title bold-text">게시글 수정</h2>
            <div class="header-actions">
              <el-button @click="backToPostList" class="bold-text">게시글 목록</el-button>
            </div>
          </div>

          <!-- 선택된 게시글 정보 -->
          <div class="selected-post-info">
            <h3 class="selected-post-title">수정 중: {{ (selectedPost as PostItem).title }}</h3>
            <div class="selected-post-meta">
              <span>{{ (selectedPost as PostItem).memberName }}</span>
              <span>{{ (selectedPost as PostItem).categoryName }}</span>
              <span>{{ getStatusText((selectedPost as PostItem).status) }}</span>
              <span>{{ formatDate((selectedPost as PostItem).regDate) }}</span>
            </div>
            <div
                v-if="(selectedPost as PostItem).tagList && (selectedPost as PostItem).tagList.length"
                class="selected-post-tags"
            >
              <el-tag
                  v-for="tag in (selectedPost as PostItem).tagList"
                  :key="`selected-tag-${tag.tagId}`"
                  effect="dark"
              >
                {{ tag.tagName }}
              </el-tag>
            </div>
          </div>

          <!-- 수정 폼 -->
          <div class="form-section">
            <el-form class="modify-form" label-position="top">
              <el-form-item label="제목" class="bold-text">
                <el-input
                    v-model="state.post.title"
                    placeholder="제목을 입력해주세요"
                    clearable
                />
              </el-form-item>

              <el-form-item label="카테고리" class="bold-text">
                <el-select
                    v-model="state.post.categoryName"
                    placeholder="카테고리를 선택해주세요"
                    style="width: 100%"
                    :loading="isLoadingCategories"
                >
                  <el-option
                      v-for="category in categories"
                      :key="category.categoryId"
                      :label="category.categoryName"
                      :value="category.categoryName"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="발행 상태" class="bold-text">
                <el-select v-model="state.post.postStatus" style="width: 100%">
                  <el-option label="발행" value="PUBLISHED" />
                  <el-option label="임시저장" value="DRAFT" />
                  <el-option label="비공개" value="PRIVATE" />
                  <el-option label="예약됨" value="SCHEDULED" />
                </el-select>
              </el-form-item>

              <el-form-item label="태그" class="bold-text tags-form-item">
                <div class="tag-input-wrapper">
                  <el-input
                      v-model="newTag"
                      placeholder="태그를 입력 후 Enter 또는 추가 버튼을 눌러주세요"
                      clearable
                      @keyup.enter.native="addTag"
                  />
                  <el-button
                      type="success"
                      plain
                      @click="addTag"
                  >
                    추가
                  </el-button>
                </div>
                <div v-if="state.post.tagList.length" class="tag-list">
                  <el-tag
                      v-for="(tag, index) in state.post.tagList"
                      :key="`modify-tag-${tag.tagName}-${index}`"
                      closable
                      @close="removeTag(index)"
                  >
                    {{ tag.tagName }}
                  </el-tag>
                </div>
              </el-form-item>

              <el-form-item label="내용" class="bold-text">
                <el-input
                    v-model="state.post.content"
                    type="textarea"
                    placeholder="내용을 입력해주세요"
                    :rows="20"
                />
              </el-form-item>

              <el-form-item>
                <div class="button-group">
                  <el-button
                      type="primary"
                      @click="handleModify"
                      :loading="isModifying"
                      class="bold-text"
                  >
                    {{ isModifying ? '수정 중...' : '게시글 수정' }}
                  </el-button>

                  <el-button
                      @click="backToPostList"
                      :disabled="isModifying"
                      class="bold-text"
                  >
                    취소
                  </el-button>
                </div>
              </el-form-item>
            </el-form>
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

.post-modify-page {
  padding: 20px;
  font-family: 'NanumBarunPen', sans-serif;
  background-color: #1a1a1a;
  min-height: 100vh;
  color: #e0e0e0;
}

.post-modify-container {
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
  cursor: pointer;
  transition: all 0.3s ease;
}

.post-item:hover {
  border-color: #66b1ff;
  box-shadow: 0 2px 8px rgba(102, 177, 255, 0.2);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.post-title {
  color: #e0e0e0;
  margin: 0;
  font-size: 18px;
  flex: 1;
  line-height: 1.4;
}

.post-meta-inline {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-shrink: 0;
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
  font-size: 12px;
}

.post-info {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  color: #b0b0b0;
  font-size: 14px;
}

.post-author {
  color: #66b1ff;
  font-weight: bold;
}

.post-category {
  color: #f56c6c;
  font-weight: bold;
}

.post-content-preview {
  color: #ccc;
  line-height: 1.4;
  font-size: 14px;
}

.post-tags,
.selected-post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tag-input-wrapper {
  display: flex;
  gap: 12px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.selected-post-info {
  background-color: #2a2a2a;
  border-radius: 12px;
  border: 1px solid #66b1ff;
  padding: 20px;
  margin-bottom: 30px;
}

.selected-post-title {
  color: #e0e0e0;
  margin: 0 0 10px 0;
  font-size: 20px;
}

.selected-post-meta {
  display: flex;
  gap: 15px;
  color: #b0b0b0;
  font-size: 14px;
  flex-wrap: wrap;
}

.form-section {
  background-color: #2a2a2a;
  border-radius: 12px;
  border: 1px solid #444;
  padding: 30px;
}

.modify-form .el-form-item {
  margin-bottom: 25px;
}

.button-group {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

@media (max-width: 768px) {
  .post-modify-page {
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
    gap: 10px;
  }

  .post-info {
    flex-direction: column;
    gap: 5px;
  }

  .selected-post-meta {
    flex-direction: column;
    gap: 5px;
  }

  .form-section {
    padding: 20px;
  }

  .button-group {
    flex-direction: column;
  }
}
</style>
