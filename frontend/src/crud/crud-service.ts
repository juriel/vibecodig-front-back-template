import axios from 'axios';

export abstract class CrudService<T> {
  abstract base: string;
  abstract getKey(element: T): string | number;

  findAll = (): Promise<T[]> =>
    axios.get<T[]>(this.base).then(r => r.data);

  findById = (id: string | number): Promise<T> =>
    axios.get<T>(`${this.base}/${id}`).then(r => r.data);

  create = (dto: Partial<T>): Promise<T> =>
    axios.post<T>(this.base, dto).then(r => r.data);

  update = (dto: T): Promise<T> =>
    axios.put<T>(`${this.base}/${this.getKey(dto)}`, dto).then(r => r.data);

  delete = (id: string | number): Promise<void> =>
    axios.delete(`${this.base}/${id}`).then(() => {});
}
