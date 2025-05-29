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
import { useRouter,useSearchParams  } from 'next/navigation'
import { resetPasswordWithoutConnection } from '@/actions/auth/password-change'
import { useTranslations } from 'next-intl'

const ResetForm = () => {
    const [loading, setLoading] = useState(false)
    const [passwordForget, setPasswordForget] = useState(false)
    const router = useRouter()
    const params = useSearchParams()
    const email= params.get('email')

    const u=useTranslations('Users');
    const s=useTranslations('System');
    const t=useTranslations('Settings');

    if(!email){
        router.push('/auth/login')
    }

    const ResetSchema = z.object({
        password: z.string().optional(),
        passwordConfermation: z.string().optional(),
        code : z.string().optional(),
      })
      .refine((data) => data.password !=="" || data.password !==null || String(data.password).length < 6, {
        path: ["password"],
        message: u("password6"),
      })
      .refine((data) => data.password === data.passwordConfermation, {
        path: ["passwordConfermation"],
        message: u("confirmpasswordnotmatch"),
      });

    const form = useForm<z.infer<typeof ResetSchema>>({
        resolver: zodResolver(ResetSchema),
        defaultValues: {
            passwordConfermation: "",
            password: "",
            code: "",
        },
    })

    function onSubmit(values: z.infer<typeof ResetSchema>) {
        setLoading(true)
        if(!email){
            router.push('/auth/login')
            return
        }
        const data = {
            email: email,
            password: values.password,
            code: values.code
        }
        resetPasswordWithoutConnection(data).then((res) => {
            if (res.status === 200) {
                if (res.data.codeConfirmed) {
                    setPasswordForget(true)
                    form.reset()
                } else {
                    router.push('/auth/login')
                }
            } else {
                toast.error(res.data.message);
            }
        })
        setLoading(false)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                {passwordForget && <>
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel >{t("password")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("password")}{...field} />
                                </FormControl>
                                <FormMessage className='font-bold' />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="passwordConfermation"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("confirmpassword")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("confirmpassword")} {...field} />
                                </FormControl>
                                <FormMessage className='font-bold' />
                            </FormItem>
                        )}
                    />
                </>}
                {!passwordForget && <>
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel >{t("codeverification")}</FormLabel>
                                <FormControl>
                                    <Input  placeholder="XXXX" {...field} />
                                </FormControl>
                                <FormMessage className='font-bold' />
                            </FormItem>
                        )}
                    />
                </>}
                <div className='pt-4'>
                    <Button
                        disabled={loading} className={cn('font-bold w-full ', loading && 'cursor-wait')} type="submit">{!passwordForget ? s("next") : s("reset")}</Button>
                </div>
            </form>
        </Form>
    )
}

export default ResetForm
