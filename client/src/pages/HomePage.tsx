import { useEffect, useState } from 'react'

interface ApiInfo {
  serverTime: string
  message: string
}

export default function HomePage() {
  const [status, setStatus] = useState<string | null>(null)
  const [info, setInfo] = useState<ApiInfo | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then((data: { status: string }) => setStatus(data.status))
      .catch(() => setStatus('error'))

    fetch('/api/info')
      .then(res => res.json())
      .then((data: ApiInfo) => setInfo(data))
      .catch(() => null)
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-500">API status: {status ?? 'checking...'}</p>
      {info && (
        <div className="mt-4 text-sm">
          <p>{info.message}</p>
          <p className="text-gray-500">Server time: {info.serverTime}</p>
        </div>
      )}
    </div>
  )
}
