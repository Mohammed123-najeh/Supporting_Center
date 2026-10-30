// The iPhone Duo, always open. Same frame as the payment band's foldable (its
// colours are the site's --duo-frame* tokens) but flat: no hinge rig, no 3D, so it
// costs one layer. Landscape (164.6 × 117.8 mm) from 761px; on phones the open
// device stands in portrait and the hinge crease runs across. The hardware is
// decorative; the screen holds whatever the caller renders, and `below` sits under
// the device at its exact width (its control, in the corner). Styles: chat-stage.css.
import type { ReactNode } from "react"

export function DuoOpen({ children, below }: { children: ReactNode; below?: ReactNode }) {
  return (
    <div className="rmn-dop">
      <div className="rmn-dop-body">
        <div className="rmn-dop-screen">{children}</div>
        <span className="rmn-dop-crease" aria-hidden="true" />
        <span className="rmn-dop-btn" aria-hidden="true" />
        <span className="rmn-dop-cam" aria-hidden="true" />
      </div>
      {below}
    </div>
  )
}
