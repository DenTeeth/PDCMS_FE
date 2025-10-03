'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface StatusContextType {
    status: string
    setStatus: (status: string) => void
}

export const StatusContext = createContext<StatusContextType>({
    status: 'online',
    setStatus: () => { }
})

export function StatusProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState('online')

    return (
        <StatusContext.Provider value={{ status, setStatus }}>
            {children}
        </StatusContext.Provider>
    )
}

export function useStatus() {
    return useContext(StatusContext)
}