"use client"
import React from 'react'
import GetImage from '@/hooks/use-getImage'
import { LzyImage } from './lazy-image'

const MyImage = (
    { image, isNotApi, alt, classNameProps, load, objet_fit }
    : { image: string, isNotApi?:boolean, alt?:string, classNameProps?:string, load?:boolean,objet_fit?:string }) => {

    return (
        <LzyImage
            src={isNotApi?image:GetImage(image)}
            alt={alt??"image..."}
            load
            className={classNameProps??"w-full h-[150px] md:h-[200px] bg-accent"}
            objet_fit={objet_fit??'object-contain'}
        />
    )
}

export default MyImage