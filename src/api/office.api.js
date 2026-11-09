import client from './client';

const BASE = '/offices';

export const listOffices = async () => {
  const response = await client.get(BASE);
  return response?.data?.data || [];
};

export const createOffice = async (payload) => {
  const response = await client.post(BASE, payload);
  return response?.data?.data;
};

export const updateOffice = async (id, payload) => {
  const response = await client.put(`${BASE}/${id}`, payload);
  return response?.data?.data;
};
