import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_app/settings/bank-connections')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_auth/_app/settings/bank-connections"!</div>
}
