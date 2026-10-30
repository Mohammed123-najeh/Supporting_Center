// RTL helper so directional motion respects `dir`. (The framer-motion variants
// that used to live here went with the components that used them.)

// +1 for LTR, -1 for RTL — so horizontal offsets flip correctly.
export const dirSign = (dir: "rtl" | "ltr") => (dir === "rtl" ? -1 : 1)
