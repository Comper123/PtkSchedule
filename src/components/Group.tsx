"use client";

import React, { useState } from "react";
import { Group } from "../../lib/db/schema";
import Link from "next/link";
import { ArrowRight, Users, Trash, Pencil, ArrowUpRight } from "lucide-react";

interface GroupPageProps {
  group: Group;
  edit: (e: React.MouseEvent, number: string) => void;
  remove: (e: React.MouseEvent, number: string) => void;
}

export default function GroupComponent({ 
  group, edit, remove }: GroupPageProps) {
  const [groupValue, setGroup] = useState<Group>(group);
  return (
    <Link href={`/groups/${group.number}`} className="block">
      <div className="p-6 hover:border-[#6D6FF3] border-2 transition-all duration-300 cursor-pointer border-transparent hover:border-primary group bg-white rounded-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#EFEFFD] p-3 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary text-[#6D6FF3]" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">
                {group.number}
              </h3>
              <p className="text-sm text-muted-foreground">Группа</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-[#6D6FF3] group-hover:translate-x-2 transition-all" />
        </div>
        <div className="flex justify-between gap-2 text-muted-foreground">
          <div className="flex gap-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">{group.countStudent} студентов</span>
          </div>
          <div className="flex gap-2">
            <div className="bg-red-400/20 flex items-center justify-center h-9 w-9 rounded-md hover:-translate-y-1 duration-300"
                 onClick={(e) => remove(e)}>
              <Trash className="h-5 w-5 text-red-400"></Trash>
            </div>
            <div className="bg-orange-600/20 flex items-center justify-center h-9 w-9 rounded-md hover:-translate-y-1 duration-300"
                 onClick={(e) => edit(e)}>
              <Pencil className="h-5 w-5 text-orange-600"></Pencil>
            </div>
            <div className="border-[#6d6ff3ab] border border-2 flex items-center justify-center h-9 w-9 rounded-md hover:-translate-y-1 duration-300">
              <ArrowUpRight className="h-5 w-5 text-[#6D6FF3]"></ArrowUpRight>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
