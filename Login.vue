<template>
  <div class="login-container">
    <div class="login-background"></div>
    <div class="login-overlay"></div>
    <div class="login-box">
      <div class="login-header">
        <h1>JBH-SCADA</h1>
        <p>矿山设备智能监控大屏系统</p>
      </div>

      <div class="login-form">
        <div class="form-group">
          <label>用户名</label>
          <input
              v-model="formData.username"
              type="text"
              placeholder="请输入用户名"
              @keyup.enter="handleLogin"/>
        </div>

        <div class="form-group">
          <label>密码</label>
          <input
              v-model="formData.password"
              type="password"
              placeholder="请输入密码"
              @keyup.enter="handleLogin"/>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input v-model="rememberMe" type="checkbox"/>
            记住登录状态
          </label>
        </div>

        <button class="login-btn" @click="handleLogin" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      </div>

      <div class="login-footer">
        <p>Epiroc (安百拓) · 矿山设备监控系统</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login } from '@/utils/auth'

const router = useRouter()
const route = useRoute()

const formData = ref({
  username: 'epiroc',
  password: '123456',
})

const rememberMe = ref(true)
const loading = ref(false)
const errorMsg = ref('')

onMounted(() => {
  const savedUsername = localStorage.getItem('jbh_scada_remember_username')
  if (savedUsername) {
    formData.value.username = savedUsername
  }
})

const handleLogin = () => {
  errorMsg.value = ''

  // 表单验证
  if (!formData.value.username) {
    errorMsg.value = '请输入用户名'
    return
  }

  if (!formData.value.password) {
    errorMsg.value = '请输入密码'
    return
  }

  loading.value = true

  // 模拟异步登录（100ms延迟）
  setTimeout(() => {
    const success = login(formData.value.username, formData.value.password)

    if (success) {
      // 记住用户名
      if (rememberMe.value) {
        localStorage.setItem(
            'jbh_scada_remember_username',
            formData.value.username
        )
      } else {
        localStorage.removeItem('jbh_scada_remember_username')
      }

      // 跳转到原目标页面或dashboard
      const redirect = route.query.redirect || '/dashboard'
      router.push(redirect)
    } else {
      errorMsg.value = '用户名或密码错误'
      loading.value = false
    }
  }, 100)
}
</script>

<style scoped lang="scss">
.login-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  overflow: hidden;
}

.login-background,
.login-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.login-background {
  background: radial-gradient(
      circle at 20% 20%,
      rgba(33, 150, 243, 0.25),
      transparent 55%
  ),
  radial-gradient(circle at 80% 10%, rgba(41, 182, 246, 0.2), transparent 50%),
  radial-gradient(circle at 50% 80%, rgba(0, 230, 118, 0.18), transparent 55%),
  #050716;
  filter: saturate(120%);
}

.login-overlay {
  z-index: 0;
}

.login-overlay::before,
.login-overlay::after {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.3;
  background-size: 60px 60px;
  background-repeat: repeat;
  pointer-events: none;
}

.login-overlay::before {
  background-image: linear-gradient(
      transparent 59px,
      rgba(68, 138, 255, 0.12) 1px
  ),
  linear-gradient(90deg, transparent 59px, rgba(68, 138, 255, 0.12) 1px);
}

.login-overlay::after {
  background-image: linear-gradient(
      transparent 59px,
      rgba(0, 230, 118, 0.08) 1px
  ),
  linear-gradient(90deg, transparent 59px, rgba(0, 230, 118, 0.08) 1px);
  transform: translateY(-15px);
}

.login-box {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h1 {
  font-size: 32px;
  font-weight: bold;
  color: #1e3c72;
  margin: 0 0 10px 0;
}

.login-header p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input[type='text'],
.form-group input[type='password'] {
  width: 100%;
  height: 44px;
  padding: 0 15px;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  transition: all 0.3s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #2a5298;
  box-shadow: 0 0 0 3px rgba(42, 82, 152, 0.1);
}

.checkbox-group {
  margin-bottom: 30px;
}

.checkbox-group label {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-group input[type='checkbox'] {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  cursor: pointer;
}

.login-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
  font-size: 16px;
  font-weight: bold;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(42, 82, 152, 0.4);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  margin-top: 15px;
  padding: 12px;
  background: #fee;
  color: #c33;
  font-size: 14px;
  border-radius: 6px;
  text-align: center;
}

.login-footer {
  margin-top: 30px;
  text-align: center;
  font-size: 12px;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-box {
    max-width: 100%;
    padding: 30px 20px;
  }

  .login-header h1 {
    font-size: 28px;
  }
}
</style>
