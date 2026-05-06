"use client"

import { useEffect, useState, useRef } from "react"

export function useFetch<T>(url: string | null, refreshMs?: number) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!url) {
      setLoading(false)
      return
    }
    let active = true
    const fetchData = async () => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl
      try {
        if (active && data === null) setLoading(true)
        const res = await fetch(url, { signal: ctrl.signal })
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        const json = await res.json()
        if (!active) return
        setData(json as T)
        setError(null)
      } catch (e) {
        if (!active || (e as Error).name === "AbortError") return
        setError((e as Error).message)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchData()
    let intId: ReturnType<typeof setInterval> | null = null
    if (refreshMs) {
      intId = setInterval(fetchData, refreshMs)
    }
    return () => {
      active = false
      abortRef.current?.abort()
      if (intId) clearInterval(intId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, refreshMs])

  return { data, error, loading }
}
