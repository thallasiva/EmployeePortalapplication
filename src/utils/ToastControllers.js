import { toast } from "react-toastify";
import { getApiError } from "./toastMessages";

const opts = { position: "top-right", autoClose: 4000 };

export const successToast = (message) => toast.success(message, opts);
export const errorToast   = (message) => toast.error(message, opts);
export const infoToast    = (message) => toast.info(message, opts);
export const warningToast = (message) => toast.warning(message, opts);

/**
 * Smart API error toast — call in every catch block.
 * @param {any}    e        — the caught error
 * @param {string} context  — what the user was trying to do (e.g. "save employee")
 */
export const apiErrorToast = (e, context = "complete this action") => {
  toast.error(getApiError(e, context), opts);
};
