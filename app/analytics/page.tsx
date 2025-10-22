import { redirect } from 'next/navigation'

export default async function AnalyticsPage() {
  // Redirect to Entity analytics by default
  redirect('/analytics/entity')
}