// Only these non-weapon merchandise SKUs are eligible for the teaching cart.
export const MERCHANDISE = [
  { id: 'merch-shirt', name: 'Bore & Barrel T-Shirt', price: 120000, kind: 'shirt', description: 'Cotton logo T-shirt. One size, black.' },
  { id: 'merch-notebook', name: 'Praktikum Notebook', price: 35000, kind: 'notebook', description: 'A5 notebook for class notes, 80 pages.' },
  { id: 'merch-stickers', name: 'Logo Sticker Pack', price: 15000, kind: 'stickers', description: 'Three vinyl logo stickers for your notebook.' },
]
export const rupiah = (value) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
