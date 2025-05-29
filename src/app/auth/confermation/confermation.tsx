"use client"
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import {
    Form,
    FormField,
    FormControl,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { confermationRegister, SendVerificationCode } from '@/actions/auth/auth'

const ConfermationFrom = ({ email }: any) => {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams();


    const t = useTranslations("Settings")
    const s = useTranslations("System")
    const u = useTranslations("Users")

    const confermationSchema = z.object({
        code: z.string(),
    });

    const form = useForm<z.infer<typeof confermationSchema>>({
        resolver: zodResolver(confermationSchema),
        defaultValues: {
            code: "",
        },
    })
    function onSubmit(values: z.infer<typeof confermationSchema>) {
        setLoading(true)
        const email = searchParams.get("email")
        if (!email) {
            router.push("/auth/login")
            return
        }
        confermationRegister(values, email).then((res) => {
            if (res.status === 200) {
                toast.success(s("registersuccess"))
                router.push("/auth/login")
            } else {
                toast.error(res.data.message);
            }
        })
        setLoading(false)
    }

    const resendTheCode = () => {
        const email = searchParams.get("email")
        if (!email) {
            router.push("/auth/login")
            return
        }
        SendVerificationCode(email).then((res) => {
            if (res.status === 200) {
                toast.success(s("verificationemailsent"));
            }else{
                toast.error(res.data.message);
            }
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 ">
                <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("codeverification")} </FormLabel>
                            <FormControl>
                                <Input placeholder={t("codeverification")} {...field} />
                            </FormControl>
                            <FormMessage className='font-bold' />
                        </FormItem>
                    )}
                />
                <div className='pt-4'>
                    <Button
                        disabled={loading} className={cn('font-bold w-full ', loading && 'cursor-wait')} type="submit">{s("confirm")}</Button>
                </div>
            </form>
            <Button variant='link' type='button' onClick={resendTheCode} className='p-0 mt-2 '>{s("resendthecode")}</Button>
        </Form>
    )
}
export default ConfermationFrom
