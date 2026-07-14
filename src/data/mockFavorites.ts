// src/data/mockFavorites.ts
export interface FavoritePlace {
  id: number;
  name: string;
  category: string;
  rating: number;
  address: string;
}

export const mockFavorites: FavoritePlace[] = [
  {
    id: 1,
    name: "Кофейня Уголок",
    category: "Кафе",
    rating: 4.5,
    address: "ул. Ленина, 15",
  },
  {
    id: 2,
    name: "Ресторан Вкус",
    category: "Ресторан",
    rating: 4.7,
    address: "пр. Мира, 10",
  },
  {
    id: 3,
    name: "Парк Зарядье",
    category: "Парк",
    rating: 4.3,
    address: "ул. Тверская, 5",
  },
  {
    id: 4,
    name: "Музей Современного Искусства",
    category: "Музей",
    rating: 4.6,
    address: "пер. Художественный, 3",
  },
];