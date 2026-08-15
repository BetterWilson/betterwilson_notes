// 站点 UI 文案字典 —— 所有自定义组件通过 t() 取文案
// lang 由路由前缀判断：/en/... → 'en'，其余 → 'zh'

export type Lang = 'zh' | 'en'

const zh: Record<string, string> = {
    // RelatedArticles
    relatedHeading: '📎 相关文章',

    // ArticleMeta
    readingTime: '阅读约 {n} 分钟',
    chars: '{n} 字',
    updatedAt: '更新于',

    // LoginPage —— 通用
    login: '登录',
    register: '注册',
    accountPassword: '账号密码',
    phoneNumber: '手机号',
    username: '用户名',
    usernamePlaceholder: '请输入用户名',
    password: '密码',
    passwordPlaceholder: '请输入密码',
    rememberMe: '记住我',
    forgotPassword: '忘记密码？',
    phonePlaceholder: '请输入手机号',
    verificationCode: '验证码',
    codePlaceholder: '请输入验证码',
    getCode: '获取验证码',
    resendAfter: '{n}s 后重发',
    setPassword: '设置密码',
    setPasswordPlaceholder: '请设置密码（至少6位）',
    confirmPassword: '确认密码',
    confirmPasswordPlaceholder: '请再次输入密码',
    welcomeBack: '欢迎回来，{n}！',
    registerSuccess: '注册成功，欢迎 {n}！',
    registerSuccessPhone: '注册成功，欢迎使用 {n}！',

    // LoginPage —— 找回密码
    backToLogin: '返回登录',
    forgotPasswordTitle: '找回密码',
    forgotDesc1: '请输入注册时使用的邮箱，我们将向该邮箱发送验证码。',
    email: '邮箱地址',
    emailPlaceholder: '请输入邮箱',
    sendCode: '发送验证码',
    sentResend: '已发送，{n}s 后可重新发送',
    codeSentTo: '验证码已发送至 {n}，请查收。',
    resend: '重新发送',
    newPassword: '新密码',
    newPasswordPlaceholder: '请设置新密码（至少6位）',
    confirmNewPassword: '确认新密码',
    confirmNewPasswordPlaceholder: '请再次输入新密码',
    resetPassword: '重置密码',
    resetSuccess: '密码重置成功',
    resetSuccessSub: '请使用新密码登录',

    // 提示信息
    codeSent: '验证码已发送至 {n}（模拟）',

    // 错误提示
    errInvalidEmail: '请输入有效的邮箱地址',
    errInvalidPhone: '请输入正确的手机号',
    errEnterCode: '请输入验证码',
    errPasswordMin: '密码至少6位',
    errPasswordMismatch: '两次输入的密码不一致',
}

const en: Record<string, string> = {
    // RelatedArticles
    relatedHeading: '📎 Related Articles',

    // ArticleMeta
    readingTime: 'About {n} min read',
    chars: '{n} chars',
    updatedAt: 'Updated',

    // LoginPage —— 通用
    login: 'Sign in',
    register: 'Sign up',
    accountPassword: 'Account & Password',
    phoneNumber: 'Phone Number',
    username: 'Username',
    usernamePlaceholder: 'Enter your username',
    password: 'Password',
    passwordPlaceholder: 'Enter your password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    phonePlaceholder: 'Enter your phone number',
    verificationCode: 'Verification Code',
    codePlaceholder: 'Enter the code',
    getCode: 'Get Code',
    resendAfter: 'Resend in {n}s',
    setPassword: 'Set Password',
    setPasswordPlaceholder: 'Set a password (at least 6 characters)',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Enter the password again',
    welcomeBack: 'Welcome back, {n}!',
    registerSuccess: 'Sign up successful, welcome {n}!',
    registerSuccessPhone: 'Sign up successful, welcome {n}!',

    // LoginPage —— 找回密码
    backToLogin: 'Back to Sign in',
    forgotPasswordTitle: 'Forgot Password',
    forgotDesc1: "Enter the email you registered with, and we'll send a verification code to it.",
    email: 'Email',
    emailPlaceholder: 'Enter your email',
    sendCode: 'Send Code',
    sentResend: 'Sent, resend in {n}s',
    codeSentTo: 'A verification code has been sent to {n}. Please check.',
    resend: 'Resend',
    newPassword: 'New Password',
    newPasswordPlaceholder: 'Set a new password (at least 6 characters)',
    confirmNewPassword: 'Confirm New Password',
    confirmNewPasswordPlaceholder: 'Enter the new password again',
    resetPassword: 'Reset Password',
    resetSuccess: 'Password Reset Successful',
    resetSuccessSub: 'Please sign in with your new password',

    // 提示信息
    codeSent: 'Verification code sent to {n} (demo)',

    // 错误提示
    errInvalidEmail: 'Please enter a valid email address',
    errInvalidPhone: 'Please enter a valid phone number',
    errEnterCode: 'Please enter the verification code',
    errPasswordMin: 'Password must be at least 6 characters',
    errPasswordMismatch: 'Passwords do not match',
}

const dict: Record<Lang, Record<string, string>> = { zh, en }

/** 根据路由路径判断语言；无前缀的根跳转页默认中文 */
export function getLang(path: string): Lang {
    if (path.startsWith('/zh/')) return 'zh'
    if (path.startsWith('/en/')) return 'en'
    return 'zh'
}

/** 取文案，支持 {key} 占位符替换；找不到 key 时回退中文，再回退 key 本身 */
export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
    const msg = dict[lang][key] ?? dict.zh[key] ?? key
    if (!vars) return msg
    return msg.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))
}
