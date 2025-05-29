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
import { registerUser } from '@/actions/auth/auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

const RegisterForm = () => {
    const [loading, setLoading] = useState(false)
    const u = useTranslations('Users');
    const s = useTranslations('System');
    const t = useTranslations('Settings');

    const router = useRouter()

    const RegisterSchema = z.object({
        firstname: z
            .string({ required_error: u("firstnamerequired") }),
        lastname: z
            .string({ required_error: u("lastnamerequired") }),
        username: z
            .string({ required_error: u("usernamerequired") })
            .min(3, { message: u("username6") })
            .max(20, { message: u("username20") }),
        email: z.string({ required_error: u("emailrequired") }).email({ message: u("emailinvalid") }),
        password: z.string({ required_error: u("passwordrequired") }).min(6, { message: u("password6") }),
        passwordConfirm: z.string({ required_error: u("confirmpasswordrequired") }).min(6, { message: u("password6") }),
    }).refine((data) => data.password === data.passwordConfirm, {
        path: ["passwordConfirm"],
        message: u("confirmpasswordnotmatch"),
    });

    const form = useForm<z.infer<typeof RegisterSchema>>({
        resolver: zodResolver(RegisterSchema),
        defaultValues: {
            firstname:"",
            lastname:"",
            username: "",
            email: "",
            password: "",
            passwordConfirm: "",
        },
    })
    function onSubmit(values: z.infer<typeof RegisterSchema>) {
        setLoading(true)
        registerUser(values).then((res) => {
            if (res.status === 201) {
                router.push(`/auth/confermation?email=${values.email}`)
            } else {
                toast.error(res.data.message)
            }
        })
        setLoading(false)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                <div className=' flex flex-wrap gap-2'>
                    <FormField
                        control={form.control}
                        name="firstname"
                        render={({ field }) => (
                            <FormItem className='grow'>
                                <FormLabel>{u("firstname")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={u("firstname")} {...field} />
                                </FormControl>
                                <FormMessage className='font-bold' />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lastname"
                        render={({ field }) => (
                            <FormItem className='grow'>
                                <FormLabel>{u("lastname")}</FormLabel>
                                <FormControl>
                                    <Input placeholder={u("lastname")} {...field} />
                                </FormControl>
                                <FormMessage className='font-bold' />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t("username")}</FormLabel>
                            <FormControl>
                                <Input placeholder={t("username")} {...field} />
                            </FormControl>
                            <FormMessage className='font-bold' />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel >{t("email")}</FormLabel>
                            <FormControl>
                                <Input placeholder={t("email")} {...field} />
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
                            <FormLabel >{t("password")}</FormLabel>
                            <FormControl>
                                <Input placeholder={t("password")} {...field} />
                            </FormControl>
                            <FormMessage className='font-bold' />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="passwordConfirm"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel >{t("confirmpassword")}</FormLabel>
                            <FormControl>
                                <Input placeholder={t("confirmpassword")} {...field} />
                            </FormControl>
                            <FormMessage className='font-bold' />
                        </FormItem>
                    )}
                />
                <div className='pt-4'>
                    <Button
                        disabled={loading} className={cn('font-bold w-full ', loading && 'cursor-wait')} type="submit">{s("register")}</Button>
                </div>
            </form>
            <Button variant='link' type='button' onClick={() => router.push("/auth/login")} className='p-0 mt-2 '>{t("youhaveaccount")}</Button>
        </Form>
    )
}

export default RegisterForm
