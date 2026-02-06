'use client';

import { Ban } from "lucide-react";
import Header from "@/components/Header"

interface EmptyPageProps{
    message: string
}


export default function EmptyPage({ message }: EmptyPageProps){
    return (
        <div className="w-screen h-screen flex items-center flex-col">
            <Header></Header>
            <div className="items-center m-auto w-max h-max flex">
                <Ban className="text-red-500 mr-3 animate-bounce"/>
                <p className="text-gray-500 text-xl font-bold">{ message }</p>
            </div>
        </div>
        
    )
}