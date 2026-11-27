import * as yup from 'yup';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
const PASSWORD_POLICY_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&^_-]{8,}$/;
export interface LoginFormValues {
    identifier: string;
    password: string;
    rememberMe: boolean;
}
export const loginSchema = yup.object({
    identifier: yup
        .string()
        .trim()
        .required('Vui lòng nhập email hoặc số điện thoại')
        .test(
            'is-email-or-phone',
            'Email hoặc số điện thoại không đúng định dạng',
            (value) => {
                if (!value) return false;
                const normalizedPhone = value.replace(/\s+/g, '');
                return EMAIL_REGEX.test(value) || PHONE_REGEX.test(normalizedPhone);
            }
        ),
    password: yup
        .string()
        .required('Vui lòng nhập mật khẩu')
        .min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
    rememberMe: yup.boolean().default(false),
})
//Đăng ký
export interface RegisterFormValues {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    agreeTerms: boolean;
}

export const registerSchema = yup.object({
    fullName: yup
        .string()
        .trim()
        .required('Vui lòng nhập họ và tên')
        .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
        .max(100, 'Họ và tên không vượt quá 100 ký tự'),
    email: yup
        .string()
        .trim()
        .required('Vui lòng nhập email')
        .matches(EMAIL_REGEX, 'Email không đúng định dạng'),
    phone: yup
        .string()
        .trim()
        .required('Vui lòng nhập số điện thoại')
        .test(
            'is-vn-phone',
            'Số điện thoại không hợp lệ (VD: 0912345678)',
            (value) => Boolean(value && PHONE_REGEX.test(value.replace(/\s+/g, '')))
        ),
    password: yup
        .string()
        .required('Vui lòng nhập mật khẩu')
        .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
        .matches(
            PASSWORD_POLICY_REGEX,
            'Mật khẩu phải bao gồm cả chữ cái và chữ số'
        ),
    confirmPassword: yup
        .string()
        .required('Vui lòng xác nhận lại mật khẩu')
        .oneOf([yup.ref('password')], 'Mật khẩu xác nhận không khớp'),
    agreeTerms: yup
        .boolean()
        .oneOf([true], 'Bạn cần đồng ý với điều khoản dịch vụ để đăng ký')
        .required(),
});