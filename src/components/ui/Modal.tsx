'use client';

import { X } from "lucide-react";
import React, { ReactNode, useState } from "react";


interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    type?: 'default'| 'error' | 'success' | 'warning'
}

export default function Modal({
    isOpen, onClose, title, children, 
    size = 'md', 
    type = 'default'
} : ModalProps){

    // Ничего не выводим если модальное закрыто
    if (!isOpen) return null;

    const widthClasses = {
        sm: 'w-1/5',
        md: 'w-2/5',
        lg: 'w-3/5',
        xl: 'w-4/5'
    };
    
    // Функция закрытия модального окна
    const closeModal = () => {
      // Выполняем фукнцию переданную от родителя
      onClose();
      // Дополнительные действия
      // ...
    }

    // Останавливаем всплытие (при клике на ребенка вылетает onclick на родительский)
    const stopPropogation = (e: React.MouseEvent) => {
      e.stopPropagation();
    }

    return (
      <div className="bg-black z-10 inset-0 fixed bg-opacity-50 w-screen h-screen flex items-center justify-center"
      onClick={closeModal}>
        <div className={`bg-white z-20 fixed ${widthClasses[size]} rounded-xl min-h-24`}
          onClick={stopPropogation}> 
          <div className="p-6">
            <div className="flex justify-between mb-5">
              <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
              <X className="hover:cursor-pointer" onClick={(e) => {
                e.stopPropagation();
                closeModal();
              }}></X>
            </div>
            <div>
              {children}
            </div>
          </div>
        </div>
      </div>
    )
}