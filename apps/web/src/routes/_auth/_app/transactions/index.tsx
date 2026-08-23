import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/_app/transactions/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_auth/_app/transactions"!</div>
}
