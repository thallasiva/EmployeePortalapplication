import { useCallback, useState } from "react";

/**
 * Manages open/close state for modals and flyouts.
 * Optionally stores a payload (e.g. the row being edited).
 *
 * @param {boolean} [initial=false]
 *
 * @returns {{
 *   open:   boolean,
 *   data:   any,
 *   show:   (payload?: any) => void,
 *   hide:   () => void,
 *   toggle: () => void,
 * }}
 *
 * @example
 * const editModal = useModal();
 * <Button onClick={() => editModal.show(row)}>Edit</Button>
 * <Modal open={editModal.open} onClose={editModal.hide}>
 *   <EditForm item={editModal.data} />
 * </Modal>
 */
export function useModal(initial = false) {
  const [open, setOpen] = useState(initial);
  const [data, setData] = useState(null);

  const show = useCallback((payload = null) => {
    setData(payload);
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    setOpen(false);
    // Delay clearing data so closing animation doesn't flicker
    setTimeout(() => setData(null), 200);
  }, []);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  return { open, data, show, hide, toggle };
}
