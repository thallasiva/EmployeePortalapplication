import apiClient, { unwrap } from './client';


export const getMyResignations = () =>
apiClient.get('/resignations/my').then(unwrap);


export const getTeamResignations = (params = {}) =>
apiClient.get('/resignations/manager/team', { params }).then(unwrap);


export const getAllResignations = (params = {}) =>
apiClient.get('/resignations/admin/all', { params }).then(unwrap);
