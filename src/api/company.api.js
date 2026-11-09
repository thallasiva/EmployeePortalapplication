import client, { unwrap } from './client';

const BASE = '/companies';

export const listCompanies = async () => {
  const response = await client.get(BASE);
  return response?.data?.data || [];
};

export const createCompany = async (payload) => unwrap(await client.post(BASE, payload));

export const updateCompany = async (id, payload) => unwrap(await client.put(`${BASE}/${id}`, payload));

export const listCompanyModules = async (id) => {
  const response = await client.get(`${BASE}/${id}/modules`);
  return response?.data?.data || [];
};

export const updateCompanyModules = async (id, modules) => unwrap(await client.put(`${BASE}/${id}/modules`, { modules }));
