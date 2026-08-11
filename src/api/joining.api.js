import apiClient from "./client";
import axios from "axios";

const BASE = process.env.REACT_APP_API_URL || "https://backend.natsoft.io/api";


export const verifyJoiningToken = (token) =>
axios.get(`${BASE}/joining/verify`, { params: { token } }).then((r) => r.data.data);


export const getJoiningForm = (token) =>
axios.get(`${BASE}/joining/form`, { params: { token } }).then((r) => r.data.data);

export const saveJoiningFormalities = (payload) =>
axios.post(`${BASE}/joining/save`, payload).then((r) => r.data.data);


export const listJoiningInvitations = (params) =>
apiClient.get("/joining/invitations", { params }).then((r) => r.data);

export const getJoiningDetail = (id) =>
apiClient.get(`/joining/invitations/${id}`).then((r) => r.data.data);

export const reviewJoiningFormality = (id, body) =>
apiClient.put(`/joining/invitations/${id}/review`, body).then((r) => r.data.data);

export const resendJoiningInvitation = (id) =>
apiClient.post(`/joining/invitations/${id}/resend`).then((r) => r.data);

export const getJoiningByOffer = (offerId) =>
apiClient.get(`/joining/by-offer/${offerId}`).then((r) => r.data.data);
