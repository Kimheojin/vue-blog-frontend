<script setup lang="ts">
import {reactive, ref, onMounted} from 'vue';
import {useRouter} from "vue-router";
import {ElMessage} from "element-plus";
import {container} from "tsyringe";
import AuthRepository from "../repository/auth/AuthRepository.ts";
import AuthService from "../service/AuthService.ts";
import LoginRequest from "../entity/auth/request/LoginRequest.ts";
import { useErrorHandler } from '../composables/useErrorHandler.ts';

const { customHandleError } = useErrorHandler();

const router = useRouter()
const AUTH_REPOSITORY = container.resolve(AuthRepository)
const AUTH_SERVICE = container.resolve(AuthService)

const state = reactive({
  login: new LoginRequest()
})

const isLoading = ref(false);

// 컴포넌트 마운트 시 이미 로그인된 상태인지 확인
onMounted(async () => {
  try {
    const isAuthenticated = await AUTH_SERVICE.isAuthenticated();
    if (isAuthenticated) {
      // 이미 로그인된 상태라면 관리자 페이지로 리다이렉트
      router.replace('/admin');
    }
  } catch (error) {
    // 인증 확인 실패는 무시 (로그인 페이지에 머물기)
    console.log('인증 확인 실패 - 로그인 페이지 유지');
  }
});

async function handleLogin() {
  // 입력값 검증
  if (!state.login.email.trim()) {
    ElMessage.warning('이메일을 입력해주세요.');
    return;
  }

  if (!state.login.password.trim()) {
    ElMessage.warning('비밀번호를 입력해주세요.');
    return;
  }

  // 이메일 형식 간단 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(state.login.email.trim())) {
    ElMessage.warning('올바른 이메일 형식을 입력해주세요.');
    return;
  }

  isLoading.value = true;

  try {
    await AUTH_REPOSITORY.login(state.login);
    ElMessage.success('로그인에 성공했습니다.');

    // 폼 초기화
    state.login = new LoginRequest();

    router.replace('/admin');
  } catch (error) {
    customHandleError(error, '로그인에 실패했습니다.');
  } finally {
    isLoading.value = false;
  }
}


</script>
<template>
  <div class="login-page">
    <div class="admin-container">
      <div class="login-title">로그인</div>

      <div class="login-form">
        <div class="form-group">
          <el-input
              v-model="state.login.email"
              placeholder="이메일 입력해 주세요"
              type="text"
              class="form-input"
              clearable
          />

          <el-input
              v-model="state.login.password"
              type="password"
              placeholder="비밀번호를 입력해 주세요"
              show-password
              @keyup.enter="handleLogin"
          />
        </div>

        <div class="form-group">
          <el-button
              class="admin-button"
              @click="handleLogin"
              :loading="isLoading"
          >로그인
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-title{
  text-align: center;
  font-size: 28px;
  margin-bottom: 20px;
  font-weight: 700;
}
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
}

.admin-container {
  width: 100%;
  max-width: 400px;
}

.form-input {
  width: 100%;
  box-sizing: border-box;
}

.admin-button {
  width: 100%;
  box-sizing: border-box;
}
.login-form{
  margin-bottom: 16px;
}
.form-group{
  margin-bottom: 16px;
}
:deep(.form-group + .form-group) {
  margin-top: 12px;
}
:deep(.form-group .el-input + .el-input) {
  margin-top: 12px;
}
</style>
