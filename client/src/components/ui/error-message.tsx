import * as React from "react"

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-destructive">{children}</p>
}

export { ErrorMessage }
