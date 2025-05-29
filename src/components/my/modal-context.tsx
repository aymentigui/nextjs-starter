import { AddUpdateUserDialogProvider } from '@/context/add-update-dialog-context'
import { AddUpdateUserDialog } from '@/modals/add-update-dialog'
import React from 'react'

const ModalContext = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            <AddUpdateUserDialogProvider>
                {children}
                <AddUpdateUserDialog />
            </AddUpdateUserDialogProvider>
        </>
    )
}

export default ModalContext
