/**
 * Merch grid — the real WanderCraft storefront.
 *
 * These are the live products from https://shopwandercraft.com (a Fourthwall
 * store). Each card links straight to its product page; "Visit Full Store"
 * (see js/data/links.js → STORE_LINKS.fullStore) opens the shop home.
 *
 * Fields:
 *   id        slug used as the DOM hook + dedupe key
 *   name      product title as shown in the store
 *   category  short label under the name (Hoodie, T-Shirt, Stickers, Desk Mat)
 *   price     display string, matches the store
 *   image     Fourthwall CDN image (w:720 render) — hotlinked from the store
 *   url       full product URL on shopwandercraft.com
 *   badge     optional corner pill { label, variant: 'new' | 'featured' | 'eco' }
 *
 * To refresh: re-pull names/prices/images from the store and swap them in here.
 */

export const MERCH_ITEMS = [
  {
    id: 's2-hoodie',
    name: 'Official WanderCraft S2 Hoodie',
    category: 'Hoodie',
    price: '$60.00',
    image: 'https://imgproxy.fourthwall.dev/e8dUhzL1lRWcJVrwAh-W-OBH6c1yVZmcMMgseBOkpeQ/w:720/sm:1/enc/0TO7Oc8br0M4wtYN/hjQevVSTd5p7Z3Ql/knOy0FUtaf9DNY5B/2kdPhLhQkcyM81KX/DZmyIPXDJ3UJpdm0/-bli5YPQW8ilmuYa/zE4D9aQr8J8zuJTl/DsUXUE9fSG72pBxN/B2QMvb55d1QyEen1/2blQKcm078vI3cFz/X4EXJJ1ZrXxPmZGI/T8ccwIkkBpZDsJIK/hsSvjs9damJbEs3M/En7LeIthX8Rt2tIp/YO4UHYXJQcc.jpg',
    url: 'https://shopwandercraft.com/products/official-wandercraft-s2-hoodie'
  },
  {
    id: 's2-tee',
    name: 'Official WanderCraft S2 T-Shirt',
    category: 'T-Shirt',
    price: '$32.00',
    image: 'https://imgproxy.fourthwall.dev/a7QrdVCPl91rev8hgNc7GgNUWZOnF8BGrMiZtAt-81E/w:720/sm:1/enc/QQMmDHv89_JNl3IY/E9dKCAXQ63OpWMOw/0tkmMPLMxrGB3wMt/PxVTsMOXT8ISNuj0/OZ7qxd-w-Qb2Y0ht/dSFlKYBPOBeQGIuH/MjejcTn8oq5OX-s5/Je3EsdTArxLCq5NL/Gw5L5ZJci_1LtIYN/ABCRmRlLf2MzKFAx/IGPFUjEy-x8zkAyX/gKzslupKe-7mrm-D/srHus_aNVAd15-dC/X5NQU1h-qZFby9qg/HNJaiZLJYu4.jpg',
    url: 'https://shopwandercraft.com/products/official-wandercraft-s2-t-shirt',
    badge: null,
  },
  {
    id: 'wanderers-hoodie',
    name: '"The Wanderers" — Official Hoodie',
    category: 'Hoodie',
    price: '$60.00',
    image: 'https://imgproxy.fourthwall.dev/R7SIbzeeqSqTCvy2Zvu-uu0no2oHgJk7wa99yQpX8Ew/w:720/sm:1/enc/m3Hu5SM8WTFnEzgq/cogZZOvufK_WKDWe/L_f32WJyXQQG2o5_/hFaDYI1cOr9NF9qS/dAGekoN28Fs-a9k1/9K4mkWRjRVh7WEFE/fv0X3flafLLVYdmm/J_VMcrQMyWPHTpQJ/GKnxs4cWAHnxq4tO/Db4XE5sDTgD8ikda/TKW3s14XPfP_lwef/jtunVHdh0SFaL2yP/i6JSX5KieG45kIAc/-DwDwnZXrvZoz4EM/8Hd_STMHiPs.jpg',
    url: 'https://shopwandercraft.com/products/the-wanderers-official-hoodie',
    badge: null,
  },
  {
    id: 'wanderers-tee',
    name: '"The Wanderers" — Official T-Shirt',
    category: 'T-Shirt',
    price: '$32.00',
    image: 'https://imgproxy.fourthwall.dev/zmROWR2KRvjCp_Kp1EfrspYd7TNEIQJey0d9xcVESXw/w:720/sm:1/enc/y7zjDx6sQ8vL2egr/WzlGoSObivCU0J3K/d_a0KYvaRuUYXpFP/bYHG3SnyGi1DnmMs/OG6E7vmx6kVkoBny/QYOaRuMnlfNPJr4X/stsUSpsg_OKTOV9o/3SsFSiN-Vdv3mBlX/r6ekBzP7_CGfEVZz/C93nzoR7RDLQQ9lt/LtfaxtoiKdit0NtU/wd6BSTgW3GPNli-u/q4fxEWIuxOOntmcr/WQh4rBplIX_MfBKg/ArUOlQAH7zg.jpg',
    url: 'https://shopwandercraft.com/products/the-wanderers-official-t-shirt',
    badge: null,
  },
  {
    id: 'dream-hoodie',
    name: 'Dream it. Mine it. Build it. — Hoodie',
    category: 'Hoodie',
    price: '$60.00',
    image: 'https://imgproxy.fourthwall.dev/e66bS8H9luXx4XwIj103NRTUS4vsFTRyTqzuQJI_Ya4/w:720/sm:1/enc/MsIM8xh3OoBzIM11/oRRDiXUqIRJi7Yfw/MhYr4YTiuNW-5l61/KI07bFp6ca2IWe4t/vFWZaPfdO-fo5Ax3/fotxrYu2cZe0RD5r/B12QDHD7hHM7m0LQ/yZ_JYE3kLib7DNLC/7L8M6UEYSjX5W-nn/Ha55SfFGnaupLxmz/ko5q9QlpssCi8ug0/HLj60TvX9HICkDvK/V14lOhE7rrVF6ekz/NsN6PTh-H-kMpkY4/EEmOKlSw7xo.jpg',
    url: 'https://shopwandercraft.com/products/dream-it-mine-it-build-it-official-hoodie',
    badge: null,
  },
  {
    id: 'dream-tee',
    name: 'Dream it. Mine it. Build it. — T-Shirt',
    category: 'T-Shirt',
    price: '$32.00',
    image: 'https://imgproxy.fourthwall.dev/B5YeXFOjVXkOCANMObnV0JdN1T54SXga8df6l-4gKhU/w:720/sm:1/enc/9TRaCmqr9OHnMj7V/EBDRMz8kSu8cVLag/-uqdiqLDObPZ87tU/AFXHLkYiXeP8hwIK/vCDEDZti-OMLVXvY/xTlHhi197ifOKlfX/3Lb-3p8SYA7HbsiY/Utrg6k6VRePSDycd/sH0WqhckpS7DEWiY/-h_FOt8a_wvI8RT3/GJPdBpiTsAlDRgbd/FAZF7Ki5gl77_t-9/15IFZcZQbYq0rRnq/8Fg-2vivjxM_TURk/Y7ivpYjxujc.jpg',
    url: 'https://shopwandercraft.com/products/dream-it-mine-it-build-it-official-t-shirt',
    badge: null,
  },
  {
    id: 'sticker-pack',
    name: 'WanderCraft Sticker Pack — Full Set',
    category: 'Stickers',
    price: '$20.00',
    image: 'https://imgproxy.fourthwall.dev/vOSJ-E5XhU2Gx4evD7tdS-59cM9fdCfgkUcwrKkwGSA/w:720/sm:1/enc/GcSu4uLN3rgmQv_5/PTrjI3OG86zQB_O-/agKlf9Y77wqyi84V/dssMHGSv2795h2wf/oTQtqmg80RnYwpZ2/5brlMcZcjX45_556/7hTDyKBQJQTWZ4NM/LPVVTxtjV7xCur8i/H54ERNUSLPf4BL3D/uTujrFRBwre00OvS/cRtx2PRLASHyGHHx/1gRfvkuCK9uJUFcO/ApX-6rEuCporSZOE/IY_vPw.webp',
    url: 'https://shopwandercraft.com/products/official-wandercraft-sticker-pack-full-set',
    badge: { label: 'Featured', variant: 'featured' },
  },
  {
    id: 'mystery-stickers',
    name: 'WanderCraft Mystery Sticker Pack',
    category: 'Stickers',
    price: '$12.00',
    image: 'https://imgproxy.fourthwall.dev/YvfZ9llgOQLdCIMiBo4_Ye00ktfDSK7iLdYg6OHsvC8/w:720/sm:1/enc/FZPlAKQB0Zug7La-/sjyy0oRMKkP6F0K2/LcSJcKcJPYPtRWL2/J21yuaE842yVyqtj/ArlJvghU6VdVIj6B/dzhWJ3aiJ1GuIXse/Y4ZZTgmZu9FVfeGN/7YgTKRk8HaGuNWh9/nKF5ukdVos4hifGl/fnYK2PoVa78baw6Z/xQuO9R5lGJkR1y3a/Doyb60fT1AKKZh8k/2UHFdG83bdm1KFrp/qf7pAA.webp',
    url: 'https://shopwandercraft.com/products/official-wandercraft-mystery-sticker-pack',
    badge: { label: 'Featured', variant: 'featured' },
  },
  {
    id: 's2-desk-mat',
    name: 'WanderCraft Season 2 Desk Mat',
    category: 'Desk Mat',
    price: '$20.00',
    image: 'https://imgproxy.fourthwall.dev/CkkWpVzpvmhqLk5JhOFaFtz3tfPHUiGHsapWtuOPQd8/w:720/sm:1/enc/8BVVj4WuU-JOT_JM/KjuKoJcVSKXPAWqw/IlEzAz1mRkltVC8I/yw8VqE26e1zMBI7R/BZ_PhY-Ba_iQ63e2/wMjNIVt24TD7DiaP/Y8beR1gyXoNHT8Fz/NewGBJCaew-2dKHR/esXzOnF9RvzKS_OH/Q5rTt1uOT68eDE_b/hvOv4IszGNBjpa6w/wurr7GBl6hPjzvpL/GOSbJkHVmY5iAaOz/Jwy6mfwarKziUXnq/svQa47rCj4Y.jpg',
    url: 'https://shopwandercraft.com/products/wandercraft-season-2-official-desk-mat',
    badge: null,
  },
];
