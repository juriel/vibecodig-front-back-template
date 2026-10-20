import axios from 'axios';
import { GlobalConfig } from '../../global-config';

const BASE = GlobalConfig.getInstance().apiUrl + 'example';

export interface ExampleDTO {
  id?: number;
  name: string;
}

export const ExampleService = {
  findAll: () => axios.get<ExampleDTO[]>(BASE).then(r => r.data),
  create: (dto: ExampleDTO) => axios.post<ExampleDTO>(BASE, dto).then(r => r.data),
  update: (id: number, dto: ExampleDTO) => axios.put<ExampleDTO>(`${BASE}/${id}`, dto).then(r => r.data),
  delete: (id: number) => axios.delete(`${BASE}/${id}`),
};
