"use client";

import { eq } from "drizzle-orm";
import { db } from "../../../../lib/db/db";
import { Group, groups, Lesson, LessonSelect } from "../../../../lib/db/schema";
import EmptyPage from "@/components/EmptyPage";
import { notFound, useParams } from "next/navigation";
import React, { use, useCallback, useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import Link from "next/link";
import { ArrowLeft, Plus, X, Ban } from "lucide-react";
import { DAYS, TIME_RANGES, TIME_SLOTS } from "@/types/shedule";
import Modal from "@/components/ui/Modal";

// interface GroupPageProps {
//   params: {
//     id: string;
//   };
// }

// Типы для наших enum значений
type DayOfWeek = 'Понедельник' | 'Вторник' | 'Среда' | 'Четверг' | 'Пятница' | 'Суббота' | 'Воскресенье';
type LessonTime = '08:30 - 10:10' | '10:20 - 12:00' | '12:45 - 14:25' | '14:35 - 16:15' | '16:25 - 18:05';
const dayWeekOptions: DayOfWeek[] = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const lessonTimeOptions: LessonTime[] = ['08:30 - 10:10', '10:20 - 12:00', '12:45 - 14:25', '14:35 - 16:15', '16:25 - 18:05'];

interface LessonFormData {
  subject: string,
  teacher: string,
  room: string,
  day: DayOfWeek,
  time: LessonTime,
  group_number: number | null
}

export default function GroupShedulePage({ params }: {params: Promise<{id: string}>}) {
  // Распаковываем Promise
  const { id } = use(params);
  const groupId = parseInt(id);
  
  // Ссылка на цветной пикер (скрытый input)
  const newLessonColorInput = useRef<HTMLInputElement>(null);
  const editLessonColorInput = useRef<HTMLInputElement>(null);

  const [groupNumber, setGroupNumber]  = useState<number>();
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpenModalCreateLesson, setOpenModalCreateLesson] = useState<boolean>(false);
  const [lessons, setLessons] = useState<LessonSelect[] | null>(null);
  const [editedLesson, setEditedLesson] = useState<Lesson | null>(null);
  // Храним выделенную ячейку
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  // Храним при создании цвет
  const [newLessonColor, setNewLessonColor] = useState('#3b82f6');
  const [createLessonError, setCreateLessonError] = useState<string>("");
  
  // Состояния для изменения уроков
  const [isOpenModalEditLesson, setOpenModalEditLesson] = useState<boolean>(false);
  const [editSelectedDay, setEditSelectedDay] = useState<string>("");
  const [editSelectedTime, setEditSelectedTime] = useState<string>("");
  const [editLessonColor, setEditLessonColor] = useState<string>("");

  const fetchGroupLesson = useCallback(async (id: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/lessons/${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const lessonsData: LessonSelect[] = await response.json();
      
      setLessons(lessonsData);
      console.log("Уроки загружены:", lessons);
    } catch (error) {
      console.error("Ошибка загрузки уроков:", error);
      setError("Не удалось загрузить уроки группы");
      setLessons(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // Пустой массив - функция создается один раз

  const fetchGroup = useCallback(async (groupId: number) => {
    try {
      setError(null);
      const response = await fetch(`/api/groups/${groupId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setGroup(null);
          return;
        }
        throw new Error(`Ошибка: ${response.status}`);
      }
      const groupData: Group = await response.json();
      console.log(groupData)
      setGroup(groupData);
    } catch (error) {
      console.error("Ошибка загрузки группы:", error);
      setError("Не удалось загрузить данные группы");
      setGroup(null);
    }
  }, []);

  useEffect(() => {
    console.log("useEffect сработал, groupId:", groupId);
    
    if (!groupId) {
      console.log("groupId отсутствует");
      setIsLoading(false);
      setError("Номер группы не указан");
      return;
    }
    
    console.log("Начинаем загрузку данных...");
    
    // Устанавливаем номер группы
    setGroupNumber(groupId);
    
    // Загружаем данные
    const loadData = async () => {
      try {
        await Promise.all([
          fetchGroup(groupId),
          fetchGroupLesson(groupId)
        ]);
        console.log("Все данные загружены");
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
      }
    };
    
    loadData();
    
  }, [groupId, fetchGroup, fetchGroupLesson]);

  
  // Фукнция открытия модального окна создания урока
  function openModalCreateLesson(day: string | null = null, time: string | null = null){
    if (day) setSelectedDay(day);
    if (time) setSelectedTime(time);
    setOpenModalCreateLesson(true);
  }

  // Фукнция закрытия модального окна создания урока
  function closeModalCreateLesson(){
    setSelectedDay("");
    setSelectedTime("");
    setOpenModalCreateLesson(false);
  }

  // Функция открытия модального окна изменения урока
  function openModalEditLesson(day: string, time: string){
    if (day) setEditSelectedDay(day);
    if (time) setEditSelectedTime(time);
    const lesson = filterLesson(day, time);
    setEditedLesson(lesson || null);
    setOpenModalEditLesson(true);
  }

  // Функция закрытия модального окна изменения урока
  function closeModalEditLesson(){
    setEditSelectedDay("");
    setEditSelectedTime("");
    setOpenModalEditLesson(false);
    setEditLessonColor("");
  }

  // Функция для скрытия плашки ошибки создания
  function closeCreateLessonErrorMessage(){
    setCreateLessonError("");
  }

  // Функция создания урока
  const createLesson = async (lessonData: LessonFormData) => {
    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lessonData)
      })

      if (response.ok){
        closeModalCreateLesson();
        await Promise.all([
          fetchGroupLesson(groupId)
        ]);
      } else {
        const error = await response.json()
        setCreateLessonError(await error.error);
      }
    } catch (error) {
      console.log(error)
    }
  }

  // Получение урока по дню и времени
  const filterLesson = (day: string | null, time: string | null) => {
    if (day === null || time === null) return null;
    return lessons?.filter(item => item.day_week === day && item.time === time)[0];
  }

  // Функция изменения урока
  const editLesson = async (lessonData: LessonFormData, lessonId: number | undefined) => {
    try {
      const resp = fetch(`/api/lessons/edit/${lessonId}`);
    } catch {

    } finally {

    }
  }

  // Обработчик формы создания урока
  const handleSubmitCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newLessonData = {
      subject: formData.get('subject') as string,
      teacher: formData.get('teacher') as string,
      room: formData.get('room') as string,
      day: formData.get('day') as DayOfWeek,
      time: formData.get('time') as LessonTime,
      group_number: groupNumber as number,
      color: newLessonColorInput.current?.value as string
    }
    createLesson(newLessonData);
  }

  // Обработчик формы изменения урока
  const handleSubmitEditForm = async (e: React.FormEvent) => {
    e.preventDefault();

    // Получим id изменяемого урока
    const lessonId =  lessons?.filter(item => item.day_week === editSelectedDay && item.time === editSelectedTime)[0].id;
    const formData = new FormData(e.target as HTMLFormElement);
    const newLessonData = {
      subject: formData.get('subject') as string,
      teacher: formData.get('teacher') as string,
      room: formData.get('room') as string,
      day: formData.get('day') as DayOfWeek,
      time: formData.get('time') as LessonTime,
      group_number: groupNumber as number,
      color: newLessonColorInput.current?.value as string
    }
    editLesson(newLessonData, lessonId);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center w-full h-[100vh] bg-white">
        <div className="relative mb-4">
          {/* Тонкое кольцо */}
          <div className="animate-spin rounded-full h-16 w-16 border-2 border-transparent border-t-blue-500 border-r-transparent"></div>
        </div>
        <div className="text-gray-500 font-medium tracking-wide">Загрузка данных<span className="loading-dots"></span></div>
        <div className="mt-2 text-gray-400 text-sm">Пожалуйста, подождите</div>
      </div>
    );
  }

  if (!groupNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Группа не найдена</h1>
          <Link href="/">
            <button>Вернуться на главную</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {isOpenModalCreateLesson && (
        <Modal isOpen={isOpenModalCreateLesson} onClose={closeModalCreateLesson}
        title="Добавьте новое занятие">
          {createLessonError !== "" && (
            <div className="bg-red-600/30 h-12 mt-3 mb-5 rounded-xl flex items-center w-full justify-between pr-3">
              <div className="flex items-center h-full pl-3">
                <Ban className="text-red-600 mr-3"/>
                <p>{createLessonError}</p>
              </div>
              <X className="hover:cursor-pointer h-5" onClick={closeCreateLessonErrorMessage}></X>
            </div>
          )}
          <form onSubmit={handleSubmitCreateForm} className="space-y-6 flex flex-col">
            <div className="grid grid-cols-7 gap-5">
              <div className="col-span-6">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Предмет <span className="text-red-700">*</span></label>
                <input type="text" maxLength={100} id="subject" name="subject" placeholder="Введите название предмета" required 
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-400"
                />
              </div>
              <div className="col-span-1">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Цвет<span className="text-red-700">*</span></label>
                <div className="flex items-center w-full h-12">
                  <input type="color" ref={newLessonColorInput} id="color" value={newLessonColor}
                    onChange={(e) => setNewLessonColor(e.target.value)} 
                    className="cursor-pointer rounded-lg border border-gray-300 w-0 h-0"
                  />
                  <div className="h-10 w-10 aspect-square flex items-center gap-2"
                    onClick={() => newLessonColorInput.current?.click()}>
                    <div 
                      className="h-full w-full rounded-full border border-gray-300"
                      style={{ backgroundColor: newLessonColor }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-5">
              <div className="col-span-4">
                <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 mb-1">Учитель<span className="text-red-700">*</span></label>
                <input 
                  type="text" id="teacher" name="teacher" maxLength={100} placeholder="Имя преподавателя" required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-400" />
              </div>
              <div className="col-span-1">
                <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-1">Кабинет<span className="text-red-700">*</span></label>
                <input type="text" maxLength={6} id="room" name="room" placeholder="Номер" required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-400"/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label htmlFor="day" className="block text-sm font-medium text-gray-700 mb-1">День недели<span className="text-red-700">*</span></label>
                <select name="day" id="day" value={selectedDay} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-400">
                    <option value="" >Выберите день недели</option>
                    {dayWeekOptions.map((dayWeek) => (
                      <option key={dayWeek} value={dayWeek}>{dayWeek}</option>
                    ))}
                </select>
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Время<span className="text-red-700">*</span></label>
                <select name="time" id="time" value={selectedTime} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-400">
                    <option value="">Выберите время</option>
                    {lessonTimeOptions.map((lessonTime) => (
                      <option key={lessonTime} value={lessonTime}>{lessonTime}</option>
                    ))}
                </select>
              </div>
            </div>
            <button className="bg-[#6D6FF3] text-white py-2 px-7 rounded-lg w-max self-end hover:scale-95 duration-300 bg-opacity-70 hover:bg-opacity-100">Добавить</button>
          </form>
        </Modal>
      )}

      {isOpenModalEditLesson && (
        <Modal isOpen={isOpenModalEditLesson} onClose={closeModalEditLesson}
          title="Изменение занятия" size="md">
          <form action="" onSubmit={handleSubmitEditForm} className="space-y-6 flex flex-col">
            <div className="grid grid-cols-7 gap-5">
              <div className="col-span-6">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Предмет <span className="text-red-700">*</span></label>
                <input type="text" maxLength={100} id="subject" name="subject" placeholder="Введите название предмета" value={editedLesson?.subject || ""} required 
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-400"
                />
              </div>
              <div className="col-span-1">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Цвет<span className="text-red-700">*</span></label>
                <div className="flex items-center w-full h-12">
                  <input type="color" ref={editLessonColorInput} id="color" value={editedLesson?.color || "#000"}
                    onChange={(e) => setEditLessonColor(e.target.value)} 
                    className="cursor-pointer rounded-lg border border-gray-300 w-0 h-0"
                  />
                  <div className="h-10 w-10 aspect-square flex items-center gap-2"
                    onClick={() => editLessonColorInput.current?.click()}>
                    <div 
                      className="h-full w-full rounded-full border border-gray-300"
                      style={{ backgroundColor: editLessonColor || editedLesson?.color || "#000" }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-5">
              <div className="col-span-4">
                <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 mb-1">Учитель<span className="text-red-700">*</span></label>
                <input 
                  type="text" id="teacher" name="teacher" maxLength={100} placeholder="Имя преподавателя" value={editedLesson?.teacher || ""} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-400" />
              </div>
              <div className="col-span-1">
                <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-1">Кабинет<span className="text-red-700">*</span></label>
                <input type="text" maxLength={6} id="room" name="room" placeholder="Номер" value={editedLesson?.room || ""} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-400"/>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label htmlFor="day" className="block text-sm font-medium text-gray-700 mb-1">День недели<span className="text-red-700">*</span></label>
                <select name="day" id="day" value={editSelectedDay} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-400">
                    <option value="" >Выберите день недели</option>
                    {dayWeekOptions.map((dayWeek) => (
                      <option key={dayWeek} value={dayWeek}>{dayWeek}</option>
                    ))}
                </select>
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Время<span className="text-red-700">*</span></label>
                <select name="time" id="time" value={editSelectedTime} required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 placeholder-gray-400">
                    <option value="">Выберите время</option>
                    {lessonTimeOptions.map((lessonTime) => (
                      <option key={lessonTime} value={lessonTime}>{lessonTime}</option>
                    ))}
                </select>
              </div>
            </div>
            <button className="bg-[#6D6FF3] text-white py-2 px-7 rounded-lg w-max self-end hover:scale-95 duration-300 bg-opacity-70 hover:bg-opacity-100">Добавить</button>
          </form>
        </Modal>
      )}
      
      {group ? (
        <div className="w-screen h-screen flex items-center flex-col">
          <header className="border-b w-full">
            <div className="container mx-auto px-4 py-6 w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <Link href="/">
                    <button className="hover:bg-[#1cca5b] hover:text-white p-2 rounded-lg duration-300">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  </Link>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">
                      Расписание {group.number}
                    </h1>
                    <p className="text-muted-foreground">
                      {group.countStudent} студентов
                    </p>
                  </div>
                </div>
                <button
                  className="flex gap-2 items-center bg-[#6D6FF3] py-2.5 px-5 rounded-lg text-white text-sm font-semibold"
                  onClick={() => openModalCreateLesson("Понедельник", "08:30 - 10:10")}>
                  <Plus className="w-4 h-4 mr-2" />
                  <p>Добавить пару</p>
                </button>
              </div>
            </div>
          </header>
          <div className="w-full pb-8">
            <div className="bg-card border-y shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="bg-muted p-4 text-left font-semibold text-muted-foreground w-24 sticky left-0 z-10">
                        Время
                      </th>
                      {DAYS.map((day, dayIndex) => (
                        <th key={dayIndex} className="bg-[#6D6FF3] text-white text-primary-foreground p-4 text-center font-semibold min-w-[200px]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((timeSlot, timeIndex) => (
                      <tr key={timeIndex} className="border-t">
                        <td className="bg-muted p-4 font-medium text-sm text-muted-foreground sticky left-0 z-10 whitespace-nowrap">
                          {TIME_RANGES[timeSlot]}
                        </td>
                        {DAYS.map((day, dayIndex) => {
                          const lesson = lessons?.find(item => item.day_week == day && item.time?.startsWith(timeSlot));
                          return (
                            <td key={dayIndex} className="border-l p-1 relative">
                                {lesson ? (
                                  <div className="px-2 flex flex-col absolute top-2 shadow-md pt-1 bottom-2 left-1 right-1 rounded-md hover:-translate-y-1 duration-300 cursor-pointer hover:shadow-xl"
                                  style={{ borderLeft: `4px solid ${lesson.color}`}}
                                  onClick={() => openModalEditLesson(day, TIME_RANGES[timeSlot])}>
                                    <div className="flex gap-2 w-full justify-between">
                                      <p className="font-semibold text-sm">{lesson.subject}</p>
                                      <p className="text-sm bg-slate-200 py-0.5 px-2 rounded-md h-max min-w-12 text-center">{lesson.room}</p>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{lesson.teacher}</p>
                                  </div>
                                ) : (
                                  <div onClick={() => openModalCreateLesson(day, TIME_RANGES[timeSlot])} 
                                  className="h-full min-h-[100px] flex items-center justify-center text-muted-foreground/30 text-sm hover:bg-accent/30 transition-colors cursor-pointer">
                                    
                                  </div>
                                )}
                            </td>
                          ) 
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <EmptyPage message="Группа не найдена" />
      )}
    </div>
  );
}
