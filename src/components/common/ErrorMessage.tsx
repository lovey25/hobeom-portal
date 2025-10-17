import { layout, text, button, cn } from "@/styles/design-system";

interface ErrorMessageProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function ErrorMessage({ title = "오류", message, action }: ErrorMessageProps) {
  return (
    <div className={`${layout.page} flex items-center justify-center`}>
      <div className="text-center max-w-md px-4">
        <div className="bg-red-50 rounded-lg p-6 mb-4">
          <svg className="mx-auto h-12 w-12 text-red-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h1 className={`${text.sectionTitle} mb-2`}>{title}</h1>
          <p className={text.secondary}>{message}</p>
        </div>
        {action && (
          <button onClick={action.onClick} className={cn(button.base, button.primary)}>
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
