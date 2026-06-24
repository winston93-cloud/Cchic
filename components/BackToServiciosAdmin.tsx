import { urlServiciosAdminDashboard } from '@/lib/serviciosAdminConfig'

export default function BackToServiciosAdmin() {
  return (
    <a href={urlServiciosAdminDashboard()} className="back-to-servicios-btn">
      <span aria-hidden="true">←</span>
      Volver al inicio
    </a>
  )
}
