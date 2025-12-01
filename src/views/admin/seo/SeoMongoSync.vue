<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { container } from 'tsyringe';
import { ElMessage } from 'element-plus';
import SeoSyncRepository from '../../../repository/sync/SeoSyncRepository.ts';
import type SeoMongoSyncResponse from '../../../entity/sync/response/SeoMongoSyncResponse.ts';
import { useAdminAuth } from '../../../composables/useAdminAuth.ts';
import { useErrorHandler } from '../../../composables/useErrorHandler.ts';

const { customHandleError } = useErrorHandler();

const router = useRouter();
const SEO_SYNC_REPOSITORY = container.resolve(SeoSyncRepository);

const { isCheckingAuth, checkAuth } = useAdminAuth();

const syncResult = ref<SeoMongoSyncResponse | null>(null);
const seoDataCount = ref<number | null>(null);
const isSyncing = ref(false);
const isLoadingSeoData = ref(false);

onMounted(async () => {
  const authed = await checkAuth();
  if (authed) {
    await loadSeoDataCount();
  }
});

const handleSync = async () => {
  if (isSyncing.value) {
    return;
  }

  isSyncing.value = true;
  try {
    const result = await SEO_SYNC_REPOSITORY.syncMongoSeoData();
    syncResult.value = result;
    ElMessage.success('Mongo SEO 데이터 동기화를 완료했습니다.');
    await loadSeoDataCount();
  } catch (error) {
    customHandleError(error, 'SEO 데이터 동기화에 실패했습니다.');
  } finally {
    isSyncing.value = false;
  }
};

const loadSeoDataCount = async () => {
  isLoadingSeoData.value = true;
  try {
    const response = await SEO_SYNC_REPOSITORY.getSeoDataCount();
    seoDataCount.value = response.seoDataCount;
  } catch (error) {
    customHandleError(error, 'SEO 데이터 현황을 불러오지 못했습니다.');
  } finally {
    isLoadingSeoData.value = false;
  }
};

const goBack = () => {
  router.push('/admin');
};
</script>

<template>
  <div class="seo-sync-page">
    <div class="page-header">
      <div>
        <h2>SEO Mongo Sync</h2>
        <p class="subtitle">백엔드 RestDocs에 나온 SEO 동기화 요청을 한 번에 실행합니다.</p>
      </div>
      <el-button @click="goBack">관리자 홈으로</el-button>
    </div>

    <div v-if="isCheckingAuth" class="loading-text">
      인증 확인 중...
    </div>

    <div v-else class="page-content">
      <section class="card">
        <div class="card-header">
          <h3>Mongo → 서비스 DB 동기화</h3>
          <el-button
            type="primary"
            :loading="isSyncing"
            @click="handleSync"
          >
            {{ isSyncing ? '동기화 중...' : '동기화 실행' }}
          </el-button>
        </div>
        <p class="card-description">
          MongoDB에 쌓인 SEO 데이터를 서비스 DB로 수동 동기화합니다. 요청 본문 없이 RestDocs에 정의된
          POST <code>/api/admin/seo/mongo-sync</code> 를 호출합니다.
        </p>

        <div v-if="syncResult" class="result-grid">
          <div class="result-item">
            <span class="label">삽입 (insert)</span>
            <strong>{{ syncResult.insertCount }}</strong>
          </div>
          <div class="result-item">
            <span class="label">수정 (update)</span>
            <strong>{{ syncResult.updateCount }}</strong>
          </div>
          <div class="result-item">
            <span class="label">삭제 (delete)</span>
            <strong>{{ syncResult.deleteCount }}</strong>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <h3>SEO 데이터 현황</h3>
          <el-button :loading="isLoadingSeoData" @click="loadSeoDataCount">
            {{ isLoadingSeoData ? '조회 중...' : '새로고침' }}
          </el-button>
        </div>
        <p class="card-description">
          GET <code>/api/admin/seo/mongo/seo-data</code> 를 호출하여 현재 MongoDB에 저장된 SEO Document 수를 확인합니다.
        </p>

        <div class="seo-count">
          <span class="label">현재 문서 수</span>
          <strong>
            <template v-if="seoDataCount !== null">
              {{ seoDataCount }}
            </template>
            <template v-else>
              -
            </template>
          </strong>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.seo-sync-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 32px 16px 64px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.subtitle {
  margin-top: 4px;
  color: #888;
}

.loading-text {
  text-align: center;
  color: #e0e0e0;
  font-size: 16px;
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card {
  padding: 20px;
  border: 1px solid #2d2d2d;
  border-radius: 12px;
  background-color: #1b1b1b;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-description {
  margin: 0 0 20px;
  color: #bfbfbf;
  line-height: 1.4;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}

.result-item {
  padding: 16px;
  border-radius: 10px;
  background-color: #111;
  border: 1px solid #2a2a2a;
  text-align: center;
}

.result-item .label {
  display: block;
  margin-bottom: 6px;
  color: #aaa;
  font-size: 14px;
}

.result-item strong {
  font-size: 24px;
}

.seo-count {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-radius: 10px;
  background-color: #111;
  border: 1px solid #2a2a2a;
}

.seo-count .label {
  color: #aaa;
}

.seo-count strong {
  font-size: 28px;
}
</style>
