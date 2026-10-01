import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  ReactNode,
} from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import "./Feedback.css";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
}

interface ConfirmOptions {
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface PromptOptions {
  title?: string;
  message?: ReactNode;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  required?: boolean;
  multiline?: boolean;
  defaultValue?: string;
}

type DialogState = (
  | { kind: "confirm"; options: ConfirmOptions; resolve: (value: boolean) => void }
  | { kind: "prompt"; options: PromptOptions; resolve: (value: string | null) => void }
) & { value: string; error?: string };

interface FeedbackContextValue {
  toast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

const ICONS: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={19} />,
  error: <XCircle size={19} />,
  warning: <AlertTriangle size={19} />,
  info: <Info size={19} />,
};

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const idRef = useRef(0);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", title?: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      window.setTimeout(() => dismissToast(id), 5200);
    },
    [dismissToast],
  );

  const success = useCallback((message: string, title?: string) => toast(message, "success", title ?? "¡Listo!"), [toast]);
  const error = useCallback((message: string, title?: string) => toast(message, "error", title ?? "Algo salió mal"), [toast]);
  const warning = useCallback((message: string, title?: string) => toast(message, "warning", title ?? "Atención"), [toast]);
  const info = useCallback((message: string, title?: string) => toast(message, "info", title), [toast]);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setDialog({ kind: "confirm", options, resolve, value: "" });
    });
  }, []);

  const prompt = useCallback((options: PromptOptions) => {
    return new Promise<string | null>((resolve) => {
      setDialog({ kind: "prompt", options, resolve, value: options.defaultValue ?? "" });
    });
  }, []);

  function closeDialog(result: boolean | string | null) {
    if (!dialog) return;
    if (dialog.kind === "confirm") dialog.resolve(result === true);
    else dialog.resolve(typeof result === "string" ? result : null);
    setDialog(null);
  }

  function handlePromptConfirm() {
    if (!dialog || dialog.kind !== "prompt") return;
    const opts = dialog.options as PromptOptions;
    const trimmed = dialog.value.trim();
    if (opts.required && !trimmed) {
      setDialog({ ...dialog, error: "Este campo es obligatorio." });
      return;
    }
    dialog.resolve(trimmed);
    setDialog(null);
  }

  return (
    <FeedbackContext.Provider value={{ toast, success, error, warning, info, confirm, prompt }}>
      {children}

      <div className="fb-toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`fb-toast fb-toast-${t.type}`}>
            <div className="fb-toast-icon">{ICONS[t.type]}</div>
            <div className="fb-toast-body">
              {t.title && <strong>{t.title}</strong>}
              <span>{t.message}</span>
            </div>
            <button
              type="button"
              className="fb-toast-close"
              aria-label="Cerrar aviso"
              onClick={() => dismissToast(t.id)}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {dialog && (
        <div className="fb-overlay" onClick={() => closeDialog(dialog.kind === "confirm" ? false : null)}>
          <div
            className={`fb-dialog ${dialog.options.danger ? "fb-dialog-danger" : ""}`}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="fb-dialog-icon">
              {dialog.options.danger ? <AlertTriangle size={22} /> : <Info size={22} />}
            </div>
            {dialog.options.title && <h3>{dialog.options.title}</h3>}
            {dialog.options.message && <p>{dialog.options.message}</p>}

            {dialog.kind === "prompt" && (
              <div className="fb-dialog-field">
                {(dialog.options as PromptOptions).multiline ?? true ? (
                  <textarea
                    autoFocus
                    value={dialog.value}
                    placeholder={(dialog.options as PromptOptions).placeholder}
                    onChange={(e) => setDialog({ ...dialog, value: e.target.value, error: undefined })}
                  />
                ) : (
                  <input
                    autoFocus
                    type="text"
                    value={dialog.value}
                    placeholder={(dialog.options as PromptOptions).placeholder}
                    onChange={(e) => setDialog({ ...dialog, value: e.target.value, error: undefined })}
                  />
                )}
                {dialog.error && <span className="fb-dialog-field-error">{dialog.error}</span>}
              </div>
            )}

            <div className="fb-dialog-actions">
              <button
                type="button"
                className="fb-btn fb-btn-ghost"
                onClick={() => closeDialog(dialog.kind === "confirm" ? false : null)}
              >
                {dialog.options.cancelLabel ?? "Cancelar"}
              </button>
              <button
                type="button"
                className={`fb-btn ${dialog.options.danger ? "fb-btn-danger" : "fb-btn-primary"}`}
                onClick={() => (dialog.kind === "confirm" ? closeDialog(true) : handlePromptConfirm())}
              >
                {dialog.options.confirmLabel ?? (dialog.options.danger ? "Sí, continuar" : "Confirmar")}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useFeedback debe usarse dentro de <FeedbackProvider>");
  return ctx;
}
