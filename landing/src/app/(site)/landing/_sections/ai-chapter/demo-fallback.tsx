// If a demo's chunk fails to load, its stage shows the server-rendered final scene
// instead of an empty screen. The scene reaches the island loader (which lives at
// module scope) through this context.
"use client"
import { createContext, useContext, type ReactNode } from "react"

export const StaticScene = createContext<ReactNode>(null)

export function StaticSceneView() {
  return <>{useContext(StaticScene)}</>
}
