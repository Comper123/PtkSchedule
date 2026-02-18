'use client';

import React, { useEffect, useState } from "react";
import { Group } from "../../lib/db/schema";
import GroupComponent from "../components/Group"
import {Calendar, X, Ban} from "lucide-react"
import { ParsedGroupComponent } from "@/components/ParsedGroup";
import { chunkArray } from "../../lib/utils";
import Slider from "@/components/Slider";
import { GroupData } from "@/types/parse";
import DetailModal from "@/components/GroupDetailModal";
import Loader from "@/components/ui/Loader";
import Modal from "@/components/ui/Modal";

interface createGroupFormData {
  number: number
}

interface EditGroupData{
  countStudent: string
}

interface ParsedGroup {
  number: number
}

export default function Home() {
  // Переменные
  const [isCreateGroupModalOpen, setIsCreatGroupModalOpen] = useState(false);
  const [isDetailGroupModalOpen, setIsDetailGroupModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isRemoveGroupModalOpen, setIsRemoveGroupModalOpen] = useState(false);

  const [detailGroupNumber, setDetailGroupNumber] = useState<number | null>(null)
  const [editGroupNumber, setEditGroupNumber] = useState<string>("");
  const [removeGroupNumber, setRemoveGroupNumber] = useState<string>("");

  // Функции открытия закрытия модальных окон
  const openCreateGroupModal = () => setIsCreatGroupModalOpen(true);
  const closeCreateGroupModal = () => setIsCreatGroupModalOpen(false);
  const [groupList, setGroupList] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLoadingDetailGroup, setIsLoadingDetailGroup] = useState(false);

  const items_at_page = 12;

  // Для данных парсинга
  const [parsedGroupList, setParsedGroupList] = useState<ParsedGroup[][]>([])
  const [groupDetail, setGroupDetail] = useState<GroupData | null>(null);

  // Загружаем группы
  useEffect(() => {
    fetchGroups();
    fetchParsedGroup();
  }, [])
  
  // Функция для загрузки детальной информации о группе
  const fetchGroupDetails = async (number: number) => {
    setIsLoadingDetailGroup(true);
    try{
      const response = await fetch(`/api/parse/groupdetail/${number}`);
      if (response.ok){
        setGroupDetail(await response.json());
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoadingDetailGroup(false);
    }
  }

  // Функция отображения детальной информации о группе
  const openGroupDetails = (number: number) => {
    setIsDetailGroupModalOpen(true);
    fetchGroupDetails(number);
  }

  const closeDetailGroupModal = () => {
    setIsDetailGroupModalOpen(false);
  }

  // Функция загрузки групп
  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups', {method: 'GET'});
      const groups: Group[] = await response.json();
      setGroupList(groups || []);
    } catch (error) {
      console.log(error);
    }
    setIsLoading(false);
  }

  // Функция загрузки групп с сайта
  const fetchParsedGroup = async () => {
    try {
      const response = await fetch('/api/parse/allgroups', {method: 'GET'});
      const parsedGroups: ParsedGroup[] = await response.json();
      // Вручную пагинируем спаршенные группы 
      const paginateGroups = chunkArray(parsedGroups, items_at_page);
      setParsedGroupList(paginateGroups || [[]]);
    } catch (error) {
      console.log(error);
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

  // Функция открытия окна изменения группы
  const openModalEditGroup = (e: React.MouseEvent, number: string) => {
    e.preventDefault();
    e.stopPropagation();
    setEditGroupNumber(number);
    setIsEditGroupModalOpen(true);
  }

  // Функция закрытия окна изменения группы
  const closeModalEditGroup = () => {
    setIsEditGroupModalOpen(false);
  }

  // Функция открытия окна удаления группы
  const openModalRemoveGroup = (e: React.MouseEvent, number: string) => {
    e.preventDefault();
    e.stopPropagation();
    setRemoveGroupNumber(number);
    setIsRemoveGroupModalOpen(true);
  }

  // Функция закрытия окна удаления группы
  const closeModalRemoveGroup = () => {
    setIsRemoveGroupModalOpen(false);
  }

  const editGroup = async (groupData: EditGroupData) => {
    try {
      const response = await fetch(`/api/groups/${editGroupNumber}/edit`, {
        method: "PUT",
        body: JSON.stringify(groupData)
      });
      if (response.ok){
        // Обновляем существующую группу
        setGroupList(prevGroups => {
          return prevGroups.map(group =>
            group.number === editGroupNumber ? { ...group, countStudent: groupData.countStudent} : group
          )
        })
        closeModalEditGroup();
      }
    } catch (error) {
      console.log(error);
    }
  }

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const countStValue = formData.get('countSt') as string; 
    const newGroupData = {
      countStudent: countStValue
    }
    await editGroup(newGroupData);
  }
  
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center w-full h-[100vh] bg-white">
        <Loader></Loader>
      </div>
    );
  }

  return (
    <div> 
      <Modal 
        isOpen={isEditGroupModalOpen} 
        onClose={closeModalEditGroup}
        title={`Изменение группы ${editGroupNumber}`}
        size="sm">
        <div>
          <form onSubmit={handleEditGroup}>
            <div className="mb-6">
              <label htmlFor="countSt" className="block text-sm font-medium text-gray-700 mb-2">Количество студентов<span className="text-red-700">*</span></label>
              <input id="countSt" name="countSt" type="number" placeholder="25"
                className="h-11 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="flex-1 px-4 py-3 bg-[#6D6FF3] text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50">Изменить</button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal 
        isOpen={isRemoveGroupModalOpen} 
        onClose={closeModalRemoveGroup}
        title={`Удаление группы ${removeGroupNumber}`}>
        <div>

        </div>
      </Modal>

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

      {isDetailGroupModalOpen && (
        <DetailModal 
          isOpen={isDetailGroupModalOpen} 
          onClose={closeDetailGroupModal}
          grNumber={detailGroupNumber}
          groupDetail={groupDetail}
          isLoading={isLoadingDetailGroup}>
        </DetailModal>
      )}

      <div className="min-h-screen bg-zinc-100">
        <div className="inset-0 bg-[#6D6FF3] text-white overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-6">
              <Calendar className="w-8 h-8" />
            </div>
            <h1 className="text-5xl font-bold mb-4">Расписание занятий</h1>
            <p className="text-xl opacity-90 max-w-2xl mx-auto">
              Удобная система управления расписанием для учебных групп
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-5">Учебные группы
              <button className="bg-[#6D6FF3] text-sm text-white w-9 h-9 rounded-lg duration-300 hover:scale-90"
                  onClick={openCreateGroupModal}><p className="text-lg">+</p></button>
            </h2>
            <p className="text-muted-foreground">Выберите группу для просмотра и редактирования расписания</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupList.map((group) => (
              <GroupComponent 
                key={group.number} 
                group={group} 
                edit={(e) => openModalEditGroup(e, group.number)} 
                remove={(e) => openModalRemoveGroup(e, group.number)}/>
            ))}
          </div>
          
          <div className="mb-8 mt-20">
            <h2 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-5">Информация о группах</h2>
            <p className="text-muted-foreground">Выберите группу для просмотра информации о ней</p>
          </div>

          {parsedGroupList.length === 0 ? (
            <div className="w-full flex items-center flex-col">
              <Ban className="text-red-600 mb-4 mt-8"/>
              <p className="w-max text-gray-600 text-xl">Извините, группы не загрузились</p>
              <p className="w-max text-gray-400 mt-2 font-semibold">Проверьте соединение с интернетом и повторите попытку.</p>
            </div>
          ) : (
            <Slider className="min-h-[560px]" showDots={false}>
              {parsedGroupList.map((groupPage, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupPage.map(gr => (
                    <div key={gr.number} onClick={() => {
                        openGroupDetails(gr.number);
                        setDetailGroupNumber(gr.number);
                      }}> 
                      <ParsedGroupComponent  number={gr.number}/>
                    </div>
                  ))}
                </div> 
              ))}
            </Slider>
          )}
        </div>
      </div>
    </div>
  );
}
