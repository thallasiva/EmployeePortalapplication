import apiClient, { unwrap } from './client';

/** Employee — my resignation(s) */
export const getMyResignations = () =>
  apiClient.get('/resignations/my').then(unwrap);

/** Manager — team resignations */
export const getTeamResignations = (params = {}) =>
  apiClient.get('/resignations/manager/team', { params }).then(unwrap);

/** Admin — all resignations */
export const getAllResignations = (params = {}) =>
  apiClient.get('/resignations/admin/all', { params }).then(unwrap);
