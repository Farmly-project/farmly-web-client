import React from "react";
import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";

const marketLinks = [
    { label: "Tất cả sản phẩm", path: "/products" },
    { label: "FEFO Flash sales", path: "/flash-sale" },
    { label: "Nông sản hàng tuần", path: "/subscriptions" },
    { label: "Xác minh lô hàng", path: "/qr-trace" },
];

const originLinks = [
    { label: "Sức khỏe vi sinh vật đất", path: "/origin/soil-health" },
    { label: "Nhật ký kiểm tra nước", path: "/origin/water-logs" },
    { label: "Luân canh cây trồng", path: "/origin/crop-rotation" },
    { label: "Lịch thu hoạch", path: "/origin/harvest-schedule" },
];

export default function Footer() {
    return (
        <footer className="w-full bg-farmly-mint border-t border-farmly-soft text-neutral-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
                {/* Main Grid: Responsive 1 cột (Mobile) -> 2 cột (Tablet) -> 12 cột (Laptop/Desktop) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 pb-10">
                    {/* Cột 1: Brand Info & Certification (Chiếm 5/12 cột trên màn hình lớn) */}
                    <div className="lg:col-span-5 flex flex-col justify-between space-y-5 pr-0 lg:pr-8">
                        <div className="space-y-4">
                            {/* Logo */}
                            <Link to="/" className="inline-flex items-center gap-2.5 group">
                                <svg
                                    viewBox="0 0 32 32"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-7 h-7 text-farmly-dark transition-transform duration-200 group-hover:scale-105"
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
                                <span className="text-xl font-extrabold tracking-tight text-farmly-dark">
                                    FARMLY
                                </span>
                            </Link>

                            {/* Description */}
                            <p className="text-sm leading-relaxed text-neutral-600 max-w-sm">
                                Hồ sơ canh tác minh bạch triệt để, truy xuất nguồn gốc từ một trang trại duy nhất, cùng trách nhiệm giải trình xuyên suốt từ lúc thu hoạch đến khi sản phẩm tới tay khách hàng. Được nuôi trồng trong đất sống đạt chứng nhận, hoàn toàn không sử dụng các yếu tố đầu vào tổng hợp.
                            </p>
                        </div>

                        {/* Certification Badge */}
                        <div className="inline-flex items-center gap-2 text-xs font-bold text-farmly-dark pt-1">
                            <BadgeCheck className="w-4 h-4 shrink-0 stroke-[2.2]" />
                            <span>Certified Demeter Biodynamic • USDA Organic</span>
                        </div>
                    </div>

                    {/* Cột 2: THỊ TRƯỜNG (2/12 cột) */}
                    <div className="lg:col-span-2 space-y-3.5">
                        <h3 className="text-xs font-extrabold tracking-wider text-neutral-900 uppercase">
                            THỊ TRƯỜNG
                        </h3>
                        <ul className="space-y-2.5 text-sm">
                            {marketLinks.map((item) => (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className="text-neutral-600 hover:text-farmly-dark transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Cột 3: NGUỒN GỐC (2/12 cột) */}
                    <div className="lg:col-span-2 space-y-3.5">
                        <h3 className="text-xs font-extrabold tracking-wider text-neutral-900 uppercase">
                            NGUỒN GỐC
                        </h3>
                        <ul className="space-y-2.5 text-sm">
                            {originLinks.map((item) => (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        className="text-neutral-600 hover:text-farmly-dark transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Cột 4: CAM KẾT MINH BẠCH (3/12 cột) */}
                    <div className="lg:col-span-3 space-y-3.5">
                        <h3 className="text-xs font-extrabold tracking-wider text-neutral-900 uppercase">
                            CAM KẾT MINH BẠCH
                        </h3>
                        <div className="space-y-2.5 text-sm text-neutral-600">
                            <p>
                                Khu đất Valley Field
                                <br />
                                số 402-A
                            </p>
                            <p>
                                Gửi đi: Hàng ngày vào lúc
                                <br />
                                5:00 sáng
                            </p>
                            <p>
                                <a
                                    href="mailto:support@farmlyorganic.com"
                                    className="hover:text-farmly-dark transition-colors break-all"
                                >
                                    support@farmlyorganic.com
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar: Legal links & Copyright */}
                <div className="pt-6 border-t border-farmly-soft/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-semibold text-neutral-700">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <Link to="/terms-origin" className="hover:text-farmly-dark transition-colors">
                            Điều khoản về nguồn gốc xuất xứ
                        </Link>
                        <Link to="/privacy-policy" className="hover:text-farmly-dark transition-colors">
                            Chính sách
                        </Link>
                        <Link to="/cold-chain" className="hover:text-farmly-dark transition-colors">
                            Cam kết chuỗi cung ứng lạnh
                        </Link>
                    </div>

                    <p className="text-neutral-600">
                        © 2026 Farmly Organic Farms Inc.
                    </p>
                </div>
            </div>
        </footer>
    );
}