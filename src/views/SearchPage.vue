<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { container } from "tsyringe";
import { useRoute, useRouter } from "vue-router";
import SeoSearchRepository from "../repository/seo/SeoSearchRepository.ts";
import type SeoSearchResult from "../entity/seo/data/SeoSearchResult.ts";
import { useErrorHandler } from "../composables/useErrorHandler.ts";

const router = useRouter();
const route = useRoute();
const { customHandleError } = useErrorHandler();

const SEO_SEARCH_REPOSITORY = container.resolve(SeoSearchRepository);

const searchTerm = ref<string>(
    typeof route.query.term === "string" ? route.query.term : ""
);
const syncedRouteTerm = ref<string>(searchTerm.value);
const results = ref<SeoSearchResult[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);
const hasSearched = ref(false);

const hasResults = computed(() => results.value.length > 0);

const updateRouteQuery = async (term: string) => {
    if (syncedRouteTerm.value === term && route.path === "/search") {
        return;
    }

    syncedRouteTerm.value = term;

    await router.replace({
        path: "/search",
        query: term ? { term } : {},
    });
};

const resetResults = () => {
    results.value = [];
    totalCount.value = 0;
};

const executeSearch = async (term: string, syncRoute: boolean) => {
    const normalizedTerm = term.trim();

    if (syncRoute) {
        await updateRouteQuery(normalizedTerm);
    }

    if (!normalizedTerm) {
        hasSearched.value = false;
        resetResults();
        return;
    }

    isLoading.value = true;
    hasSearched.value = true;

    try {
        const response =
            await SEO_SEARCH_REPOSITORY.unifiedSearch(normalizedTerm);
        results.value = response.postSearchResponseDtoList || [];
        totalCount.value = response.totalCount || 0;
    } catch (error) {
        customHandleError(error, "검색 중 오류가 발생했습니다.");
    } finally {
        isLoading.value = false;
    }
};

const onSearch = () => {
    executeSearch(searchTerm.value, true);
};

const clearSearch = () => {
    searchTerm.value = "";
    executeSearch("", true);
};

const goToPost = (postId: number) => {
    router.push(`/post/${postId}`);
};

watch(
    () => route.query.term,
    (newTerm) => {
        const normalizedTerm =
            typeof newTerm === "string" ? newTerm : "";

        if (normalizedTerm === syncedRouteTerm.value) {
            return;
        }

        syncedRouteTerm.value = normalizedTerm;
        searchTerm.value = normalizedTerm;
        executeSearch(normalizedTerm, false);
    }
);

onMounted(() => {
    if (searchTerm.value.trim()) {
        executeSearch(searchTerm.value, false);
    }
});
</script>

<template>
    <div class="search-page">
        <div class="search-header">
            <h2 class="page-title">허진 블로그 통합 검색</h2>
            <p class="page-subtitle">
                단어를 입력하면 SEO 검색 INDEX를 기반으로 POST를 찾습니다. 
            </p>
        </div>

        <div class="search-bar">
            <el-input
                v-model="searchTerm"
                placeholder="검색어를 입력하세요"
                clearable
                @keyup.enter.native="onSearch"
            />
            <el-button
                type="warning"
                class="search-button"
                :disabled="!searchTerm.trim()"
                @click="onSearch"
            >
                검색
            </el-button>
            <el-button text class="reset-button" @click="clearSearch">
                초기화
            </el-button>
        </div>

        <div v-if="isLoading" class="search-status">검색 중입니다...</div>
        <div v-else-if="hasSearched" class="search-status">
            총 {{ totalCount }}개의 결과를 찾았어요.
        </div>

        <div v-if="hasResults && !isLoading" class="results-container">
            <div
                v-for="result in results"
                :key="result.postId"
                class="search-result"
            >
                <div class="result-content">
                    <h3 class="result-title">{{ result.resultTitle }}</h3>
                    <el-button
                        type="warning"
                        text
                        class="detail-button"
                        @click="goToPost(result.postId)"
                    >
                        게시글 보러가기
                    </el-button>
                </div>
            </div>
        </div>

        <el-empty
            v-else-if="hasSearched && !isLoading"
            description="검색 결과가 없습니다."
        />
    </div>
</template>

<style scoped>
@import url("https://hangeul.pstatic.net/hangeul_static/css/nanum-barun-pen.css");

.search-page {
    font-family: "NanumBarunPen", sans-serif;
    padding: 24px;
    background-color: #2f2f2f;
    border-radius: 16px;
    min-height: 500px;
}

.search-header {
    text-align: center;
    margin-bottom: 24px;
}

.page-title {
    font-size: 32px;
    margin: 0;
}

.page-subtitle {
    color: #b0b0b0;
    margin-top: 8px;
}

.search-bar {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 20px;
}

.search-button {
    min-width: 90px;
}

.reset-button {
    color: #dcdcdc;
}

.search-status {
    margin-bottom: 20px;
    color: #e0e0e0;
}

.results-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.search-result {
    background-color: #3a3a3a;
    border-radius: 12px;
    padding: 16px 20px;
    border: 1px solid #4a4a4a;
    transition: border-color 0.2s ease, transform 0.2s ease;
}

.search-result:hover {
    border-color: #eebe77;
    transform: translateY(-2px);
}

.result-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.result-title {
    margin: 0;
    font-size: 22px;
}

.detail-button {
    font-size: 16px;
}
</style>
