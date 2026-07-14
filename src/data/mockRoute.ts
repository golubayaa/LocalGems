// src/data/mockRoute.ts
export interface RoutePoint {
  id: number;
  name: string;
  address: string;
}

export const mockRoutePoints: RoutePoint[] = [
  {
    id: 1,
    name: "Кофейня Уголок",
    address: "ул. Ленина, 15",
  },
  {
    id: 2,
    name: "Ресторан Вкус",
    address: "пр. Мира, 10",
  },
  {
    id: 3,
    name: "Парк Зарядье",
    address: "ул. Тверская, 5",
  },
];