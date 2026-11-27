import { AlertCircle, Clock } from 'lucide-react';

interface AuthAlertBannerProps {
    message: string | null;
    isLocked?: boolean;
    remainingSeconds?: number;
}

export function AuthAlertBanner({
    message,
    isLocked = false,
    remainingSeconds = 0,
}: AuthAlertBannerProps) {
    if (!message && !isLocked) return null;

    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    const countdownText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    return (
        <div
            role="alert"
            className={`mb-5 flex items-start gap-2.5 rounded-2xl border p-3.5 text-xs sm:text-sm ${isLocked
                    ? 'border-amber-200 bg-amber-50 text-amber-900'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
        >
            {isLocked ? (
                <Clock className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            )}
            <div className="space-y-0.5">
                {message && <p className="font-medium leading-relaxed">{message}</p>}
                {isLocked && (
                    <p className="text-xs font-bold text-amber-800">Mở khóa sau: {countdownText}</p>
                )}
            </div>
        </div>
    );
}