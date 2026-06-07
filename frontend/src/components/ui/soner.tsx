import CircleCheckIcon from '../../assets/icons/toast/CircleCheckIcon.tsx'
import InfoIcon from '../../assets/icons/toast/InfoIcon.tsx'
import Loader2Icon from '../../assets/icons/toast/Loader2Icon.tsx'
import PentagonXIcon from '../../assets/icons/toast/PentagonXIcon.tsx'
import TriangleAlertIcon from '../../assets/icons/toast/TriangleAlertIcon.tsx'
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"


const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon size={16}/>,
        info: <InfoIcon size={16}/>,
        warning: <TriangleAlertIcon size={16}/>,
        error: <PentagonXIcon size={16}/>,
        loading: <Loader2Icon size={16}/>,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
