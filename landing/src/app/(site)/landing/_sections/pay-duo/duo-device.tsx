// The iPhone Duo — Apple's book-style foldable (open 164.6 × 117.8 mm landscape,
// closed 84.1 × 117.8 mm portrait, Touch ID in the right side button). Pure DOM +
// CSS 3D; every motion lives in pay-duo.css and is driven by the stage's
// data-scene. Layering:
//
//   .rmn-duo-lift    rise / drop + fade — OUTSIDE the 3D context, so opacity here
//                    can't flatten the fold
//     .rmn-duo-shadow  a soft ellipse on the "table", scaled with the open width
//     .rmn-duo-stage   perspective (≈3× the device width), never clipped
//       .rmn-duo       preserve-3d; recentred (translateX -25%) while closed
//         .rmn-duo-base  the flat right half: Apple Pay pane, side button + ring
//         .rmn-duo-leaf  the left half, hinged on its right edge: inner face =
//                        store page, outer face (rotateY 180°) = outer display
//
// Nothing that flattens 3D (opacity < 1, overflow, filter, clip-path, mask,
// contain…) ever goes on .rmn-duo or .rmn-duo-leaf; the faces themselves clip,
// round and fade. Always LTR, like any phone; only its placement mirrors in RTL.
import { OuterDisplay, PayPane, StorePane } from "./duo-screens"

export function DuoDevice() {
  return (
    <div className="rmn-duo-place">
      <div className="rmn-duo-lift">
        <span className="rmn-duo-shadow" />
        <div className="rmn-duo-stage">
          <div className="rmn-duo">
            <div className="rmn-duo-base">
              <div className="rmn-duo-face rmn-duo-pane"><PayPane /></div>
              <span className="rmn-duo-btn" />
              <span className="rmn-duo-ring" />
            </div>
            <div className="rmn-duo-leaf">
              <div className="rmn-duo-face rmn-duo-in"><StorePane /></div>
              <div className="rmn-duo-face rmn-duo-out"><OuterDisplay /></div>
              <span className="rmn-duo-edge" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
