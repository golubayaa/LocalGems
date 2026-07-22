// src/data/mockPlaces.ts
export interface Place {
  id: number | string;
  guid?: string;
  name: string;
  category: string;
  address: string;
  status: "published" | "moderation" | "rejected";
  rating?: number;
  lat: number;
  lng: number;
  description?: string;
  photoUrl?: string;
  photos?: string[];
}

export const mockPlaces: Place[] = [
  {
    id: 1,
    guid: "019f6387-dddb-77ef-a7f2-516033659fc3",
    name: "Кофейня Уголок",
    category: "Кафе",
    address: "ул. Ленина, 15",
    status: "published",
    rating: 4.5,
    lat: 56.8389,
    lng: 60.6057,
    description: "Уютная кофейня в центре города с домашней атмосферой.",
  },
  {
    id: 2,
    name: "Ресторан Вкус",
    category: "Рестораны",
    address: "пр. Мира, 10",
    status: "moderation",
    rating: 4.7,
    lat: 56.8500,
    lng: 60.6200,
    description: "Ресторан с авторской кухней и живой музыкой.",
  },
  {
    id: 3,
    name: "Парк Зарядье",
    category: "Парки",
    address: "ул. Тверская, 5",
    status: "published",
    rating: 4.3,
    lat: 56.8300,
    lng: 60.5900,
    description: "Городской парк с современным ландшафтным дизайном.",
  },
  {
    id: 4,
    name: "Музей Современного Искусства",
    category: "Музеи",
    address: "пер. Художественный, 3",
    status: "rejected",
    rating: 4.6,
    lat: 56.8450,
    lng: 60.6150,
    description: "Выставки современного искусства и инсталляции.",
  },
  {
    id: 5,
    name: "Коворкинг Платформа",
    category: "Коворкинги",
    address: "ул. Вайнера, 12",
    status: "moderation",
    rating: 4.2,
    lat: 56.8550,
    lng: 60.6000,
    description: "Пространство для работы и творчества.",
  },
  {
    id: 6,
    name: "Магазин Местные продукты",
    category: "Магазины",
    address: "ул. Малышева, 8",
    status: "published",
    rating: 4.4,
    lat: 56.8250,
    lng: 60.6100,
    description: "Магазин фермерских продуктов и местных деликатесов.",
  },
  {
    id: 7,
    name: "Бар Конструктор",
    category: "Бары",
    address: "пр. Ленина, 22",
    status: "published",
    rating: 4.8,
    lat: 56.8600,
    lng: 60.5950,
    description: "Бар с авторскими коктейлями и индустриальным интерьером.",
  },
  {
    id: 8,
    name: "Граффити-стена",
    category: "Стрит-арт",
    address: "ул. Куйбышева, 4",
    status: "published",
    rating: 4.1,
    lat: 56.8350,
    lng: 60.6250,
    description: "Большая стена с граффити от местных художников.",
  },
  {
    id: 9,
    name: "Дом архитектора",
    category: "Архитектура",
    address: "пр. Ленина, 36",
    status: "published",
    rating: 4.9,
    lat: 56.8420,
    lng: 60.6120,
    description: "Памятник конструктивизма с музейной экспозицией.",
  },
  {
    id: 10,
    name: "Центральный рынок",
    category: "Ярмарки",
    address: "ул. Вайнера, 10",
    status: "moderation",
    rating: 4.0,
    lat: 56.8480,
    lng: 60.5980,
    description: "Рынок свежих продуктов и ярмарка ремесленников.",
  },
  {
    id: 11,
    name: "Антикафе Тайм-аут",
    category: "Нишевые места",
    address: "ул. Малышева, 20",
    status: "published",
    rating: 4.6,
    lat: 56.8520,
    lng: 60.6080,
    description: "Антикафе с настольными играми и коворкингом.",
  },
];