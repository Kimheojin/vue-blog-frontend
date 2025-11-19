<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { container } from 'tsyringe';
import { ElMessage } from 'element-plus';
import TagRepository from "../../../repository/tag/TagRepository.ts";
import TagAdminRepository from "../../../repository/tag/TagAdminRepository.ts";
import TagAdminUpdateRequest from "../../../entity/tag/request/TagAdminUpdateRequest.ts";
import TagRequest from "../../../entity/tag/request/TagRequest.ts";
import type TagInfo from "../../../entity/tag/data/TagInfo.ts";
import type TagPostSummary from "../../../entity/tag/data/TagPostSummary.ts";
import { useAdminAuth } from "../../../composables/useAdminAuth.ts";
import { useErrorHandler } from '../../../composables/useErrorHandler.ts';

const { customHandleError } = useErrorHandler();

const router = useRouter();
const TAG_REPOSITORY = container.resolve(TagRepository);
const TAG_ADMIN_REPOSITORY = container.resolve(TagAdminRepository);

const { isCheckingAuth, checkAuth } = useAdminAuth();

const tags = ref<TagInfo[]>([]);
const isLoadingTags = ref(false);
const selectedTagId = ref<number | null>(null);

const tagPosts = ref<TagPostSummary[]>([]);
const isLoadingPosts = ref(false);
const tagPostsPagination = reactive({
  page: 1,
  size: 15,
  total: 0
});

type TagFormState = {
  postId: string;
  tagInput: string;
  tags: TagRequest[];
  isSubmitting: boolean;
};

const addForm = reactive<TagFormState>({
  postId: '',
  tagInput: '',
  tags: [],
  isSubmitting: false
});

const deleteForm = reactive<TagFormState>({
  postId: '',
  tagInput: '',
  tags: [],
  isSubmitting: false
});

const selectedTag = computed<TagInfo | null>(() => {
  return tags.value.find(tag => tag.tagId === selectedTagId.value) || null;
});

onMounted(async () => {
  const authed = await checkAuth();
  if (authed) {
    await loadTagList();
  }
});

async function loadTagList(maintainSelection: boolean = false) {
  isLoadingTags.value = true;
  try {
    tags.value = await TAG_REPOSITORY.getTagList();

    if (!tags.value.length) {
      clearSelectedTag();
    }

    if (maintainSelection && selectedTagId.value !== null) {
      const stillExists = tags.value.some(tag => tag.tagId === selectedTagId.value);
      if (stillExists) {
        await loadTagPosts(tagPostsPagination.page - 1);
      } else {
        clearSelectedTag();
      }
    }
  } catch (error) {
    customHandleError(error, '태그 목록을 불러오는데 실패했습니다.');
  } finally {
    isLoadingTags.value = false;
  }
}

function clearSelectedTag() {
  selectedTagId.value = null;
  tagPosts.value = [];
  tagPostsPagination.page = 1;
  tagPostsPagination.total = 0;
}

async function handleSelectTag(tag: TagInfo) {
  selectedTagId.value = tag.tagId;
  tagPostsPagination.page = 1;
  await loadTagPosts(0);
}

async function loadTagPosts(page: number = tagPostsPagination.page - 1) {
  const currentTag = selectedTag.value;
  if (!currentTag) {
    tagPosts.value = [];
    tagPostsPagination.total = 0;
    return;
  }

  isLoadingPosts.value = true;
  try {
    const response = await TAG_REPOSITORY.getPostsByTag(
        currentTag.tagId,
        currentTag.tagName,
        page,
        tagPostsPagination.size
    );
    tagPosts.value = response.content;
    tagPostsPagination.page = response.pageNumber + 1;
    tagPostsPagination.total = response.totalElements;
    tagPostsPagination.size = response.pageSize;
  } catch (error) {
    customHandleError(error, '태그 게시글을 불러오는데 실패했습니다.');
  } finally {
    isLoadingPosts.value = false;
  }
}

function handlePostsPageChange(page: number) {
  tagPostsPagination.page = page;
  loadTagPosts(page - 1);
}

function addTagToForm(formState: TagFormState) {
  const value = formState.tagInput.trim();
  if (!value) {
    ElMessage.warning('태그명을 입력해주세요.');
    return;
  }

  const isDuplicate = formState.tags.some(tag => tag.tagName === value);
  if (isDuplicate) {
    ElMessage.warning('이미 추가된 태그입니다.');
    return;
  }

  const tagRequest = new TagRequest();
  tagRequest.tagName = value;
  formState.tags.push(tagRequest);
  formState.tagInput = '';
}

function removeTagFromForm(formState: TagFormState, index: number) {
  formState.tags.splice(index, 1);
}

function parsePostId(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

function buildRequest(formState: TagFormState, postId: number): TagAdminUpdateRequest {
  const request = new TagAdminUpdateRequest();
  request.postId = postId;
  request.DtoList = formState.tags.map(tag => {
    const dto = new TagRequest();
    dto.tagName = tag.tagName.trim();
    return dto;
  });
  return request;
}

async function submitAddTags() {
  const postId = parsePostId(addForm.postId);
  if (!postId) {
    ElMessage.warning('유효한 게시글 ID를 입력해주세요.');
    return;
  }

  if (addForm.tags.length === 0) {
    ElMessage.warning('추가할 태그를 최소 1개 이상 입력해주세요.');
    return;
  }

  addForm.isSubmitting = true;
  try {
    const request = buildRequest(addForm, postId);
    await TAG_ADMIN_REPOSITORY.addTags(request);
    ElMessage.success('태그가 추가되었습니다.');
    resetForm(addForm);
    await loadTagList(true);
  } catch (error) {
    customHandleError(error, '태그 추가에 실패했습니다.');
  } finally {
    addForm.isSubmitting = false;
  }
}

async function submitDeleteTags() {
  const postId = parsePostId(deleteForm.postId);
  if (!postId) {
    ElMessage.warning('유효한 게시글 ID를 입력해주세요.');
    return;
  }

  if (deleteForm.tags.length === 0) {
    ElMessage.warning('삭제할 태그를 최소 1개 이상 입력해주세요.');
    return;
  }

  deleteForm.isSubmitting = true;
  try {
    const request = buildRequest(deleteForm, postId);
    await TAG_ADMIN_REPOSITORY.deleteTags(request);
    ElMessage.success('태그가 삭제되었습니다.');
    resetForm(deleteForm);
    await loadTagList(true);
  } catch (error) {
    customHandleError(error, '태그 삭제에 실패했습니다.');
  } finally {
    deleteForm.isSubmitting = false;
  }
}

function resetForm(formState: TagFormState) {
  formState.postId = '';
  formState.tagInput = '';
  formState.tags.splice(0, formState.tags.length);
}

function handleRefreshTags() {
  loadTagList(true);
}

function goBack() {
  router.back();
}

function formatDate(dateString: string): string {
  if (!dateString) {
    return '';
  }
  try {
    return new Date(dateString).toLocaleString('ko-KR', {
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
</script>

<template>
  <div class="tag-admin-page">
    <div class="tag-admin-container">
      <div v-if="isCheckingAuth" class="loading-text">
        인증 확인 중...
      </div>

      <div v-else>
        <div class="page-header">
          <div>
            <h2>태그 관리</h2>
            <p class="page-description">
              태그 목록을 확인하고 게시글에 태그를 추가하거나 삭제할 수 있습니다.
            </p>
          </div>
          <div class="header-actions">
            <el-button @click="handleRefreshTags" :loading="isLoadingTags">
              새로고침
            </el-button>
            <el-button @click="goBack">
              돌아가기
            </el-button>
          </div>
        </div>

        <div class="tag-content">
          <div class="tag-list-card">
            <div class="card-header">
              <div>
                <h3>태그 목록</h3>
                <p class="card-subtitle">전체 태그와 연결된 게시글 수를 확인합니다.</p>
              </div>
              <span class="tag-count">총 {{ tags.length }}개</span>
            </div>

            <div v-if="isLoadingTags" class="card-empty">
              태그 목록을 불러오는 중...
            </div>
            <div v-else-if="tags.length === 0" class="card-empty">
              등록된 태그가 없습니다.
            </div>
            <div v-else class="tag-list">
              <div
                  v-for="tag in tags"
                  :key="tag.tagId"
                  class="tag-item"
                  :class="{ active: tag.tagId === selectedTagId }"
                  @click="handleSelectTag(tag)"
              >
                <div>
                  <div class="tag-name">{{ tag.tagName }}</div>
                  <div class="tag-meta">
                    <span>ID {{ tag.tagId }}</span>
                    <span>{{ tag.count }}개의 글</span>
                  </div>
                </div>
                <span class="tag-chevron">›</span>
              </div>
            </div>
          </div>

          <div class="tag-posts-card">
            <div class="card-header">
              <div>
                <h3>태그별 게시글</h3>
                <p v-if="selectedTag" class="card-subtitle">
                  "{{ selectedTag.tagName }}" 태그에 연결된 게시글입니다.
                </p>
                <p v-else class="card-subtitle">
                  왼쪽에서 태그를 선택하면 게시글을 확인할 수 있습니다.
                </p>
              </div>
            </div>

            <div v-if="!selectedTag" class="card-empty">
              태그를 선택해주세요.
            </div>
            <div v-else-if="isLoadingPosts" class="card-empty">
              게시글을 불러오는 중...
            </div>
            <div v-else-if="tagPosts.length === 0" class="card-empty">
              연결된 게시글이 없습니다.
            </div>
            <div v-else class="post-list">
              <div
                  v-for="post in tagPosts"
                  :key="post.postId"
                  class="post-item"
              >
                <div class="post-title">{{ post.title }}</div>
                <div class="post-meta">
                  <span>ID {{ post.postId }}</span>
                  <span>{{ formatDate(post.regDate) }}</span>
                </div>
              </div>
            </div>

            <div
                v-if="selectedTag && tagPostsPagination.total > tagPostsPagination.size"
                class="pagination-container"
            >
              <el-pagination
                  v-model:current-page="tagPostsPagination.page"
                  :page-size="tagPostsPagination.size"
                  layout="prev, pager, next"
                  :total="tagPostsPagination.total"
                  @current-change="handlePostsPageChange"
              />
            </div>
          </div>
        </div>

        <div class="form-grid">
          <div class="form-card">
            <div class="card-header">
              <div>
                <h3>태그 추가</h3>
                <p class="card-subtitle">지정한 게시글에 새 태그를 부여합니다.</p>
              </div>
            </div>

            <el-form label-position="top">
              <el-form-item label="게시글 ID">
                <el-input
                    v-model="addForm.postId"
                    placeholder="태그를 추가할 게시글 ID"
                />
              </el-form-item>

              <el-form-item label="태그명">
                <div class="tag-input-group">
                  <el-input
                      v-model="addForm.tagInput"
                      placeholder="태그 입력 후 Enter"
                      @keyup.enter.native="addTagToForm(addForm)"
                  />
                  <el-button
                      type="success"
                      plain
                      @click="addTagToForm(addForm)"
                  >
                    추가
                  </el-button>
                </div>
                <div class="input-help">
                  공백 없이 입력해주세요. 동일한 태그는 추가되지 않습니다.
                </div>
                <div v-if="addForm.tags.length" class="tag-chip-list">
                  <el-tag
                      v-for="(tag, index) in addForm.tags"
                      :key="`${tag.tagName}-${index}`"
                      closable
                      @close="removeTagFromForm(addForm, index)"
                  >
                    {{ tag.tagName }}
                  </el-tag>
                </div>
              </el-form-item>

              <el-form-item>
                <div class="form-actions">
                  <el-button
                      type="primary"
                      :loading="addForm.isSubmitting"
                      @click="submitAddTags"
                  >
                    {{ addForm.isSubmitting ? '추가 중...' : '태그 추가' }}
                  </el-button>
                  <el-button
                      :disabled="addForm.isSubmitting"
                      @click="resetForm(addForm)"
                  >
                    초기화
                  </el-button>
                </div>
              </el-form-item>
            </el-form>
          </div>

          <div class="form-card">
            <div class="card-header">
              <div>
                <h3>태그 삭제</h3>
                <p class="card-subtitle">지정한 게시글에서 선택한 태그를 제거합니다.</p>
              </div>
            </div>

            <el-form label-position="top">
              <el-form-item label="게시글 ID">
                <el-input
                    v-model="deleteForm.postId"
                    placeholder="태그를 삭제할 게시글 ID"
                />
              </el-form-item>

              <el-form-item label="태그명">
                <div class="tag-input-group">
                  <el-input
                      v-model="deleteForm.tagInput"
                      placeholder="태그 입력 후 Enter"
                      @keyup.enter.native="addTagToForm(deleteForm)"
                  />
                  <el-button
                      type="danger"
                      plain
                      @click="addTagToForm(deleteForm)"
                  >
                    추가
                  </el-button>
                </div>
                <div class="input-help">
                  제거할 태그를 모두 추가한 뒤 삭제 버튼을 눌러주세요.
                </div>
                <div v-if="deleteForm.tags.length" class="tag-chip-list">
                  <el-tag
                      v-for="(tag, index) in deleteForm.tags"
                      :key="`${tag.tagName}-${index}`"
                      closable
                      type="danger"
                      @close="removeTagFromForm(deleteForm, index)"
                  >
                    {{ tag.tagName }}
                  </el-tag>
                </div>
              </el-form-item>

              <el-form-item>
                <div class="form-actions">
                  <el-button
                      type="danger"
                      :loading="deleteForm.isSubmitting"
                      @click="submitDeleteTags"
                  >
                    {{ deleteForm.isSubmitting ? '삭제 중...' : '태그 삭제' }}
                  </el-button>
                  <el-button
                      :disabled="deleteForm.isSubmitting"
                      @click="resetForm(deleteForm)"
                  >
                    초기화
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
@import url('https://hangeul.pstatic.net/hangeul_static/css/nanum-barun-pen.css');

.tag-admin-page {
  min-height: 100vh;
  padding: 24px;
  background-color: #1a1a1a;
  color: #e0e0e0;
  font-family: 'NanumBarunPen', sans-serif;
}

.tag-admin-container {
  max-width: 1200px;
  margin: 0 auto;
}

.loading-text {
  text-align: center;
  color: #b0b0b0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.page-description {
  margin: 4px 0 0;
  color: #b0b0b0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.tag-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  margin-bottom: 24px;
}

.tag-list-card,
.tag-posts-card,
.form-card {
  background-color: #222;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.card-subtitle {
  margin: 4px 0 0;
  color: #a0a0a0;
  font-size: 14px;
}

.tag-count {
  color: #67c23a;
  font-weight: bold;
}

.card-empty {
  text-align: center;
  padding: 40px 0;
  color: #a0a0a0;
  background-color: #1b1b1b;
  border-radius: 12px;
}

.tag-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 430px;
  overflow-y: auto;
}

.tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-radius: 12px;
  background-color: #1f1f1f;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag-item:hover {
  border-color: #409eff;
  transform: translateY(-2px);
}

.tag-item.active {
  border-color: #409eff;
  background-color: #0f1f39;
}

.tag-name {
  font-size: 16px;
  font-weight: bold;
}

.tag-meta {
  display: flex;
  gap: 12px;
  color: #9e9e9e;
  font-size: 13px;
  margin-top: 4px;
}

.tag-chevron {
  font-size: 20px;
  color: #5f5f5f;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 430px;
  overflow-y: auto;
}

.post-item {
  padding: 14px 16px;
  background-color: #1f1f1f;
  border-radius: 12px;
  border: 1px solid #2f2f2f;
}

.post-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 6px;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  color: #9e9e9e;
  font-size: 13px;
}

.pagination-container {
  margin-top: 12px;
  text-align: center;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.tag-input-group {
  display: flex;
  gap: 12px;
}

.tag-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.input-help {
  margin-top: 6px;
  font-size: 13px;
  color: #9e9e9e;
}

.form-actions {
  display: flex;
  gap: 12px;
}

@media (max-width: 992px) {
  .tag-content {
    grid-template-columns: 1fr;
  }
}
</style>
