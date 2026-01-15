'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function CheckSchemaPage() {
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch('/api/debug/check-schema')
                const data = await res.json()
                setResult(data)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        check()
    }, [])

    if (loading) return <div className="text-white p-8">Checking database...</div>

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="text-3xl font-bold">🗄️ Database Schema Check</h1>
                </div>

                {result?.error ? (
                    <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-red-400 mb-2">❌ Error</h2>
                        <p>{result.error}</p>
                        {result.details && <pre className="mt-4 text-sm bg-slate-900 p-4 rounded">{result.details}</pre>}
                    </div>
                ) : (
                    <>
                        <div className={`border-2 rounded-xl p-6 ${result?.schemaReady ? 'bg-green-500/20 border-green-500' : 'bg-amber-500/20 border-amber-500'}`}>
                            <h2 className="text-2xl font-bold mb-2">
                                {result?.schemaReady ? '✅ Schema Ready!' : '⚠️ Schema Incomplete'}
                            </h2>
                            <p className="text-lg">{result?.message}</p>
                        </div>

                        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                            <h3 className="text-xl font-bold mb-4">📋 Table Status</h3>
                            <div className="space-y-2">
                                {result?.tables && Object.entries(result.tables).map(([table, info]: [string, any]) => (
                                    <div key={table} className={`flex items-center justify-between p-4 rounded-lg ${info.exists ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                        <span className="font-mono font-bold">{table}</span>
                                        <span className={info.exists ? 'text-green-400' : 'text-red-400'}>
                                            {info.exists ? '✓ Exists' : '✗ Missing'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {!result?.schemaReady && (
                            <div className="bg-blue-500/20 border-2 border-blue-500 rounded-xl p-6">
                                <h3 className="text-xl font-bold mb-4">🔧 How to Fix</h3>
                                <ol className="space-y-4 list-decimal list-inside">
                                    <li className="text-lg">
                                        Open your <strong>Supabase Dashboard</strong>
                                    </li>
                                    <li className="text-lg">
                                        Go to <strong>SQL Editor</strong> (left sidebar)
                                    </li>
                                    <li className="text-lg">
                                        Copy the contents of <code className="bg-slate-900 px-2 py-1 rounded">quiz_schema.sql</code> from your project root
                                    </li>
                                    <li className="text-lg">
                                        Paste into SQL Editor and click <strong>"Run"</strong>
                                    </li>
                                    <li className="text-lg">
                                        Refresh this page to verify
                                    </li>
                                </ol>

                                <div className="mt-6 bg-slate-900 p-4 rounded-lg">
                                    <p className="text-sm text-slate-400 mb-2">File location:</p>
                                    <code className="text-cyan-400">LMS YPP/quiz_schema.sql</code>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
