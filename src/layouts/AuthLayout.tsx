import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface AuthLayoutProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    footer?: ReactNode;
    maxWidthClass?: string;
}

export function AuthLayout({
    title,
    subtitle,
    children,
    footer,
    maxWidthClass = 'max-w-md',
}: AuthLayoutProps) {
    return (
        <div className="min-h-screen w-full bg-[#F3F8F3] flex flex-col justify-center items-center px-4 py-6 sm:py-10">
            <div
                className={`w-full ${maxWidthClass} rounded-3xl bg-white p-6 sm:p-9 shadow-sm border border-emerald-900/10`}
            >

                <div className="flex items-center justify-between gap-2">
                    <Link
                        to="/"
                        className="inline-flex min-h-11 items-center gap-2.5 group"
                        aria-label="Về trang chủ Farmly"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DDF2E2] text-[#1B4332]">
                            <svg
                                viewBox="0 0 32 32"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-6 h-6 transition-transform duration-200 group-hover:scale-105"
                            >
                                <path
                                    d="M26 6C16 6 7 11.5 7 21C7 23.5 8 25.5 9.5 26.5C11 27.5 13 27 15.5 26.5C23 25 26 17 26 6Z"
                                    stroke="currentColor"
                                    strokeWidth="2.4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M7 26C11.5 21 16 17 22 13"
                                    stroke="currentColor"
                                    strokeWidth="2.4"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <div className="flex flex-col leading-none">
                            <span className="text-lg font-extrabold tracking-tight text-[#1B4332]">
                                FARMLY
                            </span>
                            <span className="text-[9px] font-bold tracking-[0.12em] text-gray-500 mt-0.5 uppercase">
                                SINGLE-ORIGIN PRODUCE
                            </span>
                        </div>
                    </Link>

                    <Link
                        to="/"
                        className="inline-flex min-h-11 px-2 items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1B4332] hover:text-emerald-700 transition shrink-0"
                    >
                        <ArrowLeft className="h-4 w-4 shrink-0" />
                        <span>Về trang chủ</span>
                    </Link>
                </div>

                {/* Tiêu đề & Mô tả trang */}
                <div className="mt-7 sm:mt-8 text-center">
                    <h1 className="text-2xl sm:text-[28px] font-extrabold tracking-tight text-gray-900">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-1.5 text-xs sm:text-sm text-gray-500 leading-relaxed">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="mt-6">{children}</div>


                {footer && <div className="mt-7 pt-1">{footer}</div>}
            </div>
        </div>
    );
}

export default AuthLayout;