import * as z from 'zod'

export const step1Schema = z.object({
  title: z.string().min(5, "Название должно быть не короче 5 символов"),
  type: z.string().optional(),
  idea: z.string().min(20, "Опишите вашу идею подробнее (минимум 20 символов)"),
  projectPhotoUrls: z.array(z.string()).default([]),
  analysisPhotoUrls: z.array(z.string()).default([]),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string()
  }),
  polygon: z.array(z.array(z.number())).min(3, "Нарисуйте полигон на карте (минимум 3 точки)")
})

export type Step1FormValues = z.infer<typeof step1Schema>
