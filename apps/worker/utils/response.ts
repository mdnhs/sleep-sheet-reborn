export const ok = (data: unknown) => ({ success: true, data })

export const paginated = (
  data: unknown[],
  page: number,
  limit: number,
  totalItems: number,
) => ({
  success: true,
  data,
  pagination: {
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  },
})

export const err = (code: string, message: string) => ({ success: false, code, message })
