import { cn } from "../../lib/utils"
import { ElementType, ComponentPropsWithoutRef } from "react"

interface StarBorderProps<T extends ElementType> {
  as?: T
  color?: string
  speed?: string
  className?: string
  children: React.ReactNode
}

export function StarBorder<T extends ElementType = "button">({
  as,
  className,
  color,
  speed = "6s",
  children,
  ...props
}: StarBorderProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof StarBorderProps<T>>) {
  const Component = as || "button"
  const defaultColor = color || "hsl(var(--foreground))"

  return (
    <Component 
      className={cn(
        "relative block w-full h-full p-[1px] overflow-hidden rounded-[20px]",
        className || ""
      )} 
      {...props}
    >
      <div
        className={cn(
          "absolute w-[300%] h-[10%] bottom-[-10px] right-[-250%] rounded-full animate-star-movement-bottom z-0 blur-sm",
          "opacity-10 dark:opacity-50"
        )}
        style={{
          background: `radial-gradient(circle, ${defaultColor}, transparent 20%)`,
          animationDuration: speed,
        }}
      />
      <div
        className={cn(
          "absolute w-[300%] h-[10%] top-[-10px] left-[-250%] rounded-full animate-star-movement-top z-0 blur-sm",
          "opacity-10 dark:opacity-50"
        )}
        style={{
          background: `radial-gradient(circle, ${defaultColor}, transparent 20%)`,
          animationDuration: speed,
        }}
      />
      <div className={cn(
        "relative z-1 border text-foreground text-center text-base rounded-[18px] w-full h-full",
        "flex items-center justify-center",
        // Dark gradient surface; light left to parent/theme
        "dark:bg-gradient-to-b from-[#09090b] to-[#18181b] dark:border-[#ffffff24]"
      )}>
        {children}
      </div>
    </Component>
  )
}