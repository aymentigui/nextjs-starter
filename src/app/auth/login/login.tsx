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
import { loginUser, SendVerificationCode, SendVerificationCode2FA } from '@/actions/auth/auth'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { getConfirmationCodePasswordChange } from '@/actions/auth/password-change'
import { useTranslations } from 'next-intl'
import { Eye, EyeClosed } from 'lucide-react'
import { useSession } from '@/hooks/use-session'

const LoginForm = () => {
    const [loading, setLoading] = useState(false)
    const [twoFactorConfermation, setTwoFactorConfermation] = useState(false)
    const router = useRouter()
    const [hidePassword, setHidePassword] = useState(true)
    const { setSession } = useSession()

    const t = useTranslations("Settings")
    const s = useTranslations("System")
    const u = useTranslations("Users")

    const LoginSchema = z.object({
        email: z.string({ required_error: u("emailrequired") }),
        password: z.string({ required_error: u("passwordrequired") }).min(6, { message: u("password6") }),
        code: z.string().optional(),
    });

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })
    function onSubmit(values: z.infer<typeof LoginSchema>) {
        setLoading(true)
        loginUser(values).then((res) => {
            if (res.status === 200) {
                if (res.data.twoFactorConfermation) {
                    setTwoFactorConfermation(true)
                } else {
                    router.push("/");
                    setSession(res)
                }
            } else if (res.data && res.data.emailNotVerified) {
                SendVerificationCode(values.email).then((e) => {
                    router.push(`/auth/confermation?email=${values.email}`)
                });
            } else {
                toast.error(res.data.message);
            }
        })
        setLoading(false)
    }

    const passwordForget = async () => {
        if (!form.getValues().email) {
            toast.error(t("emailorusername"))
            return
        }
        getConfirmationCodePasswordChange(form.getValues().email).then((res) => {
            if (res.status === 200) {
                router.push(`/auth/reset?email=${encodeURIComponent(form.getValues().email)}`)
            } else {
                toast.error(res.data.message)
            }
        })
    }

    const resendTheCode = ()=>{
        if (!form.getValues().email) {
            toast.error(t("emailorusername"))
            return
        }
        SendVerificationCode2FA(form.getValues().email).then((res) => {
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
                {!twoFactorConfermation && <>
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("emailorusername")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t("emailorusername")} {...field} />
                                </FormControl>
                                <FormMessage className='font-bold' />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t("password")}</FormLabel>
                                <FormControl>
                                    <div className='flex items-center gap-1'>
                                        <Input type={hidePassword ? "password" : "text"} placeholder={t("password")} {...field} />
                                        <div onClick={() => setHidePassword(!hidePassword)} className='p-2  border shadow rounded-md cursor-pointer'>
                                            {!hidePassword ? <Eye className="w-4 h-4" /> : <EyeClosed className="w-4 h-4" />}
                                        </div>
                                    </div>
                                </FormControl>
                                <FormMessage className='font-bold' />
                            </FormItem>
                        )}
                    />
                </>}
                {twoFactorConfermation && <>
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
                </>}
                <div className='flex justify-between items-center'>
                    <Button variant='link' type='button' onClick={passwordForget} className='p-0'>{t("forgetpassword")}</Button>
                    <Button variant='link' type='button' onClick={resendTheCode} className='p-0'>{s("resendthecode")}</Button>
                </div>
                <div className='pt-4'>
                    <Button
                        disabled={loading} className={cn('font-bold w-full ', loading && 'cursor-wait')} type="submit">{twoFactorConfermation ? s("confirm") : s("login")}</Button>
                </div>
            </form>
            <Button variant='link' type='button' onClick={() => router.push("/auth/register")} className='p-0 mt-2 '>{t("youhavenotaccount")}</Button>
        </Form>
    )
}
export default LoginForm
