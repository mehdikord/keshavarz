import type { ServiceCategory } from "@/types";

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "cat-plant",
    name: "خدمات کاشت",
    services: [
      { id: "svc-plant-wheat", categoryId: "cat-plant", name: "کاشت گندم" },
      { id: "svc-plant-bean", categoryId: "cat-plant", name: "کاشت لوبیا" },
      { id: "svc-plant-potato", categoryId: "cat-plant", name: "کاشت سیب‌زمینی" },
      { id: "svc-plant-corn", categoryId: "cat-plant", name: "کاشت ذرت" },
    ],
  },
  {
    id: "cat-harvest",
    name: "خدمات برداشت",
    services: [
      { id: "svc-harvest-wheat", categoryId: "cat-harvest", name: "برداشت گندم" },
      { id: "svc-harvest-rice", categoryId: "cat-harvest", name: "برداشت برنج" },
      { id: "svc-harvest-cotton", categoryId: "cat-harvest", name: "برداشت پنبه" },
    ],
  },
  {
    id: "cat-spray",
    name: "سم‌پاشی و کود",
    services: [
      { id: "svc-spray-pesticide", categoryId: "cat-spray", name: "سم‌پاشی" },
      { id: "svc-spray-fertilizer", categoryId: "cat-spray", name: "کودپاشی" },
      { id: "svc-spray-herbicide", categoryId: "cat-spray", name: "علف‌کش" },
    ],
  },
  {
    id: "cat-prep",
    name: "شخم و آماده‌سازی",
    services: [
      { id: "svc-plow", categoryId: "cat-prep", name: "شخم زمین" },
      { id: "svc-level", categoryId: "cat-prep", name: "تسطیح زمین" },
      { id: "svc-disc", categoryId: "cat-prep", name: "دیسک زنی" },
    ],
  },
];

export function getAllServices() {
  return SERVICE_CATEGORIES.flatMap((category) => category.services);
}

export function getServiceById(serviceId: string) {
  return getAllServices().find((service) => service.id === serviceId);
}

export function getCategoryById(categoryId: string) {
  return SERVICE_CATEGORIES.find((category) => category.id === categoryId);
}
