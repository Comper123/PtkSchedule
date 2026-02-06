'use client';

import React, { useEffect, useState } from "react";
import { db } from "../../lib/db/db";
import { Group } from "../../lib/db/schema";
import GroupComponent from "../components/Group"
import Header from "@/components/Header"
import {Calendar, X} from "lucide-react"


interface createGroupFormData {
  number: number
}


export default function Home() {
  // Переменные
  const [isCreateGroupModalOpen, setIsCreatGroupModalOpen] = useState(false);
  
  // Функции открытия закрытия модальных окон
  const openCreateGroupModal = () => setIsCreatGroupModalOpen(true);
  const closeCreateGroupModal = () => setIsCreatGroupModalOpen(false);

  const [groupList, setGroupList] = useState<Group[]>([])

  // Загружаем группы
  useEffect(() => {
    fetchGroups()
  }, [])
  
  // Функция загрузки групп
  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups', {method: 'GET'});
      const groups: Group[] = await response.json();
      setGroupList(groups || []);
      console.log("1")
    } catch (error) {
      console.log(error)
    }
  }
  // Функция создания группы
  const createGroup = async (groupData: createGroupFormData) => {
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(groupData)
      })

      if (response.ok) {
        await fetchGroups();
        closeCreateGroupModal();
      } else {
        console.log("Не получилось создать группу")
      }
    } catch (error) {
      console.log(error)
    }
  }

  // Обработчик формы создания группы
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const numberValue = formData.get('number') as string;
    const countStValue = formData.get('countSt') as string; 

    if (numberValue === null){
      console.log('Укажите номер группы');
      return;
    }

    if (countStValue === null){
      console.log('Укажите кол-во студентов в группе');
      return;
    }

    const newGroupData = {
      number: parseInt(numberValue),
      countStudent: parseInt(countStValue)
    }

    await createGroup(newGroupData);
  }
  return (
    <div> 
      {isCreateGroupModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Добавьте новую группу</h2>
                <X className="hover:cursor-pointer" onClick={closeCreateGroupModal}></X>
              </div>
              <form onSubmit={handleCreateGroup}>
                <div className="mb-6">
                  <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-2">Номер группы<span className="text-red-700">*</span></label>
                  <input id="number" name="number" type="number" placeholder="3991"
                    className="h-11 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                </div>
                <div className="mb-6">
                  <label htmlFor="countSt" className="block text-sm font-medium text-gray-700 mb-2">Количество студентов<span className="text-red-700">*</span></label>
                  <input id="countSt" name="countSt" type="number" placeholder="25"
                    className="h-11 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
                </div>
                <div className="flex justify-end">
                  <button type="submit" className="flex-1 px-4 py-3 bg-[#6D6FF3] text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50">Добавить</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-zinc-100">
        <div className="relative text-white overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
              <Calendar className="w-8 h-8" />
            </div>
            <h1 className="text-5xl font-bold mb-4">Расписание занятий</h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Удобная система управления расписанием для учебных групп
            </p>
          </div>
          <div className="absolute inset-0 bg-[#6D6FF3]"></div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-5">Учебные группы
              <button className="bg-[#6D6FF3] text-sm text-white w-9 h-9 rounded-lg duration-300 hover:scale-90"
                  onClick={openCreateGroupModal}>+</button>
            </h2>
            <p className="text-muted-foreground">Выберите группу для просмотра и редактирования расписания</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupList.map((group) => (
              <GroupComponent key={group.number} group={group} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
