<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-logo">
        <img src="/logo.png" alt="logo" />
        <h1>BetterWilson Notes</h1>
      </div>

      <!-- 找回密码视图 -->
      <template v-if="mode === 'forgot'">
        <div class="forgot-header">
          <button class="back-btn" @click="switchMode('login')">
            <span class="back-arrow">←</span> {{ t(lang, 'backToLogin') }}
          </button>
          <h2 class="forgot-title">{{ t(lang, 'forgotPasswordTitle') }}</h2>
        </div>

        <!-- Step 1：输入邮箱 -->
        <template v-if="forgotStep === 1">
          <p class="forgot-desc">{{ t(lang, 'forgotDesc1') }}</p>
          <form class="form" @submit.prevent="sendForgotCode">
            <div class="field">
              <label>{{ t(lang, 'email') }}</label>
              <input v-model="forgot.email" type="email" :placeholder="t(lang, 'emailPlaceholder')" autocomplete="email" required />
            </div>
            <p v-if="forgotError" class="error-msg">{{ forgotError }}</p>
            <button type="submit" class="submit-btn" :disabled="forgotCountdown > 0">
              {{ forgotCountdown > 0 ? t(lang, 'sentResend', { n: forgotCountdown }) : t(lang, 'sendCode') }}
            </button>
          </form>
        </template>

        <!-- Step 2：填写验证码 + 新密码 -->
        <template v-else-if="forgotStep === 2">
          <p class="forgot-desc">{{ t(lang, 'codeSentTo', { n: forgot.email }) }}</p>
          <form class="form" @submit.prevent="handleResetPassword">
            <div class="field">
              <label>{{ t(lang, 'verificationCode') }}</label>
              <div class="code-row">
                <input v-model="forgot.code" type="text" :placeholder="t(lang, 'codePlaceholder')" maxlength="6" required />
                <button type="button" class="code-btn" :disabled="forgotCountdown > 0" @click="sendForgotCode">
                  {{ forgotCountdown > 0 ? `${forgotCountdown}s` : t(lang, 'resend') }}
                </button>
              </div>
            </div>
            <div class="field">
              <label>{{ t(lang, 'newPassword') }}</label>
              <input v-model="forgot.password" type="password" :placeholder="t(lang, 'newPasswordPlaceholder')" autocomplete="new-password" required minlength="6" />
            </div>
            <div class="field">
              <label>{{ t(lang, 'confirmNewPassword') }}</label>
              <input v-model="forgot.confirm" type="password" :placeholder="t(lang, 'confirmNewPasswordPlaceholder')" autocomplete="new-password" required />
            </div>
            <p v-if="forgotError" class="error-msg">{{ forgotError }}</p>
            <button type="submit" class="submit-btn">{{ t(lang, 'resetPassword') }}</button>
          </form>
        </template>

        <!-- Step 3：重置成功 -->
        <template v-else-if="forgotStep === 3">
          <div class="reset-success">
            <div class="success-icon">✓</div>
            <p class="success-title">{{ t(lang, 'resetSuccess') }}</p>
            <p class="success-sub">{{ t(lang, 'resetSuccessSub') }}</p>
            <button class="submit-btn" @click="switchMode('login')">{{ t(lang, 'backToLogin') }}</button>
          </div>
        </template>

        <p v-if="forgotMessage" class="success-msg">{{ forgotMessage }}</p>
      </template>

      <!-- 登录 / 注册视图 -->
      <template v-else>
        <!-- 主 Tab：登录 / 注册 -->
        <div class="tab-switch">
          <button :class="{ active: mode === 'login' }" @click="switchMode('login')">{{ t(lang, 'login') }}</button>
          <button :class="{ active: mode === 'register' }" @click="switchMode('register')">{{ t(lang, 'register') }}</button>
        </div>

        <!-- 子 Tab：账号密码 / 手机号 -->
        <div class="method-switch">
          <button :class="{ active: method === 'account' }" @click="switchMethod('account')">{{ t(lang, 'accountPassword') }}</button>
          <button :class="{ active: method === 'phone' }" @click="switchMethod('phone')">{{ t(lang, 'phoneNumber') }}</button>
        </div>

        <!-- 登录：账号密码 -->
        <form v-if="mode === 'login' && method === 'account'" class="form" @submit.prevent="handleLogin">
          <div class="field">
            <label>{{ t(lang, 'username') }}</label>
            <input v-model="login.username" type="text" :placeholder="t(lang, 'usernamePlaceholder')" autocomplete="username" required />
          </div>
          <div class="field">
            <label>{{ t(lang, 'password') }}</label>
            <input v-model="login.password" type="password" :placeholder="t(lang, 'passwordPlaceholder')" autocomplete="current-password" required />
          </div>
          <div class="field-row">
            <label class="checkbox-label">
              <input v-model="login.remember" type="checkbox" />
              <span>{{ t(lang, 'rememberMe') }}</span>
            </label>
            <button type="button" class="forgot-link" @click="openForgot">{{ t(lang, 'forgotPassword') }}</button>
          </div>
          <button type="submit" class="submit-btn">{{ t(lang, 'login') }}</button>
        </form>

        <!-- 登录：手机号 -->
        <form v-else-if="mode === 'login' && method === 'phone'" class="form" @submit.prevent="handlePhoneLogin">
          <div class="field">
            <label>{{ t(lang, 'phoneNumber') }}</label>
            <input v-model="phoneLogin.phone" type="tel" :placeholder="t(lang, 'phonePlaceholder')" maxlength="11" required />
          </div>
          <div class="field">
            <label>{{ t(lang, 'verificationCode') }}</label>
            <div class="code-row">
              <input v-model="phoneLogin.code" type="text" :placeholder="t(lang, 'codePlaceholder')" maxlength="6" required />
              <button type="button" class="code-btn" :disabled="codeCountdown > 0" @click="sendCode('login')">
                {{ codeCountdown > 0 ? t(lang, 'resendAfter', { n: codeCountdown }) : t(lang, 'getCode') }}
              </button>
            </div>
          </div>
          <p v-if="phoneLoginError" class="error-msg">{{ phoneLoginError }}</p>
          <button type="submit" class="submit-btn">{{ t(lang, 'login') }}</button>
        </form>

        <!-- 注册：账号密码 -->
        <form v-else-if="mode === 'register' && method === 'account'" class="form" @submit.prevent="handleRegister">
          <div class="field">
            <label>{{ t(lang, 'username') }}</label>
            <input v-model="reg.username" type="text" :placeholder="t(lang, 'usernamePlaceholder')" autocomplete="username" required />
          </div>
          <div class="field">
            <label>{{ t(lang, 'email') }}</label>
            <input v-model="reg.email" type="email" :placeholder="t(lang, 'emailPlaceholder')" autocomplete="email" required />
          </div>
          <div class="field">
            <label>{{ t(lang, 'password') }}</label>
            <input v-model="reg.password" type="password" :placeholder="t(lang, 'setPasswordPlaceholder')" autocomplete="new-password" required minlength="6" />
          </div>
          <div class="field">
            <label>{{ t(lang, 'confirmPassword') }}</label>
            <input v-model="reg.confirm" type="password" :placeholder="t(lang, 'confirmPasswordPlaceholder')" autocomplete="new-password" required />
          </div>
          <p v-if="regError" class="error-msg">{{ regError }}</p>
          <button type="submit" class="submit-btn">{{ t(lang, 'register') }}</button>
        </form>

        <!-- 注册：手机号 -->
        <form v-else-if="mode === 'register' && method === 'phone'" class="form" @submit.prevent="handlePhoneRegister">
          <div class="field">
            <label>{{ t(lang, 'phoneNumber') }}</label>
            <input v-model="phoneReg.phone" type="tel" :placeholder="t(lang, 'phonePlaceholder')" maxlength="11" required />
          </div>
          <div class="field">
            <label>{{ t(lang, 'verificationCode') }}</label>
            <div class="code-row">
              <input v-model="phoneReg.code" type="text" :placeholder="t(lang, 'codePlaceholder')" maxlength="6" required />
              <button type="button" class="code-btn" :disabled="codeCountdown > 0" @click="sendCode('register')">
                {{ codeCountdown > 0 ? t(lang, 'resendAfter', { n: codeCountdown }) : t(lang, 'getCode') }}
              </button>
            </div>
          </div>
          <div class="field">
            <label>{{ t(lang, 'setPassword') }}</label>
            <input v-model="phoneReg.password" type="password" :placeholder="t(lang, 'setPasswordPlaceholder')" autocomplete="new-password" required minlength="6" />
          </div>
          <div class="field">
            <label>{{ t(lang, 'confirmPassword') }}</label>
            <input v-model="phoneReg.confirm" type="password" :placeholder="t(lang, 'confirmPasswordPlaceholder')" autocomplete="new-password" required />
          </div>
          <p v-if="phoneRegError" class="error-msg">{{ phoneRegError }}</p>
          <button type="submit" class="submit-btn">{{ t(lang, 'register') }}</button>
        </form>

        <p v-if="message" class="success-msg">{{ message }}</p>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute } from 'vitepress'
import { t, getLang } from '../locales'

const route = useRoute()

// 当前语言：'zh' | 'en'（登录页在 /zh/login/ 与 /en/login/ 两个路由下复用）
const lang = computed(() => getLang(route.path))

const mode = ref('login')       // 'login' | 'register' | 'forgot'
const method = ref('account')
const message = ref('')

// 账号密码登录
const login = reactive({ username: '', password: '', remember: false })
// 手机号登录
const phoneLogin = reactive({ phone: '', code: '' })
const phoneLoginError = ref('')
// 账号密码注册
const reg = reactive({ username: '', email: '', password: '', confirm: '' })
const regError = ref('')
// 手机号注册
const phoneReg = reactive({ phone: '', code: '', password: '', confirm: '' })
const phoneRegError = ref('')

// 验证码倒计时
const codeCountdown = ref(0)
let codeTimer = null

// 找回密码
const forgotStep = ref(1)       // 1=填邮箱 2=填验证码+新密码 3=成功
const forgotError = ref('')
const forgotMessage = ref('')
const forgotCountdown = ref(0)
let forgotTimer = null
const forgot = reactive({ email: '', code: '', password: '', confirm: '' })

function switchMode(m) {
  mode.value = m
  message.value = ''
  codeCountdown.value = 0
  clearInterval(codeTimer)
}

function switchMethod(m) {
  method.value = m
  message.value = ''
  codeCountdown.value = 0
  clearInterval(codeTimer)
}

function openForgot() {
  forgotStep.value = 1
  forgotError.value = ''
  forgotMessage.value = ''
  forgotCountdown.value = 0
  clearInterval(forgotTimer)
  forgot.email = ''
  forgot.code = ''
  forgot.password = ''
  forgot.confirm = ''
  mode.value = 'forgot'
}

function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone)
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function startForgotCountdown() {
  forgotCountdown.value = 60
  forgotTimer = setInterval(() => {
    forgotCountdown.value--
    if (forgotCountdown.value <= 0) clearInterval(forgotTimer)
  }, 1000)
}

function sendForgotCode() {
  forgotError.value = ''
  if (!isValidEmail(forgot.email)) {
    forgotError.value = t(lang.value, 'errInvalidEmail')
    return
  }
  // 模拟发送
  forgotMessage.value = t(lang.value, 'codeSent', { n: forgot.email })
  startForgotCountdown()
  forgotStep.value = 2
}

function handleResetPassword() {
  forgotError.value = ''
  if (!forgot.code) {
    forgotError.value = t(lang.value, 'errEnterCode')
    return
  }
  if (forgot.password.length < 6) {
    forgotError.value = t(lang.value, 'errPasswordMin')
    return
  }
  if (forgot.password !== forgot.confirm) {
    forgotError.value = t(lang.value, 'errPasswordMismatch')
    return
  }
  clearInterval(forgotTimer)
  forgotStep.value = 3
  forgotMessage.value = ''
}

function sendCode(scene) {
  const phone = scene === 'login' ? phoneLogin.phone : phoneReg.phone
  if (!isValidPhone(phone)) {
    if (scene === 'login') phoneLoginError.value = t(lang.value, 'errInvalidPhone')
    else phoneRegError.value = t(lang.value, 'errInvalidPhone')
    return
  }
  if (scene === 'login') phoneLoginError.value = ''
  else phoneRegError.value = ''
  message.value = t(lang.value, 'codeSent', { n: phone })
  codeCountdown.value = 60
  codeTimer = setInterval(() => {
    codeCountdown.value--
    if (codeCountdown.value <= 0) clearInterval(codeTimer)
  }, 1000)
}

function handleLogin() {
  message.value = t(lang.value, 'welcomeBack', { n: login.username })
}

function handlePhoneLogin() {
  phoneLoginError.value = ''
  if (!isValidPhone(phoneLogin.phone)) {
    phoneLoginError.value = t(lang.value, 'errInvalidPhone')
    return
  }
  message.value = t(lang.value, 'welcomeBack', { n: phoneLogin.phone })
}

function handleRegister() {
  regError.value = ''
  if (reg.password !== reg.confirm) {
    regError.value = t(lang.value, 'errPasswordMismatch')
    return
  }
  message.value = t(lang.value, 'registerSuccess', { n: reg.username })
}

function handlePhoneRegister() {
  phoneRegError.value = ''
  if (!isValidPhone(phoneReg.phone)) {
    phoneRegError.value = t(lang.value, 'errInvalidPhone')
    return
  }
  if (phoneReg.password !== phoneReg.confirm) {
    phoneRegError.value = t(lang.value, 'errPasswordMismatch')
    return
  }
  message.value = t(lang.value, 'registerSuccessPhone', { n: phoneReg.phone })
}
</script>

<style scoped>
.login-container {
  min-height: calc(100vh - var(--vp-nav-height));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: transparent;
  position: relative;
  z-index: 1;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: color-mix(in srgb, var(--vp-c-bg-soft) 78%, transparent);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 2.5rem 2rem;
  box-shadow: 0 12px 32px -8px rgba(65, 90, 200, 0.25);
}

.login-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.login-logo img {
  width: 60px;
  height: 50px;
  border-radius: 8px;
}

.login-logo h1 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0;
  border: none;
  padding: 0;
}

/* 主 Tab */
.tab-switch {
  display: flex;
  background: var(--vp-c-bg-mute);
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 0.8rem;
}

.tab-switch button {
  flex: 1;
  padding: 0.5rem;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  color: var(--vp-c-text-2);
  transition: all 0.2s;
}

.tab-switch button.active {
  background: var(--vp-c-bg);
  color: var(--vp-c-brand-1);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

/* 子 Tab */
.method-switch {
  display: flex;
  gap: 1.2rem;
  margin-bottom: 1.6rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.method-switch button {
  padding: 0.35rem 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: all 0.2s;
}

.method-switch button.active {
  color: var(--vp-c-brand-1);
  font-weight: 600;
  border-bottom-color: var(--vp-c-brand-1);
}

/* 找回密码 */
.forgot-header {
  margin-bottom: 1.2rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: none;
  background: transparent;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 0.8rem;
  transition: color 0.2s;
}

.back-btn:hover {
  color: var(--vp-c-brand-1);
}

.back-arrow {
  font-size: 1rem;
}

.forgot-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0;
  border: none;
  padding: 0;
}

.forgot-desc {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  margin: 0 0 1.4rem;
  line-height: 1.6;
}

.forgot-desc strong {
  color: var(--vp-c-text-1);
}

/* 重置成功 */
.reset-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 1.5rem 0;
}

.success-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 1.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.success-title {
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0.4rem 0 0;
}

.success-sub {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  margin: 0 0 0.8rem;
}

/* 表单通用 */
.form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.field input {
  padding: 0.6rem 0.85rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 7px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 0.95rem;
  transition: border-color 0.2s;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.field input:focus {
  border-color: var(--vp-c-brand-1);
}

.code-row {
  display: flex;
  gap: 0.6rem;
}

.code-row input {
  flex: 1;
  min-width: 0;
}

.code-btn {
  flex-shrink: 0;
  padding: 0 0.9rem;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 7px;
  background: transparent;
  color: var(--vp-c-brand-1);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.code-btn:hover:not(:disabled) {
  background: var(--vp-c-brand-1);
  color: #fff;
}

.code-btn:disabled {
  border-color: var(--vp-c-divider);
  color: var(--vp-c-text-3);
  cursor: not-allowed;
}

.field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.forgot-link {
  border: none;
  background: transparent;
  font-size: 0.875rem;
  color: var(--vp-c-brand-1);
  cursor: pointer;
  padding: 0;
}

.forgot-link:hover {
  text-decoration: underline;
}

.submit-btn {
  width: 100%;
  padding: 0.65rem;
  background: var(--vp-c-brand-1);
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-top: 0.3rem;
}

.submit-btn:hover:not(:disabled) {
  background: var(--vp-c-brand-2);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-msg {
  color: var(--vp-c-danger-1, #f43f5e);
  font-size: 0.875rem;
  margin: -0.4rem 0 0;
}

.success-msg {
  margin-top: 1rem;
  text-align: center;
  color: var(--vp-c-brand-1);
  font-size: 0.875rem;
}
</style>
