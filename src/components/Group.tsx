'use client';

import { useState } from "react";
import { Group } from "../../lib/db/schema";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";


interface GroupPageProps{
    group: Group
}


export default function GroupComponent({group}: GroupPageProps){
    const [groupValue, setGroup] = useState<Group>(group)
    return (
        <Link href={`/groups/${group.number}`} className="block">
            <div className="p-6 hover:border-[#6D6FF3] border-2 transition-all duration-300 cursor-pointer border-transparent hover:border-primary group bg-white rounded-xl">
                <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#EFEFFD] p-3 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary text-[#6D6FF3]" />
                    </div>
                    <div>
                    <h3 className="text-2xl font-bold text-foreground">{group.number}</h3>
                    <p className="text-sm text-muted-foreground">Группа</p>
                    </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-[#6D6FF3] group-hover:translate-x-2 transition-all" />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span className="text-sm">{group.countStudent} студентов</span>
                </div>
            </div>
            </Link>
    );
} 