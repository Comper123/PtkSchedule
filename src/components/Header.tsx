'use client';

import Link from "next/link";
import { useState } from "react";
import {ChevronRight} from "lucide-react"

interface HeaderProps {
    group: string
}


export default function HeaderComponent({group = ""} : HeaderProps){
    const [groupName, setGroupName] = useState<string>(group);
    console.log(groupName)
    return (
        <header className="flex items-center w-full mx-auto h-16 bg-gray-800 ps-12 self-start gap-2">
            <Link href="/" className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white">Расписание</Link>
            {groupName && (
                <div className="flex gap-2 items-center text-white">
                    <ChevronRight />
                    <Link href={`/groups/${groupName}`} className="rounded-md px-3 py-2 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white">{ groupName }</Link>
                </div>
            )}
        </header>
    )
}