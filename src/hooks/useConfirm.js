import { useCallback, useState } from "react";

/**
 * Manages a confirmation dialog and its pending action.
 * Works with <ConfirmDialog> from components/ui.
 *
 * @returns {{
 *   confirmState: { open, title, description, variant, onConfirm },
 *   confirm:      (options) => void,
 *   closeConfirm: () => void,
 * }}
 *
 * @example
 * const { confirmState, confirm, closeConfirm } = useConfirm();
 *
 * const handleDelete = (id) => confirm({
 *   title:       "Delete employee?",
 *   description: "This action cannot be undone.",
 *   variant:     "danger",
 *   onConfirm:   async () => { await deleteEmployee(id); closeConfirm(); refetch(); },
 * });
 *
 * <ConfirmDialog {...confirmState} onClose={closeConfirm} />
 */
export function useConfirm() {
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "Are you sure?",
    description: undefined,
    variant: "danger",
    confirmLabel: "Confirm",
    onConfirm: () => {},
  });

  const confirm = useCallback(({ title, description, variant = "danger", confirmLabel = "Confirm", onConfirm }) => {
    setConfirmState({ open: true, title, description, variant, confirmLabel, onConfirm });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState((prev) => ({ ...prev, open: false }));
  }, []);

  return { confirmState, confirm, closeConfirm };
}
